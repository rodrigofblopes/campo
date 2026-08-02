import type { Obra, Servico } from "./types";

export interface FrenteEstimativa {
  id: string;
  label: string;
  escopoM2: number;
  /** RUP de uma equipe (m²/dia), extraído do histórico real da obra de referência. */
  rupM2DiaEquipe: number | null;
  /** Quantidade de equipe-dias usada para calcular o RUP — quanto maior, mais confiável. */
  amostraDias: number;
  diasUmaEquipe: number | null;
  diasNEquipes: number | null;
}

function numPessoasEquipe(equipe: string): number {
  return equipe.split(/,| e /).map((s) => s.trim()).filter(Boolean).length;
}

function m2PorDia(totalM2: number, equipeDias: number): number | null {
  return equipeDias > 0 ? totalM2 / equipeDias : null;
}

/**
 * RUP para os 3 serviços de Plaqueamento Externo — só entram equipe-dias de
 * equipes com 2 pessoas (o modelo "1 montador + 1 ajudante"). Se não houver
 * amostra de equipes de 2 pessoas, cai para todas as equipes disponíveis.
 */
function rupPlaqueamentoExterno(obraRef: Obra, servico: Servico) {
  const rows = obraRef.registros.filter((r) => r.servico === servico);
  const doisPessoas = rows.filter((r) => numPessoasEquipe(r.equipe) === 2);
  const base = doisPessoas.length > 0 ? doisPessoas : rows;
  const totalM2 = base.reduce((s, r) => s + r.areaM2, 0);
  const equipeDias = new Set(base.map((r) => `${r.equipe}|${r.data}`)).size;
  return { rup: m2PorDia(totalM2, equipeDias), dias: equipeDias };
}

/**
 * RUP genérico para frentes sem campo "equipe" no histórico (Painéis
 * Internos, Plaqueamento Interno, Forro, Revestimentos) — soma área / dias
 * distintos com execução, assumindo uma frente de trabalho por dia.
 */
function rupGenerico(itens: { area: number; data?: string }[]) {
  const comData = itens.filter((i) => i.data && i.area > 0);
  const totalM2 = comData.reduce((s, i) => s + i.area, 0);
  const dias = new Set(comData.map((i) => i.data)).size;
  return { rup: m2PorDia(totalM2, dias), dias };
}

function montarFrente(
  id: string,
  label: string,
  escopoM2: number,
  rup: number | null,
  amostraDias: number,
  numEquipes: number
): FrenteEstimativa {
  const diasUmaEquipe = rup && rup > 0 && escopoM2 > 0 ? escopoM2 / rup : null;
  const diasNEquipes =
    diasUmaEquipe != null ? diasUmaEquipe / Math.max(1, numEquipes) : null;
  return { id, label, escopoM2, rupM2DiaEquipe: rup, amostraDias, diasUmaEquipe, diasNEquipes };
}

/**
 * Projeta o tempo de execução de `obraAlvo` (escopo, sem histórico de
 * produção ainda) usando as RUPs reais extraídas de `obraRef` (obra com
 * apontamentos de produção já lançados). Ex.: usar Sicredi como referência
 * para estimar prazo da Amaggi.
 */
export function calcularEstimativa(
  obraRef: Obra,
  obraAlvo: Obra,
  numEquipes: number
): FrenteEstimativa[] {
  const frentes: FrenteEstimativa[] = [];

  const escopoExt = obraAlvo.escopo.reduce((s, e) => s + e.areaTotalM2, 0);
  const SERVICOS_EXTERNOS: { id: string; servico: Servico }[] = [
    { id: "glasroc", servico: "Plaqueamento Glasroc-x" },
    { id: "juntas", servico: "Tratamento de Juntas" },
    { id: "basecoat", servico: "Basecoat" },
  ];
  for (const { id, servico } of SERVICOS_EXTERNOS) {
    const { rup, dias } = rupPlaqueamentoExterno(obraRef, servico);
    frentes.push(montarFrente(id, servico, escopoExt, rup, dias, numEquipes));
  }

  const rupPaineis = rupGenerico(
    (obraRef.paredesDrywall ?? []).map((p) => ({ area: p.areaM2 ?? 0, data: p.dataExecucao }))
  );
  const escopoPaineis = (obraAlvo.paredesDrywall ?? []).reduce((s, p) => s + (p.areaM2 ?? 0), 0);
  frentes.push(
    montarFrente("paineis", "Painéis Internos (montagem)", escopoPaineis, rupPaineis.rup, rupPaineis.dias, numEquipes)
  );

  const rupInterno = rupGenerico(
    (obraRef.paredesInterno ?? []).map((p) => ({
      area: (p.performaM2 ?? 0) + (p.ruM2 ?? 0),
      data: p.dataExecucao,
    }))
  );
  const escopoInterno = (obraAlvo.paredesInterno ?? []).reduce(
    (s, p) => s + (p.performaM2 ?? 0) + (p.ruM2 ?? 0),
    0
  );
  frentes.push(
    montarFrente(
      "interno",
      "Plaqueamento Interno (Performa/RU)",
      escopoInterno,
      rupInterno.rup,
      rupInterno.dias,
      numEquipes
    )
  );

  const rupForro = rupGenerico(
    (obraRef.forro ?? []).map((f) => ({ area: f.areaM2, data: f.dataPlaqueamento ?? f.dataEstruturacao }))
  );
  const escopoForro = (obraAlvo.forro ?? []).reduce((s, f) => s + f.areaM2, 0);
  frentes.push(montarFrente("forro", "Forro", escopoForro, rupForro.rup, rupForro.dias, numEquipes));

  const rupRevest = rupGenerico(
    (obraRef.apontamentosPorcelanato ?? []).map((a) => ({ area: a.areaExecutadaM2, data: a.dataExecucao }))
  );
  const escopoRevest = (obraAlvo.tiposPorcelanato ?? []).reduce((s, t) => s + t.areaTotalM2, 0);
  frentes.push(
    montarFrente("revest", "Revestimentos", escopoRevest, rupRevest.rup, rupRevest.dias, numEquipes)
  );

  return frentes;
}
