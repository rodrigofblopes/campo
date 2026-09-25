export type PrioridadePendencia = "Baixa" | "Média" | "Alta";
export type StatusPendencia = "Pendente" | "Em execução" | "Concluído";

export const EQUIPES = [
  "Estrutura (Steel Frame)",
  "Elétrica",
  "Hidráulica",
  "Drywall",
  "Pintura",
  "Esquadrias",
  "Piso Vinílico",
  "Acabamento",
  "Civil",
  "Vidros",
  "Grama",
  "Comunicação Visual",
  "Pavers",
  "Outros",
] as const;

export interface PendenciaVistoria {
  id: string;
  local: string;
  responsavel: string;
  equipe?: string;
  /** Descontinuado: todas as tarefas têm prioridade máxima. Mantido opcional
   * só para não quebrar vistorias antigas que ainda trazem o campo. */
  prioridade?: PrioridadePendencia;
  inicioPrevisto?: string; // yyyy-mm-dd
  prazo: string; // yyyy-mm-dd
  descricao: string;
  foto: string | null; // dataURL (foto do problema)
  foto2?: string | null; // dataURL (2ª foto opcional, p/ identificação)
  status: StatusPendencia;
  fotoDepois: string | null; // dataURL (foto de conclusão)
  concluidoEm: string | null; // ISO datetime
}

/** Limite de fotos do problema por pendência (não obrigatório). */
export const MAX_FOTOS_PENDENCIA = 2;

/** Fotos do problema (antes) da pendência, na ordem — 0, 1 ou 2. */
export function fotosPendencia(item: Pick<PendenciaVistoria, "foto" | "foto2">): string[] {
  return [item.foto, item.foto2].filter((f): f is string => Boolean(f));
}

/** Converte uma lista de fotos de volta para os campos foto/foto2. */
export function patchFotos(fotos: string[]): Pick<PendenciaVistoria, "foto" | "foto2"> {
  return { foto: fotos[0] ?? null, foto2: fotos[1] ?? null };
}

export interface VistoriaObra {
  id: string;
  obraId: string;
  obraNome: string;
  responsavelVistoria: string;
  data: string; // yyyy-mm-dd (preenchida automaticamente com o dia do registro)
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
