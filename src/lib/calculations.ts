import type {
  AnaliseProdutividade,
  ConfigEquipe,
  EscopoLocalizacao,
  Obra,
  ProgressoLocal,
  RegistroProducao,
  ResumoLocalizacao,
  ResultadoAnalise,
  Servico,
} from "./types";
import {
  escopoLocalServico,
  localizacoesPorServico,
  servicoTemEscopo,
  totalEscopoServico,
} from "./escopo";
import { normalizarLocalizacao } from "./localizacoes";
import { SERVICOS, SERVICOS_PLAQUEAMENTO } from "./servicos";

export function calcularAnalise(analise: AnaliseProdutividade): ResultadoAnalise {
  const { config, areaRealizada } = analise;
  const { jornadaHoras, montadores, ajudantes, dias } = config;

  const totalHorasProfissional = jornadaHoras * dias * montadores;
  const totalHorasServente = jornadaHoras * dias * ajudantes;

  const produtividadeM2HProf =
    totalHorasProfissional > 0 ? areaRealizada / totalHorasProfissional : 0;
  const produtividadeM2HServ =
    totalHorasServente > 0 ? areaRealizada / totalHorasServente : 0;

  const produtividadeDiaria = dias > 0 ? areaRealizada / dias : 0;

  const rupHorasProf =
    produtividadeM2HProf > 0 ? 1 / produtividadeM2HProf : 0;
  const rupHorasServ =
    produtividadeM2HServ > 0 ? 1 / produtividadeM2HServ : 0;

  return {
    areaRealizada,
    dias,
    produtividadeDiaria,
    totalHorasProfissional,
    totalHorasServente,
    produtividadeM2HProf,
    produtividadeM2HServ,
    rupHorasProf,
    rupHorasServ,
  };
}

export function agruparProducao(
  registros: RegistroProducao[]
): ResumoLocalizacao[] {
  const grupos = new Map<string, RegistroProducao[]>();

  for (const reg of registros) {
    const loc = normalizarLocalizacao(reg.localizacao);
    const key = `${loc}::${reg.servico}`;
    const lista = grupos.get(key) ?? [];
    lista.push(reg);
    grupos.set(key, lista);
  }

  const resumos: ResumoLocalizacao[] = [];

  for (const [key, items] of grupos) {
    const [localizacao, servico] = key.split("::") as [string, Servico];
    const datas = [...new Set(items.map((i) => i.data))].sort();
    const areaM2 = items.reduce((s, i) => s + i.areaM2, 0);
    const dias = datas.length;
    const equipes = [...new Set(items.map((i) => i.equipe))];

    resumos.push({
      localizacao,
      servico,
      areaM2: round(areaM2, 2),
      dias,
      rupDiario: dias > 0 ? round(areaM2 / dias, 1) : 0,
      equipes,
    });
  }

  return resumos.sort((a, b) => a.localizacao.localeCompare(b.localizacao));
}

export function inferirConfigDeProducao(
  registros: RegistroProducao[],
  filtros: { servico: Servico; localizacao?: string; equipe?: string },
  jornadaHoras = 8
): { config: ConfigEquipe; areaTotal: number } {
  let filtrados = registros.filter((r) => r.servico === filtros.servico);
  if (filtros.localizacao) {
    const alvo = normalizarLocalizacao(filtros.localizacao);
    filtrados = filtrados.filter((r) => normalizarLocalizacao(r.localizacao) === alvo);
  }
  if (filtros.equipe) {
    filtrados = filtrados.filter((r) => r.equipe === filtros.equipe);
  }

  const areaTotal = filtrados.reduce((s, r) => s + r.areaM2, 0);
  const dias = new Set(filtrados.map((r) => r.data)).size;

  const config: ConfigEquipe = {
    jornadaHoras,
    montadores: 1,
    ajudantes: 1,
    dias: Math.max(dias, 1),
  };

  return { config, areaTotal };
}

export function formatarNumero(valor: number, casas = 2): string {
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

function round(val: number, casas: number): number {
  const f = 10 ** casas;
  return Math.round(val * f) / f;
}

export { normalizarLocalizacao } from "./localizacoes";

export function areaProduzida(
  registros: RegistroProducao[],
  servico: Servico,
  localizacao: string
): number {
  const alvo = normalizarLocalizacao(localizacao);
  return round(
    registros
      .filter(
        (r) =>
          r.servico === servico &&
          normalizarLocalizacao(r.localizacao) === alvo
      )
      .reduce((s, r) => s + r.areaM2, 0),
    2
  );
}

export function calcularProgressoObra(obra: Obra): ProgressoLocal[] {
  const escopo = obra.escopo;
  const registros = obra.registros;
  return escopo.map((item) => {
    const servicos: ProgressoLocal["servicos"] = {};

    for (const servico of SERVICOS_PLAQUEAMENTO) {
      const totalLocal = escopoLocalServico(obra, item.localizacao, servico);
      const areaProd = areaProduzida(registros, servico, item.localizacao);
      const percentual =
        totalLocal > 0
          ? Math.min(100, round((areaProd / totalLocal) * 100, 1))
          : 0;
      const areaRestante = Math.max(0, round(totalLocal - areaProd, 2));

      servicos[servico] = {
        areaProduzida: areaProd,
        percentual,
        areaRestante,
        semEscopo: totalLocal === 0,
      };
    }

    return {
      localizacao: item.localizacao,
      areaTotalM2: item.areaTotalM2,
      servicos,
    };
  });
}

export interface ProgressoServicoLocal {
  localizacao: string;
  totalM2: number;
  areaProduzida: number;
  percentual: number;
  areaRestante: number;
}

export function calcularProgressoServico(
  obra: Obra,
  servico: Servico
): ProgressoServicoLocal[] {
  const registros = obra.registros;
  return localizacoesPorServico(obra, servico).map((localizacao) => {
    const totalM2 = escopoLocalServico(obra, localizacao, servico);
    const areaProduzidaVal = areaProduzida(registros, servico, localizacao);
    const percentual =
      totalM2 > 0
        ? Math.min(100, round((areaProduzidaVal / totalM2) * 100, 1))
        : 0;
    return {
      localizacao,
      totalM2,
      areaProduzida: areaProduzidaVal,
      percentual,
      areaRestante: Math.max(0, round(totalM2 - areaProduzidaVal, 2)),
    };
  });
}

export function areaProduzidaPorServico(
  registros: RegistroProducao[]
): Record<Servico, number> {
  const result = {} as Record<Servico, number>;
  for (const servico of SERVICOS) {
    const porLocal = new Map<string, number>();
    for (const r of registros.filter((x) => x.servico === servico)) {
      const loc = normalizarLocalizacao(r.localizacao);
      porLocal.set(loc, (porLocal.get(loc) ?? 0) + r.areaM2);
    }
    result[servico] = round(
      [...porLocal.values()].reduce((s, v) => s + v, 0),
      2
    );
  }
  return result;
}

/** Área executada de um serviço, agrupando localizações equivalentes (ex.: Fachada Frontal → Frontal). */
export function areaExecutadaServico(obra: Obra, servico: Servico): number {
  if (servicoTemEscopo(obra, servico)) {
    return round(
      localizacoesPorServico(obra, servico).reduce(
        (s, loc) => s + areaProduzida(obra.registros, servico, loc),
        0
      ),
      2
    );
  }
  return areaProduzidaPorServico(obra.registros)[servico] ?? 0;
}

export function producaoPorLocal(
  registros: RegistroProducao[],
  servico: Servico
): { localizacao: string; areaM2: number }[] {
  const map = new Map<string, number>();
  for (const r of registros.filter((x) => x.servico === servico)) {
    const loc = normalizarLocalizacao(r.localizacao);
    map.set(loc, (map.get(loc) ?? 0) + r.areaM2);
  }
  return [...map.entries()]
    .map(([localizacao, areaM2]) => ({ localizacao, areaM2: round(areaM2, 2) }))
    .sort((a, b) => b.areaM2 - a.areaM2);
}

export function percentualGeralObra(obra: Obra, servico: Servico): number {
  if (!servicoTemEscopo(obra, servico)) return 0;
  const areaTotal = totalEscopoServico(obra, servico);
  const areaProd = localizacoesPorServico(obra, servico).reduce(
    (s, loc) => s + areaProduzida(obra.registros, servico, loc),
    0
  );
  return areaTotal > 0 ? Math.min(100, round((areaProd / areaTotal) * 100, 1)) : 0;
}
