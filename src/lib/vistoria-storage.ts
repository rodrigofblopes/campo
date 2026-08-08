import type { ContadoresVistoria, VistoriaObra } from "./vistoria-types";

const FILA_KEY = "campo:vistorias-pendentes";

type Pendente = { tipo: "nova" | "atualizacao"; obraId: string; vistoria: VistoriaObra };

function lerFila(): Pendente[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FILA_KEY);
    return raw ? (JSON.parse(raw) as Pendente[]) : [];
  } catch {
    return [];
  }
}

function salvarFila(fila: Pendente[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FILA_KEY, JSON.stringify(fila));
  } catch {
    // localStorage indisponível/cheio — segue sem persistir a fila
  }
}

function enfileirar(pendente: Pendente) {
  const fila = lerFila();
  fila.push(pendente);
  salvarFila(fila);
}

// Tenta algumas vezes antes de desistir — cobre quedas de sinal rápidas,
// comuns em obra. Erros do próprio servidor (4xx) não são repetidos.
async function fetchComTentativas(
  url: string,
  options: RequestInit,
  tentativas = 3
): Promise<Response | null> {
  for (let i = 0; i < tentativas; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) return res;
      if (res.status >= 400 && res.status < 500) return res;
    } catch {
      // falha de rede ou timeout — tenta de novo
    }
    if (i < tentativas - 1) {
      await new Promise((resolve) => setTimeout(resolve, 800 * (i + 1)));
    }
  }
  return null;
}

// Reenvia em segundo plano o que ficou pendente por falta de conexão.
async function sincronizarFila(): Promise<void> {
  const fila = lerFila();
  if (fila.length === 0) return;
  const restantes: Pendente[] = [];
  for (const pendente of fila) {
    const url =
      pendente.tipo === "nova"
        ? "/api/vistorias"
        : `/api/vistorias/${encodeURIComponent(pendente.vistoria.id)}`;
    const metodo = pendente.tipo === "nova" ? "POST" : "PATCH";
    try {
      const res = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pendente.vistoria),
      });
      if (!res.ok) restantes.push(pendente);
    } catch {
      restantes.push(pendente);
    }
  }
  salvarFila(restantes);
}

export async function getVistorias(obraId: string): Promise<VistoriaObra[]> {
  // dispara em segundo plano — não atrasa a leitura da lista
  void sincronizarFila();

  let doServidor: VistoriaObra[] = [];
  try {
    const res = await fetch(`/api/vistorias?obraId=${encodeURIComponent(obraId)}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = (await res.json()) as { vistorias?: VistoriaObra[] };
      doServidor = data.vistorias ?? [];
    }
  } catch {
    // sem conexão — segue só com o que estiver pendente localmente
  }

  const idsNoServidor = new Set(doServidor.map((v) => v.id));
  const pendentesLocais = lerFila()
    .filter((p) => p.obraId === obraId && p.tipo === "nova" && !idsNoServidor.has(p.vistoria.id))
    .map((p) => p.vistoria);

  return [...pendentesLocais, ...doServidor];
}

export async function salvarNovaVistoria(
  obraId: string,
  vistoria: VistoriaObra
): Promise<boolean> {
  const res = await fetchComTentativas("/api/vistorias", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(vistoria),
  });
  if (res && res.ok) return true;
  enfileirar({ tipo: "nova", obraId, vistoria });
  return false;
}

export async function atualizarVistoria(
  obraId: string,
  vistoria: VistoriaObra
): Promise<boolean> {
  const res = await fetchComTentativas(`/api/vistorias/${encodeURIComponent(vistoria.id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(vistoria),
  });
  if (res && res.ok) return true;
  enfileirar({ tipo: "atualizacao", obraId, vistoria });
  return false;
}

// Remove qualquer envio pendente dessa vistoria (não faz sentido reenviar
// algo que acabou de ser excluído) e tenta excluir no servidor.
export async function excluirVistoria(id: string): Promise<boolean> {
  const fila = lerFila().filter((p) => p.vistoria.id !== id);
  salvarFila(fila);

  const res = await fetchComTentativas(`/api/vistorias/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  return !!(res && res.ok);
}

export function contarPendencias(vistorias: VistoriaObra[]): ContadoresVistoria {
  const hoje = new Date().toISOString().slice(0, 10);
  const contadores: ContadoresVistoria = {
    pendente: 0,
    execucao: 0,
    concluido: 0,
    atrasado: 0,
  };

  for (const vistoria of vistorias) {
    for (const item of vistoria.itens) {
      if (item.status === "Concluído") contadores.concluido++;
      else if (item.prazo && item.prazo < hoje) contadores.atrasado++;
      else if (item.status === "Em execução") contadores.execucao++;
      else contadores.pendente++;
    }
  }

  return contadores;
}
