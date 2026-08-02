import type { Obra, ProgressoLocal, ResumoLocalizacao, Servico } from "./types";
import {
  areaExecutadaServico,
  formatarNumero,
  percentualGeralObra,
} from "./calculations";
import { totalEscopoServico } from "./escopo";
import { normalizarLocalizacao } from "./localizacoes";
import {
  areaExecutadaParedes,
  areaTotalParedes,
} from "./paredes-drywall";
import {
  areaExecutadaPorcelanato,
  areaTotalPorcelanato,
  percentualPorcelanato,
} from "./porcelanato";
import {
  areaExecutadaForro,
  areaTotalForro,
  percentualForro,
} from "./forro";
import type { GrupoServico } from "./servicos";
import {
  SERVICOS,
  SERVICOS_INTERNO,
  SERVICOS_PLAQUEAMENTO,
  getServicoConfig,
} from "./servicos";

export interface ResumoFrenteDashboard {
  id: GrupoServico;
  label: string;
  percentual: number;
  executado: number;
  escopo: number;
  restante: number;
  ativo: boolean;
  detalhe?: string;
}

export interface LocalRanking {
  localizacao: string;
  escopo: number;
  executado: number;
  restante: number;
  percentual: number;
  rupDiario: number;
}

export interface DestaquesDashboard {
  maisAtrasada: { localizacao: string; percentual: number; restante: number } | null;
  melhorRup: { localizacao: string; rupDiario: number } | null;
  ultimoApontamento: { data: string; localizacao: string; areaM2: number } | null;
}

export function dataAtualizacaoObra(obra: Obra): string | null {
  const match = obra.observacoesGerais?.match(/\((\d{2}\/\d{2}\/\d{4})\)/);
  return match?.[1] ?? null;
}

export function resumoFrentesDashboard(obra: Obra): ResumoFrenteDashboard[] {
  const pctsExt = SERVICOS_PLAQUEAMENTO.map((s) => percentualGeralObra(obra, s));
  const pctExt =
    pctsExt.length > 0
      ? Math.round((pctsExt.reduce((a, b) => a + b, 0) / pctsExt.length) * 10) / 10
      : 0;
  // Escopo de fachada é único — Glasroc, juntas e basecoat medem a mesma área (m² de face).
  const escopoExt = totalEscopoServico(obra, "Plaqueamento Glasroc-x");
  const execsExt = SERVICOS_PLAQUEAMENTO.map((s) => areaExecutadaServico(obra, s));
  const execExt =
    execsExt.length > 0
      ? Math.round((execsExt.reduce((a, b) => a + b, 0) / execsExt.length) * 100) / 100
      : 0;

  const tipos = obra.tiposPorcelanato ?? [];
  const apont = obra.apontamentosPorcelanato ?? [];
  const escopoPorc = areaTotalPorcelanato(tipos);
  const execPorc = areaExecutadaPorcelanato(apont);

  const paredes = obra.paredesDrywall ?? [];
  const escopoDw = areaTotalParedes(paredes);
  const execDw = areaExecutadaParedes(paredes);
  const pctDw =
    escopoDw > 0 ? Math.min(100, Math.round((execDw / escopoDw) * 1000) / 10) : 0;
  const concluidas = paredes.filter((p) => p.status === "concluida" || p.dataExecucao).length;

  const escopoPerf = totalEscopoServico(obra, "Plaqueamento Performa");
  const escopoRU = totalEscopoServico(obra, "Plaqueamento RU");
  const execPerf = areaExecutadaServico(obra, "Plaqueamento Performa");
  const execRU = areaExecutadaServico(obra, "Plaqueamento RU");
  const escopoInt = escopoPerf + escopoRU;
  const execInt = execPerf + execRU;
  const pctInt =
    escopoInt > 0 ? Math.min(100, Math.round((execInt / escopoInt) * 1000) / 10) : 0;
  const paredesInterno = obra.paredesInterno ?? [];
  const internoComData = paredesInterno.filter((p) => p.dataExecucao).length;

  const forro = obra.forro ?? [];
  const escopoForro = areaTotalForro(forro);
  const execForro = areaExecutadaForro(forro);
  const forroConcluidos = forro.filter((f) => f.dataPlaqueamento).length;

  return [
    {
      id: "Plaqueamento Externo",
      label: "Plaqueamento externo",
      percentual: pctExt,
      executado: execExt,
      escopo: escopoExt,
      restante: Math.max(0, escopoExt - execExt),
      ativo: true,
      detalhe: "Glasroc-x · Juntas · Basecoat",
    },
    {
      id: "Porcelanato",
      label: "Porcelanato",
      percentual: percentualPorcelanato(tipos, apont),
      executado: execPorc,
      escopo: escopoPorc,
      restante: Math.max(0, escopoPorc - execPorc),
      ativo: true,
    },
    {
      id: "Drywall",
      label: "Painéis internos",
      percentual: pctDw,
      executado: execDw,
      escopo: escopoDw,
      restante: Math.max(0, escopoDw - execDw),
      ativo: true,
      detalhe: `${concluidas}/${paredes.length} painéis`,
    },
    {
      id: "Plaqueamento Interno",
      label: "Plaqueamento interno",
      percentual: pctInt,
      executado: execInt,
      escopo: escopoInt,
      restante: Math.max(0, escopoInt - execInt),
      ativo: escopoInt > 0,
      detalhe:
        escopoInt > 0
          ? `Performa · RU · ${internoComData}/${paredesInterno.length} com apontamento`
          : "A iniciar",
    },
    {
      id: "Forro",
      label: "Forro",
      percentual: percentualForro(forro),
      executado: execForro,
      escopo: escopoForro,
      restante: Math.max(0, escopoForro - execForro),
      ativo: escopoForro > 0,
      detalhe: `${forroConcluidos}/${forro.length} ambientes plaqueados`,
    },
  ];
}

export function rankingLocalizacoesGlasroc(
  progresso: ProgressoLocal[],
  resumos: ResumoLocalizacao[]
): LocalRanking[] {
  return progresso
    .map((p) => {
      const prog = p.servicos["Plaqueamento Glasroc-x"];
      const resumo = resumos.find(
        (r) =>
          r.servico === "Plaqueamento Glasroc-x" &&
          normalizarLocalizacao(r.localizacao) === normalizarLocalizacao(p.localizacao)
      );
      return {
        localizacao: p.localizacao,
        escopo: p.areaTotalM2,
        executado: prog?.areaProduzida ?? 0,
        restante: prog?.areaRestante ?? 0,
        percentual: prog?.percentual ?? 0,
        rupDiario: resumo?.rupDiario ?? 0,
      };
    })
    .filter((l) => l.escopo > 0)
    .sort((a, b) => a.percentual - b.percentual);
}

export function calcularDestaques(
  obra: Obra,
  progresso: ProgressoLocal[],
  resumos: ResumoLocalizacao[]
): DestaquesDashboard {
  const ranking = rankingLocalizacoesGlasroc(progresso, resumos);
  const emAndamento = ranking.filter((l) => l.percentual > 0 && l.percentual < 100);
  const maisAtrasada =
    emAndamento.length > 0
      ? emAndamento.reduce((min, l) => (l.percentual < min.percentual ? l : min))
      : ranking.find((l) => l.percentual < 100) ?? null;

  const resumosGlasroc = resumos.filter(
    (r) => r.servico === "Plaqueamento Glasroc-x" && r.rupDiario > 0
  );
  const melhorRup =
    resumosGlasroc.length > 0
      ? resumosGlasroc.reduce((max, r) => (r.rupDiario > max.rupDiario ? r : max))
      : null;

  const ultimo =
    obra.registros.length > 0
      ? [...obra.registros].sort((a, b) => b.data.localeCompare(a.data))[0]
      : null;

  return {
    maisAtrasada: maisAtrasada
      ? {
          localizacao: maisAtrasada.localizacao,
          percentual: maisAtrasada.percentual,
          restante: maisAtrasada.restante,
        }
      : null,
    melhorRup: melhorRup
      ? { localizacao: melhorRup.localizacao, rupDiario: melhorRup.rupDiario }
      : null,
    ultimoApontamento: ultimo
      ? {
          data: ultimo.data,
          localizacao: ultimo.localizacao,
          areaM2: ultimo.areaM2,
        }
      : null,
  };
}

export function formatarDataCurta(data: string): string {
  return new Date(data + "T12:00:00").toLocaleDateString("pt-BR");
}

export { formatarNumero };

// ---------------------------------------------------------------------------
// Série histórica, previsão de conclusão, ranking de equipes e benchmark de
// produtividade — pensados para servir de referência (RUP) em obras futuras.
// ---------------------------------------------------------------------------

function round(val: number, casas: number): number {
  const f = 10 ** casas;
  return Math.round(val * f) / f;
}

function parseDataLocal(data: string): Date {
  return new Date(data + "T12:00:00");
}

function addDiasISO(data: string, dias: number): string {
  const d = parseDataLocal(data);
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

function diffDias(dataInicio: string, dataFim: string): number {
  const MS_DIA = 1000 * 60 * 60 * 24;
  return Math.round(
    (parseDataLocal(dataFim).getTime() - parseDataLocal(dataInicio).getTime()) / MS_DIA
  );
}

export interface EventoProducao {
  data: string;
  areaM2: number;
}

/** Eventos de produção (data + área) de um serviço, buscando na fonte mais granular disponível. */
export function eventosServico(obra: Obra, servico: Servico): EventoProducao[] {
  switch (servico) {
    case "Assentamento de Porcelanato":
      return (obra.apontamentosPorcelanato ?? []).map((a) => ({
        data: a.dataExecucao,
        areaM2: a.areaExecutadaM2,
      }));
    case "Paredes de Drywall":
      return (obra.paredesDrywall ?? [])
        .filter((p) => p.dataExecucao)
        .map((p) => ({ data: p.dataExecucao!, areaM2: p.areaM2 ?? 0 }));
    case "Plaqueamento Performa":
      return (obra.paredesInterno ?? [])
        .filter((p) => p.dataExecucao && p.performaM2)
        .map((p) => ({ data: p.dataExecucao!, areaM2: p.performaM2! }));
    case "Plaqueamento RU":
      return (obra.paredesInterno ?? [])
        .filter((p) => p.dataExecucao && p.ruM2)
        .map((p) => ({ data: p.dataExecucao!, areaM2: p.ruM2! }));
    default:
      // Plaqueamento Glasroc-x, Tratamento de Juntas, Basecoat — vêm da apropriação diária.
      return obra.registros
        .filter((r) => r.servico === servico)
        .map((r) => ({ data: r.data, areaM2: r.areaM2 }));
  }
}

export interface PontoSerie {
  data: string;
  valor: number;
}

/** Acumula eventos por data em ordem cronológica (curva de produção acumulada). */
export function serieAcumulada(eventos: EventoProducao[]): PontoSerie[] {
  const porData = new Map<string, number>();
  for (const e of eventos) {
    porData.set(e.data, (porData.get(e.data) ?? 0) + e.areaM2);
  }
  const datas = [...porData.keys()].sort();
  let acumulado = 0;
  return datas.map((data) => {
    acumulado += porData.get(data) ?? 0;
    return { data, valor: round(acumulado, 2) };
  });
}

export interface SerieFrente {
  id: GrupoServico;
  label: string;
  pontos: PontoSerie[];
}

/**
 * Curva de produção acumulada por frente, para o gráfico de tendência.
 * Plaqueamento externo usa Glasroc-x como camada de referência (mesma
 * convenção já usada no ranking de faces e no destaque "melhor RUP").
 */
export function seriesProducaoPorFrente(obra: Obra): SerieFrente[] {
  const interno = [
    ...eventosServico(obra, "Plaqueamento Performa"),
    ...eventosServico(obra, "Plaqueamento RU"),
  ];

  const series: SerieFrente[] = [
    {
      id: "Plaqueamento Externo",
      label: "Plaqueamento externo (Glasroc-x)",
      pontos: serieAcumulada(eventosServico(obra, "Plaqueamento Glasroc-x")),
    },
    {
      id: "Porcelanato",
      label: "Porcelanato",
      pontos: serieAcumulada(eventosServico(obra, "Assentamento de Porcelanato")),
    },
    {
      id: "Drywall",
      label: "Painéis internos",
      pontos: serieAcumulada(eventosServico(obra, "Paredes de Drywall")),
    },
    {
      id: "Plaqueamento Interno",
      label: "Plaqueamento interno",
      pontos: serieAcumulada(interno),
    },
    {
      id: "Forro",
      label: "Forro",
      pontos: serieAcumulada(eventosServico(obra, "Forro")),
    },
  ];

  return series;
}

const JANELA_RITMO_DIAS = 21;

/** Ritmo médio recente (m²/dia) com base na janela de dias mais recente da curva acumulada. */
function ritmoRecente(pontos: PontoSerie[]): number {
  if (pontos.length < 2) return 0;
  const ultimo = pontos[pontos.length - 1];
  const limite = addDiasISO(ultimo.data, -JANELA_RITMO_DIAS);

  let referencia = pontos[0];
  for (const p of pontos) {
    if (p.data <= limite) referencia = p;
    else break;
  }

  const dias = diffDias(referencia.data, ultimo.data);
  if (dias <= 0) return 0;
  return (ultimo.valor - referencia.valor) / dias;
}

export interface PrevisaoFrente {
  id: GrupoServico;
  ritmoDiario: number;
  diasRestantes: number | null;
  dataPrevista: string | null;
}

/** Previsão de conclusão por frente, projetando o ritmo recente sobre a área restante. */
export function previsoesConclusao(
  obra: Obra,
  frentes: ResumoFrenteDashboard[]
): PrevisaoFrente[] {
  const series = seriesProducaoPorFrente(obra);

  return frentes
    .filter((f) => f.ativo)
    .map((f) => {
      const serie = series.find((s) => s.id === f.id);
      const ritmo = serie ? ritmoRecente(serie.pontos) : 0;

      if (f.restante <= 0) {
        return { id: f.id, ritmoDiario: round(ritmo, 1), diasRestantes: 0, dataPrevista: null };
      }
      if (ritmo <= 0 || !serie || serie.pontos.length === 0) {
        return { id: f.id, ritmoDiario: round(ritmo, 1), diasRestantes: null, dataPrevista: null };
      }

      const dias = Math.ceil(f.restante / ritmo);
      const ultimaData = serie.pontos[serie.pontos.length - 1].data;
      return {
        id: f.id,
        ritmoDiario: round(ritmo, 1),
        diasRestantes: dias,
        dataPrevista: addDiasISO(ultimaData, dias),
      };
    });
}

export interface RankingEquipe {
  equipe: string;
  areaTotal: number;
  dias: number;
  rupDiario: number;
  servicos: number;
}

/**
 * Ranking de equipes por produtividade (m²/dia). Baseado no plaqueamento
 * externo, única frente com apropriação diária nominal por equipe — as
 * demais frentes registram execução por painel/tipo, sem equipe associada.
 */
export function rankingEquipesPlaqueamentoExterno(obra: Obra): RankingEquipe[] {
  const registros = obra.registros.filter((r) =>
    (SERVICOS_PLAQUEAMENTO as Servico[]).includes(r.servico)
  );
  const porEquipe = new Map<string, { areaTotal: number; datas: Set<string>; servicos: Set<Servico> }>();

  for (const r of registros) {
    const acc = porEquipe.get(r.equipe) ?? {
      areaTotal: 0,
      datas: new Set<string>(),
      servicos: new Set<Servico>(),
    };
    acc.areaTotal += r.areaM2;
    acc.datas.add(r.data);
    acc.servicos.add(r.servico);
    porEquipe.set(r.equipe, acc);
  }

  return [...porEquipe.entries()]
    .map(([equipe, acc]) => ({
      equipe,
      areaTotal: round(acc.areaTotal, 1),
      dias: acc.datas.size,
      rupDiario: acc.datas.size > 0 ? round(acc.areaTotal / acc.datas.size, 1) : 0,
      servicos: acc.servicos.size,
    }))
    .sort((a, b) => b.rupDiario - a.rupDiario);
}

export interface BenchmarkServico {
  servico: Servico;
  label: string;
  grupoLabel: string;
  areaTotal: number;
  dias: number;
  rupDiario: number;
}

/**
 * RUP consolidado por serviço — a referência de produtividade que esta obra
 * gera para orçar e planejar o cronograma de futuras obras em Steel Frame.
 */
export function benchmarkProdutividade(obra: Obra): BenchmarkServico[] {
  const linhas: BenchmarkServico[] = [];

  for (const servico of SERVICOS) {
    const eventos = eventosServico(obra, servico);
    if (eventos.length === 0) continue;

    const areaTotal = eventos.reduce((s, e) => s + e.areaM2, 0);
    const dias = new Set(eventos.map((e) => e.data)).size;
    const cfg = getServicoConfig(servico);

    linhas.push({
      servico,
      label: cfg.label,
      grupoLabel: cfg.grupoLabel,
      areaTotal: round(areaTotal, 1),
      dias,
      rupDiario: dias > 0 ? round(areaTotal / dias, 1) : 0,
    });
  }

  return linhas;
}

export interface PrevisaoRupItem {
  servico: Servico;
  label: string;
  grupoLabel: string;
  escopoRestante: number;
  rupReferencia: number;
  diasPrevistos: number | null;
}

/**
 * Projeta dias restantes por serviço aplicando o RUP consolidado de uma obra
 * de referência (ex.: benchmarkProdutividade(OBRA_SICREDI)) sobre o escopo
 * ainda não executado desta obra. Pensado para obras em planejamento — como
 * a Amaggi — que ainda não têm histórico próprio de produção para calcular
 * seu próprio ritmo (ver previsoesConclusao, que usa o ritmo da própria obra).
 * Só aparece serviço com escopo > 0 e RUP de referência > 0.
 */
export function previsaoPorRupReferencia(
  obra: Obra,
  benchmarkReferencia: BenchmarkServico[]
): PrevisaoRupItem[] {
  const rupPorServico = new Map(benchmarkReferencia.map((b) => [b.servico, b.rupDiario]));
  const linhas: PrevisaoRupItem[] = [];

  for (const servico of SERVICOS) {
    const rup = rupPorServico.get(servico) ?? 0;
    if (rup <= 0) continue;
    const escopo = totalEscopoServico(obra, servico);
    if (escopo <= 0) continue;
    const executado = areaExecutadaServico(obra, servico);
    const restante = Math.max(0, round(escopo - executado, 2));
    const cfg = getServicoConfig(servico);
    linhas.push({
      servico,
      label: cfg.label,
      grupoLabel: cfg.grupoLabel,
      escopoRestante: restante,
      rupReferencia: rup,
      diasPrevistos: restante > 0 ? Math.ceil(restante / rup) : 0,
    });
  }

  return linhas;
}
