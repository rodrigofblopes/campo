import type { ContadoresVistoria, VistoriaObra } from "./vistoria-types";

export async function getVistorias(obraId: string): Promise<VistoriaObra[]> {
  try {
    const res = await fetch(`/api/vistorias?obraId=${encodeURIComponent(obraId)}`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { vistorias?: VistoriaObra[] };
    return data.vistorias ?? [];
  } catch {
    return [];
  }
}

export async function salvarNovaVistoria(
  obraId: string,
  vistoria: VistoriaObra
): Promise<boolean> {
  try {
    const res = await fetch("/api/vistorias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(vistoria),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function atualizarVistoria(
  obraId: string,
  vistoria: VistoriaObra
): Promise<boolean> {
  try {
    const res = await fetch(`/api/vistorias/${encodeURIComponent(vistoria.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(vistoria),
    });
    return res.ok;
  } catch {
    return false;
  }
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
