import type { Obra } from "./types";
import { OBRA_SICREDI } from "./default-data";
// OBRA_AMAGGI segue disponível em default-data-amaggi.ts (planilha alimentada
// à parte) — descomente este import junto com o bloco abaixo quando a obra
// fechar e voltar a aparecer no app.
// import { OBRA_AMAGGI } from "./default-data-amaggi";

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
  // Amaggi ainda não fechou — tirado da listagem por pedido do Rodrigo.
  // Os dados continuam em default-data-amaggi.ts (alimentados via planilha
  // à parte); é só descomentar o bloco abaixo pra reincluir a obra aqui
  // quando ela fechar.
  // {
  //   id: "amaggi",
  //   nome: OBRA_AMAGGI.nome,
  //   cliente: OBRA_AMAGGI.cliente,
  //   localizacao: "Ariquemes - RO",
  //   status: "planejamento",
  //   descricao: "Próxima obra — planilha e cronograma prontos, aguardando início.",
  //   obra: OBRA_AMAGGI,
  // },
];

export function getObraMeta(id: string): ObraMeta | undefined {
  return OBRAS.find((o) => o.id === id);
}

export function obraExiste(id: string): boolean {
  return OBRAS.some((o) => o.id === id);
}
