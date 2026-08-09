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
 */
export interface RegistroRdo {
  id: string;
  obraId: string;
  data: string; // yyyy-mm-dd
  equipe: string;
  servico: string;
  profissionaisIds: string[];
  areaM2: number;
  diarias: number;
  precoDiaria: number;
  comentario: string;
  criadoEm: string; // ISO datetime
}
