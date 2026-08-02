import type { Obra } from "./types";
import { OBRA_SICREDI } from "./default-data";
import { OBRA_AMAGGI } from "./default-data-amaggi";

export type StatusObra = "em_andamento" | "planejamento" | "concluida";

export interface ObraMeta {
  /** Usado na URL: /obras/[id] */
  id: string;
  nome: string;
  cliente?: string;
  localizacao?: string;
  status: StatusObra;
  descricao: string;
  /** Caminho da foto de capa em /public. Se ausente, o dashboard não mostra banner. */
  foto?: string;
  obra: Obra;
}

/**
 * Registro central de obras do Campo. Para incluir uma obra nova:
 * 1. Gerar os dados a partir da planilha (ver scripts/sync-from-excel.mjs)
 *    ou, enquanto não há apontamentos, criar um Obra vazio como o da Amaggi.
 * 2. Adicionar uma entrada aqui — a home (/) e as rotas /obras/[id]/* passam
 *    a funcionar automaticamente para essa obra.
 */
export const OBRAS: ObraMeta[] = [
  {
    id: "sicredi",
    nome: OBRA_SICREDI.nome,
    cliente: OBRA_SICREDI.cliente,
    status: "em_andamento",
    descricao: "Fase final de acabamento — acompanhamento diário de produtividade.",
    foto: "/obra-sicredi.jpeg",
    obra: OBRA_SICREDI,
  },
  {
    id: "amaggi",
    nome: OBRA_AMAGGI.nome,
    cliente: OBRA_AMAGGI.cliente,
    localizacao: "Ariquemes - RO",
    status: "planejamento",
    descricao: "Próxima obra — planilha e cronograma prontos, aguardando início.",
    // Sem foto ainda — adicionar quando houver um registro fotográfico real da obra.
    obra: OBRA_AMAGGI,
  },
];

export function getObraMeta(id: string): ObraMeta | undefined {
  return OBRAS.find((o) => o.id === id);
}

export function obraExiste(id: string): boolean {
  return OBRAS.some((o) => o.id === id);
}
