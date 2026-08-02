import type { ApontamentoPorcelanato, TipoPorcelanato } from "./types";

export const TIPOS_PORCELANATO_INICIAL: TipoPorcelanato[] = [
  {
    id: "pc-ugl",
    descricao: "Porcelanato UGL 90x90 Polido 8 mm Eliane Minimun Cimento PO",
    areaTotalM2: 397.46,
  },
  {
    id: "pc-parede",
    descricao: "Revestimento de Parede Forma Branco 32x60",
    areaTotalM2: 27.36,
  },
];

export const APONTAMENTOS_PORCELANATO_INICIAL: ApontamentoPorcelanato[] = [
  {
    id: "pa-1",
    tipoId: "pc-ugl",
    areaExecutadaM2: 17,
    dataExecucao: "2026-06-22",
  },
  {
    id: "pa-2",
    tipoId: "pc-ugl",
    areaExecutadaM2: 49.41,
    dataExecucao: "2026-06-23",
  },
  {
    id: "pa-3",
    tipoId: "pc-ugl",
    areaExecutadaM2: 32.4,
    dataExecucao: "2026-06-24",
  },
  {
    id: "pa-4",
    tipoId: "pc-ugl",
    areaExecutadaM2: 40.5,
    dataExecucao: "2026-06-25",
  },
  {
    id: "pa-5",
    tipoId: "pc-ugl",
    areaExecutadaM2: 47.8,
    dataExecucao: "2026-06-26",
  },
  {
    id: "pa-6",
    tipoId: "pc-ugl",
    areaExecutadaM2: 12.96,
    dataExecucao: "2026-06-27",
  },
  {
    id: "pa-7",
    tipoId: "pc-ugl",
    areaExecutadaM2: 18.63,
    dataExecucao: "2026-06-29",
  },
  {
    id: "pa-8",
    tipoId: "pc-ugl",
    areaExecutadaM2: 12.96,
    dataExecucao: "2026-07-01",
  },
  {
    id: "pa-9",
    tipoId: "pc-ugl",
    areaExecutadaM2: 18.63,
    dataExecucao: "2026-07-01",
  },
  {
    id: "pa-10",
    tipoId: "pc-ugl",
    areaExecutadaM2: 31.27,
    dataExecucao: "2026-07-02",
  },
  {
    id: "pa-11",
    tipoId: "pc-parede",
    areaExecutadaM2: 11.4,
    dataExecucao: "2026-07-02",
  },
  {
    id: "pa-12",
    tipoId: "pc-ugl",
    areaExecutadaM2: 6.15,
    dataExecucao: "2026-07-03",
  },
  {
    id: "pa-13",
    tipoId: "pc-parede",
    areaExecutadaM2: 7.6,
    dataExecucao: "2026-07-03",
  },
  {
    id: "pa-14",
    tipoId: "pc-ugl",
    areaExecutadaM2: 4.65,
    dataExecucao: "2026-07-07",
  },
  {
    id: "pa-15",
    tipoId: "pc-ugl",
    areaExecutadaM2: 10.62,
    dataExecucao: "2026-07-07",
  },
  {
    id: "pa-16",
    tipoId: "pc-parede",
    areaExecutadaM2: 8.36,
    dataExecucao: "2026-07-07",
  },
  {
    id: "pa-17",
    tipoId: "pc-ugl",
    areaExecutadaM2: 7.04,
    dataExecucao: "2026-07-08",
  },
  {
    id: "pa-18",
    tipoId: "pc-ugl",
    areaExecutadaM2: 24.78,
    dataExecucao: "2026-07-08",
  },
  {
    id: "pa-19",
    tipoId: "pc-ugl",
    areaExecutadaM2: 4,
    dataExecucao: "2026-07-09",
  },
  {
    id: "pa-20",
    tipoId: "pc-ugl",
    areaExecutadaM2: 24.7,
    dataExecucao: "2026-07-09",
  },
  {
    id: "pa-21",
    tipoId: "pc-ugl",
    areaExecutadaM2: 24.7,
    dataExecucao: "2026-07-10",
  },
  {
    id: "pa-22",
    tipoId: "pc-ugl",
    areaExecutadaM2: 4,
    dataExecucao: "2026-07-10",
  },
  {
    id: "pa-23",
    tipoId: "pc-ugl",
    areaExecutadaM2: 5.26,
    dataExecucao: "2026-07-10",
  },
];

export function labelPorcelanatoCurto(descricao: string): string {
  if (descricao.includes("UGL 90x90")) return "Porcelanato UGL 90x90";
  if (descricao.includes("32x60")) return "Revestimento Parede 32x60";
  return descricao.length > 40 ? descricao.slice(0, 37) + "…" : descricao;
}

export function getTipoPorcelanato(
  tipos: TipoPorcelanato[],
  tipoId: string
): TipoPorcelanato | undefined {
  return tipos.find((t) => t.id === tipoId);
}

export function areaExecutadaPorTipo(
  apontamentos: ApontamentoPorcelanato[],
  tipoId: string
): number {
  return apontamentos
    .filter((a) => a.tipoId === tipoId)
    .reduce((s, a) => s + a.areaExecutadaM2, 0);
}

export function areaTotalPorcelanato(tipos: TipoPorcelanato[]): number {
  return tipos.reduce((s, t) => s + t.areaTotalM2, 0);
}

export function areaExecutadaPorcelanato(
  apontamentos: ApontamentoPorcelanato[]
): number {
  return apontamentos.reduce((s, a) => s + a.areaExecutadaM2, 0);
}

export function percentualPorcelanato(
  tipos: TipoPorcelanato[],
  apontamentos: ApontamentoPorcelanato[]
): number {
  const total = areaTotalPorcelanato(tipos);
  const exec = areaExecutadaPorcelanato(apontamentos);
  return total > 0 ? Math.min(100, Math.round((exec / total) * 1000) / 10) : 0;
}

export function formatarDataPorcelanato(data: string): string {
  return new Date(data + "T12:00:00").toLocaleDateString("pt-BR");
}

export function quantitativosPorcelanato(
  tipos: TipoPorcelanato[]
): { localizacao: string; servico: "Assentamento de Porcelanato"; totalM2: number }[] {
  return tipos.map((t) => ({
    localizacao: labelPorcelanatoCurto(t.descricao),
    servico: "Assentamento de Porcelanato" as const,
    totalM2: t.areaTotalM2,
  }));
}

export interface ResumoTipoPorcelanato {
  tipo: TipoPorcelanato;
  label: string;
  areaExecutada: number;
  areaRestante: number;
  percentual: number;
  dias: number;
  rupDiario: number;
  apontamentos: ApontamentoPorcelanato[];
}

export function resumosPorTipoPorcelanato(
  tipos: TipoPorcelanato[],
  apontamentos: ApontamentoPorcelanato[]
): ResumoTipoPorcelanato[] {
  return tipos.map((tipo) => {
    const apontamentosTipo = apontamentos.filter((a) => a.tipoId === tipo.id);
    const areaExecutada = areaExecutadaPorTipo(apontamentos, tipo.id);
    const dias = new Set(apontamentosTipo.map((a) => a.dataExecucao)).size;
    const areaRestante = Math.max(0, tipo.areaTotalM2 - areaExecutada);
    const percentual =
      tipo.areaTotalM2 > 0
        ? Math.min(100, Math.round((areaExecutada / tipo.areaTotalM2) * 1000) / 10)
        : 0;

    return {
      tipo,
      label: labelPorcelanatoCurto(tipo.descricao),
      areaExecutada,
      areaRestante,
      percentual,
      dias,
      rupDiario: dias > 0 ? Math.round((areaExecutada / dias) * 10) / 10 : 0,
      apontamentos: [...apontamentosTipo].sort((a, b) =>
        b.dataExecucao.localeCompare(a.dataExecucao)
      ),
    };
  });
}
