export interface Profissional {
  id: string;
  obraId: string;
  nome: string;
  funcao?: string;
  equipe: string;
}

/**
 * Um lançamento de RDO Simplificado: uma equipe executando um serviço num
 * dia, com quantidade de diárias e área — a base pra calcular RUP
 * (diárias ÷ área) e custo por m² sem depender da planilha externa.
 *
 * Ajudante e profissional têm valor de diária diferente, então as diárias
 * e o preço são lançados separados por categoria — o custo total é a soma
 * dos dois (diárias × preço de cada um).
 */
export interface RegistroRdo {
  id: string;
  obraId: string;
  data: string; // yyyy-mm-dd
  equipe: string;
  servico: string;
  profissionaisIds: string[];
  areaM2: number;
  diariasAjudante: number;
  precoDiariaAjudante: number;
  diariasProfissional: number;
  precoDiariaProfissional: number;
  comentario: string;
  criadoEm: string; // ISO datetime
}

export function diariasTotais(r: Pick<RegistroRdo, "diariasAjudante" | "diariasProfissional">): number {
  return r.diariasAjudante + r.diariasProfissional;
}

export function custoTotalRdo(
  r: Pick<
    RegistroRdo,
    "diariasAjudante" | "precoDiariaAjudante" | "diariasProfissional" | "precoDiariaProfissional"
  >
): number {
  return r.diariasAjudante * r.precoDiariaAjudante + r.diariasProfissional * r.precoDiariaProfissional;
}
