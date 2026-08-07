export type PrioridadePendencia = "Baixa" | "Média" | "Alta";
export type StatusPendencia = "Pendente" | "Em execução" | "Concluído";

export interface PendenciaVistoria {
  id: string;
  local: string;
  responsavel: string;
  prioridade: PrioridadePendencia;
  prazo: string; // yyyy-mm-dd
descricao: string;
  foto: string | null; // dataURL (foto do problema)
status: StatusPendencia;
  fotoDepois: string | null; // dataURL (foto de conclusão)
concluidoEm: string | null; // ISO datetime
}

export interface VistoriaObra {
  id: string;
  obraId: string;
  obraNome: string;
  responsavelVistoria: string;
  data: string; // yyyy-mm-dd
criadoEm: string; // ISO datetime
itens: PendenciaVistoria[];
}

export interface ContadoresVistoria {
  pendente: number;
  execucao: number;
  concluido: number;
  atrasado: number;
}

export function statusEfetivo(item: PendenciaVistoria, hojeISO: string): StatusPendencia | "Atrasado" {
  if (item.status === "Concluído") return "Concluído";
  if (item.prazo && item.prazo < hojeISO) return "Atrasado";
  return item.status;
}
