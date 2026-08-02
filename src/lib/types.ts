export type Servico =
  | "Plaqueamento Glasroc-x"
  | "Tratamento de Juntas"
  | "Basecoat"
  | "Assentamento de Porcelanato"
  | "Paredes de Drywall"
  | "Plaqueamento Performa"
  | "Plaqueamento RU"
  | "Forro";

export interface RegistroProducao {
  id: string;
  equipe: string;
  localizacao: string;
  data: string;
  servico: Servico;
  areaM2: number;
  observacao?: string;
}

export interface ConfigEquipe {
  jornadaHoras: number;
  montadores: number;
  ajudantes: number;
  dias: number;
}

export interface AnaliseProdutividade {
  config: ConfigEquipe;
  areaRealizada: number;
}

export interface ResultadoAnalise {
  areaRealizada: number;
  dias: number;
  produtividadeDiaria: number;
  totalHorasProfissional: number;
  totalHorasServente: number;
  produtividadeM2HProf: number;
  produtividadeM2HServ: number;
  rupHorasProf: number;
  rupHorasServ: number;
}

export interface ResumoLocalizacao {
  localizacao: string;
  servico: Servico;
  areaM2: number;
  dias: number;
  rupDiario: number;
  equipes: string[];
  observacao?: string;
}

export interface EscopoLocalizacao {
  localizacao: string;
  areaTotalM2: number;
}

/** Total e produzido por local × serviço (aba Quantitativos da planilha). */
export interface QuantitativoServico {
  localizacao: string;
  servico: Servico;
  totalM2: number;
}

export type StatusParedeDrywall = "pendente" | "em_andamento" | "concluida";

/** Parede numerada na planta baixa de drywall */
export interface ParedeDrywall {
  id: string;
  /** Número/código na planta — ex.: "01", "Parede 12" */
  codigo: string;
  pavimento?: string;
  ambiente?: string;
  comprimentoM?: number;
  alturaM?: number;
  areaM2?: number;
  espessuraMm?: number;
  tipo?: string;
  observacao?: string;
  status: StatusParedeDrywall;
  /** Data em que a parede foi executada (aba Parede Drywall) */
  dataExecucao?: string;
}

/** Parede com escopo de placas Performa e/ou RU (aba Plaqueamento Interno) */
export interface ParedePlaqueamentoInterno {
  id: string;
  /** Número drywall (01–19) ou código steel (PS1, PS6X, …) */
  codigo: string;
  tipo: "drywall" | "steel";
  areaM2?: number;
  performaM2?: number;
  ruM2?: number;
  /** Data de execução quando houver apontamento na planilha */
  dataExecucao?: string;
}

/** Tipo de porcelanato com área total (aba Porcelanato) */
export interface TipoPorcelanato {
  id: string;
  descricao: string;
  areaTotalM2: number;
}

/** Apontamento de área executada por tipo e data */
export interface ApontamentoPorcelanato {
  id: string;
  tipoId: string;
  areaExecutadaM2: number;
  dataExecucao: string;
}

/**
 * Ambiente de forro (aba "Forro " da planilha). Duas etapas por ambiente:
 * estruturação (perfis) e plaqueamento (fechamento) — cada uma com sua data.
 */
export interface AmbienteForro {
  id: string;
  ambiente: string;
  areaM2: number;
  dataEstruturacao?: string;
  dataPlaqueamento?: string;
}

export interface ProgressoLocal {
  localizacao: string;
  areaTotalM2: number;
  servicos: Partial<
    Record<
      Servico,
      {
        areaProduzida: number;
        percentual: number;
        areaRestante: number;
        semEscopo: boolean;
      }
    >
  >;
}

export interface Obra {
  id: string;
  nome: string;
  cliente?: string;
  dataInicio?: string;
  escopo: EscopoLocalizacao[];
  /** Quantitativos por serviço — quando preenchido, substitui escopo legado no cálculo de %. */
  quantitativos?: QuantitativoServico[];
  /** Cadastro de paredes da planta baixa drywall */
  paredesDrywall?: ParedeDrywall[];
  /** Paredes drywall + steel com escopo Performa/RU */
  paredesInterno?: ParedePlaqueamentoInterno[];
  tiposPorcelanato?: TipoPorcelanato[];
  apontamentosPorcelanato?: ApontamentoPorcelanato[];
  /** Ambientes de forro (aba Forro) */
  forro?: AmbienteForro[];
  registros: RegistroProducao[];
  resumos: ResumoLocalizacao[];
  observacoesGerais?: string;
}

export { SERVICOS, SERVICOS_ATIVOS, SERVICOS_PLAQUEAMENTO } from "./servicos";
