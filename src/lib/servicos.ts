import type { Servico } from "./types";

export type GrupoServico =
  | "Plaqueamento Externo"
  | "Porcelanato"
  | "Drywall"
  | "Plaqueamento Interno"
  | "Forro";

export type StatusServico = "ativo" | "futuro";

export interface ServicoConfig {
  id: Servico;
  label: string;
  grupo: GrupoServico;
  grupoLabel: string;
  /** Usa a aba Serviços (m² por local) para calcular % executado */
  usaEscopoPlaca: boolean;
  status: StatusServico;
  descricao: string;
}

export const GRUPOS_SERVICO: { id: GrupoServico; label: string; descricao: string }[] = [
  {
    id: "Plaqueamento Externo",
    label: "Plaqueamento externo",
    descricao: "Glasroc-x, tratamento de juntas e basecoat",
  },
  {
    id: "Porcelanato",
    label: "Assentamento de Porcelanato",
    descricao: "Revestimento cerâmico — em execução",
  },
  {
    id: "Drywall",
    label: "Painéis Internos",
    descricao: "Levantamento e acabamento de painéis — em execução",
  },
  {
    id: "Plaqueamento Interno",
    label: "Plaqueamento Interno",
    descricao: "Placas Performa e RU — paredes drywall e steel frame",
  },
  {
    id: "Forro",
    label: "Forro",
    descricao: "Estruturação e plaqueamento de forro por ambiente",
  },
];

export const SERVICOS_CONFIG: ServicoConfig[] = [
  {
    id: "Plaqueamento Glasroc-x",
    label: "Glasroc-x",
    grupo: "Plaqueamento Externo",
    grupoLabel: "Plaqueamento externo",
    usaEscopoPlaca: true,
    status: "ativo",
    descricao: "Fixação de placas Glasroc-x",
  },
  {
    id: "Tratamento de Juntas",
    label: "Tratamento de Juntas",
    grupo: "Plaqueamento Externo",
    grupoLabel: "Plaqueamento externo",
    usaEscopoPlaca: true,
    status: "ativo",
    descricao: "Tratamento de juntas entre placas",
  },
  {
    id: "Basecoat",
    label: "Basecoat",
    grupo: "Plaqueamento Externo",
    grupoLabel: "Plaqueamento externo",
    usaEscopoPlaca: true,
    status: "ativo",
    descricao: "Aplicação de basecoat",
  },
  {
    id: "Assentamento de Porcelanato",
    label: "Assentamento de Porcelanato",
    grupo: "Porcelanato",
    grupoLabel: "Porcelanato",
    usaEscopoPlaca: false,
    status: "ativo",
    descricao: "Assentamento de porcelanato",
  },
  {
    id: "Paredes de Drywall",
    label: "Painéis Internos",
    grupo: "Drywall",
    grupoLabel: "Painéis Internos",
    usaEscopoPlaca: false,
    status: "ativo",
    descricao: "Painéis internos (drywall)",
  },
  {
    id: "Plaqueamento Performa",
    label: "Plaqueamento Performa",
    grupo: "Plaqueamento Interno",
    grupoLabel: "Plaqueamento Interno",
    usaEscopoPlaca: false,
    status: "ativo",
    descricao: "Placas Performa — paredes drywall e steel",
  },
  {
    id: "Plaqueamento RU",
    label: "Plaqueamento RU",
    grupo: "Plaqueamento Interno",
    grupoLabel: "Plaqueamento Interno",
    usaEscopoPlaca: false,
    status: "ativo",
    descricao: "Placas RU — paredes drywall e steel",
  },
  {
    id: "Forro",
    label: "Forro",
    grupo: "Forro",
    grupoLabel: "Forro",
    usaEscopoPlaca: false,
    status: "ativo",
    descricao: "Estruturação e plaqueamento de forro por ambiente",
  },
];

export const SERVICOS: Servico[] = SERVICOS_CONFIG.map((s) => s.id);

export const SERVICOS_ATIVOS = SERVICOS_CONFIG.filter((s) => s.status === "ativo").map(
  (s) => s.id
);

export const SERVICOS_PLAQUEAMENTO = SERVICOS_CONFIG.filter(
  (s) => s.grupo === "Plaqueamento Externo"
).map((s) => s.id);

export const SERVICOS_INTERNO = SERVICOS_CONFIG.filter(
  (s) => s.grupo === "Plaqueamento Interno"
).map((s) => s.id);

export function getServicoConfig(servico: Servico): ServicoConfig {
  const cfg = SERVICOS_CONFIG.find((s) => s.id === servico);
  if (!cfg) throw new Error(`Serviço não configurado: ${servico}`);
  return cfg;
}

export function servicoUsaEscopo(servico: Servico): boolean {
  return getServicoConfig(servico).usaEscopoPlaca;
}

export function servicosPorGrupo(grupo: GrupoServico): ServicoConfig[] {
  return SERVICOS_CONFIG.filter((s) => s.grupo === grupo);
}

export function labelServico(servico: Servico): string {
  return getServicoConfig(servico).label;
}
