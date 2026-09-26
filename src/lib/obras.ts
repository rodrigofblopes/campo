import type { Obra } from "./types";
import { OBRA_SICREDI } from "./default-data";
import { OBRA_LOJA_ESPACO_SMART } from "./default-data-loja-espaco-smart";
import {
  OBRA_ECOVILLE_ANDRESSA_ERIC,
  OBRA_ECOVILLE_FABIO_BRUNIELLY,
  OBRA_ECOVILLE_JUNIOR_SUEN,
  OBRA_ECOVILLE_MARGARETH_ADEMAR,
} from "./default-data-ecoville";
import { hrefObra } from "./grupos-nav";
// OBRA_AMAGGI segue disponível em default-data-amaggi.ts (planilha alimentada
// à parte) — descomente este import junto com o bloco abaixo quando a obra
// fechar e voltar a aparecer no app.
// import { OBRA_AMAGGI } from "./default-data-amaggi";

export type StatusObra = "em_andamento" | "planejamento" | "concluida";

/** Abas que podem ser desativadas por obra — ver `abasDesativadas` em ObraMeta. */
export type AbaObra =
  | "produtividade"
  | "rdo"
  | "vistoria"
  | "historico"
  | "pcp";

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
  /**
   * Abas desativadas para esta obra — somem do menu e ficam bloqueadas
   * mesmo por URL direta. Por padrão (ausente/vazio) a obra tem todas as
   * abas. Ex.: obras pequenas, sem apontamento de produtividade nem RDO.
   */
  abasDesativadas?: AbaObra[];
  /** Preenchido quando a obra faz parte de um condomínio/grupo (ver GRUPOS_OBRA)
   * — some da listagem principal da home e passa a aparecer dentro do card
   * do grupo, em /grupos/[grupoId]. */
  grupoId?: string;
  obra: Obra;
}

/** Um condomínio/empreendimento que agrupa várias obras — cada uma com seu
 * próprio card em /grupos/[grupoId], em vez de aparecer solta na home. */
export interface GrupoObra {
  /** Usado na URL: /grupos/[id] */
  id: string;
  nome: string;
  descricao?: string;
}

export const GRUPOS_OBRA: GrupoObra[] = [
  {
    id: "ecoville",
    nome: "Ecoville",
    descricao: "Condomínio Ecoville — Steel Frame",
  },
];

export function getGrupo(id: string): GrupoObra | undefined {
  return GRUPOS_OBRA.find((g) => g.id === id);
}

/** Obras que aparecem soltas na home (sem grupo). */
export function obrasSemGrupo(): ObraMeta[] {
  return OBRAS.filter((o) => !o.grupoId);
}

/** Obras de um grupo/condomínio específico, na ordem cadastrada. */
export function obrasDoGrupo(grupoId: string): ObraMeta[] {
  return OBRAS.filter((o) => o.grupoId === grupoId);
}

export function obraTemAba(obraMeta: ObraMeta, aba: AbaObra): boolean {
  return !obraMeta.abasDesativadas?.includes(aba);
}

/**
 * Pra onde mandar a pessoa quando ela cai numa aba indisponível — a melhor
 * opção que ainda está ativa pra essa obra (Vistoria, senão Produtividade,
 * senão a troca de obra). Usado pelo botão da tela de aba indisponível.
 */
export function melhorDestinoDisponivel(
  obraId: string,
  obraMeta: ObraMeta
): { href: string; label: string } {
  if (obraTemAba(obraMeta, "vistoria")) {
    return { href: hrefObra(obraId, "/vistoria"), label: "Ir para Vistoria" };
  }
  if (obraTemAba(obraMeta, "produtividade")) {
    return { href: hrefObra(obraId), label: "Ir para Produtividade" };
  }
  return { href: "/", label: "Trocar de obra" };
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
    status: "concluida",
    descricao: "Obra entregue — fica só o dashboard de produtividade, pra consulta.",
    foto: "/obra-sicredi.jpeg",
    // Obra já entregue — some o dia a dia de campo (vistoria, histórico, PCP,
    // RDO) e fica só a Produtividade, trancada como já estava.
    abasDesativadas: ["vistoria", "historico", "pcp", "rdo"],
    obra: OBRA_SICREDI,
  },
  {
    id: "loja-espaco-smart-pvh",
    nome: OBRA_LOJA_ESPACO_SMART.nome,
    cliente: OBRA_LOJA_ESPACO_SMART.cliente,
    localizacao: "Porto Velho - RO",
    status: "em_andamento",
    descricao: "Steel Frame — acompanhamento diário de produtividade.",
    abasDesativadas: ["produtividade", "rdo"],
    obra: OBRA_LOJA_ESPACO_SMART,
  },
  // As 4 casas do condomínio Ecoville — agrupadas em /grupos/ecoville.
  // Cada uma só tem Vistoria, Histórico e PCP Semanal (sem Produtividade
  // nem RDO).
  {
    id: "ecoville-andressa-eric",
    nome: OBRA_ECOVILLE_ANDRESSA_ERIC.nome,
    cliente: OBRA_ECOVILLE_ANDRESSA_ERIC.cliente,
    status: "em_andamento",
    descricao: "Steel Frame — condomínio Ecoville.",
    grupoId: "ecoville",
    abasDesativadas: ["produtividade", "rdo"],
    obra: OBRA_ECOVILLE_ANDRESSA_ERIC,
  },
  {
    id: "ecoville-fabio-brunielly",
    nome: OBRA_ECOVILLE_FABIO_BRUNIELLY.nome,
    cliente: OBRA_ECOVILLE_FABIO_BRUNIELLY.cliente,
    status: "em_andamento",
    descricao: "Steel Frame — condomínio Ecoville.",
    grupoId: "ecoville",
    abasDesativadas: ["produtividade", "rdo"],
    obra: OBRA_ECOVILLE_FABIO_BRUNIELLY,
  },
  {
    id: "ecoville-junior-suen",
    nome: OBRA_ECOVILLE_JUNIOR_SUEN.nome,
    cliente: OBRA_ECOVILLE_JUNIOR_SUEN.cliente,
    status: "em_andamento",
    descricao: "Steel Frame — condomínio Ecoville.",
    grupoId: "ecoville",
    abasDesativadas: ["produtividade", "rdo"],
    obra: OBRA_ECOVILLE_JUNIOR_SUEN,
  },
  {
    id: "ecoville-margareth-ademar",
    nome: OBRA_ECOVILLE_MARGARETH_ADEMAR.nome,
    cliente: OBRA_ECOVILLE_MARGARETH_ADEMAR.cliente,
    status: "em_andamento",
    descricao: "Steel Frame — condomínio Ecoville.",
    grupoId: "ecoville",
    abasDesativadas: ["produtividade", "rdo"],
    obra: OBRA_ECOVILLE_MARGARETH_ADEMAR,
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
 
 
