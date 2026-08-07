import type { ContadoresVistoria, VistoriaObra } from "./vistoria-types";

function chave(obraId: string): string {
  return `campo:vistorias:${obraId}`;
}

export function getVistorias(obraId: string): VistoriaObra[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(chave(obraId));
    return raw ? (JSON.parse(raw) as VistoriaObra[]) : [];
  } catch {
    return [];
  }
}

export function saveVistorias(obraId: string, lista: VistoriaObra[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(chave(obraId), JSON.stringify(lista));
}

export function salvarNovaVistoria(obraId: string, vistoria: VistoriaObra): void {
  const lista = getVistorias(obraId);
  lista.unshift(vistoria);
  saveVistorias(obraId, lista);
}

export function atualizarVistoria(obraId: string, vistoria: VistoriaObra): void {
  const lista = getVistorias(obraId);
  const idx = lista.findIndex((v) => v.id === vistoria.id);
  if (idx === -1) return;
  lista[idx] = vistoria;
  saveVistorias(obraId, lista);
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
