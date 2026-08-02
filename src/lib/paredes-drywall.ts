import type { ParedeDrywall } from "./types";

type ParedePlanilha = {
  n: number;
  altura: number;
  comprimento: number;
  area: number;
  data?: string;
};

const DADOS_PLANILHA: ParedePlanilha[] = [
  { n: 1, altura: 3.6, comprimento: 3.44, area: 12.384, data: "2026-06-12" },
  { n: 2, altura: 3.6, comprimento: 3.44, area: 12.384, data: "2026-06-12" },
  { n: 3, altura: 3.6, comprimento: 3.44, area: 12.384, data: "2026-06-25" },
  { n: 4, altura: 3.5, comprimento: 7.26, area: 25.41, data: "2026-06-12" },
  { n: 5, altura: 3.5, comprimento: 3.5, area: 12.25, data: "2026-06-24" },
  { n: 6, altura: 3.5, comprimento: 5.73, area: 20.055, data: "2026-06-13" },
  { n: 7, altura: 3.5, comprimento: 2.07, area: 7.245, data: "2026-06-25" },
  { n: 8, altura: 3.5, comprimento: 2.11, area: 7.385, data: "2026-06-24" },
  { n: 9, altura: 3.5, comprimento: 3, area: 10.5, data: "2026-06-12" },
  { n: 10, altura: 3.5, comprimento: 5.73, area: 20.055, data: "2026-06-13" },
  { n: 11, altura: 3.6, comprimento: 3.5, area: 12.6, data: "2026-07-10" },
  { n: 12, altura: 3.5, comprimento: 3, area: 10.5, data: "2026-06-12" },
  { n: 13, altura: 3.5, comprimento: 4.2, area: 14.7, data: "2026-06-12" },
  { n: 14, altura: 3.5, comprimento: 1.2, area: 4.2, data: "2026-06-25" },
  { n: 15, altura: 3.5, comprimento: 4.2, area: 14.7, data: "2026-06-24" },
  { n: 16, altura: 3.5, comprimento: 4.2, area: 14.7, data: "2026-06-24" },
  { n: 17, altura: 3.6, comprimento: 3.6, area: 12.96, data: "2026-06-25" },
  { n: 18, altura: 3.6, comprimento: 3.5, area: 12.6, data: "2026-06-25" },
  { n: 19, altura: 3.5, comprimento: 1.2, area: 4.2, data: "2026-06-25" },
];

/** Paredes conforme aba Parede Drywall da planilha Produtividade Sicredi. */
export const PAREDES_DRYWALL_INICIAL: ParedeDrywall[] = DADOS_PLANILHA.map((p) => {
  const codigo = String(p.n);
  return {
    id: `pd-${String(p.n).padStart(2, "0")}`,
    codigo,
    alturaM: p.altura,
    comprimentoM: p.comprimento,
    areaM2: Math.round(p.area * 1000) / 1000,
    dataExecucao: p.data,
    status: p.data ? ("concluida" as const) : ("pendente" as const),
  };
});

export const PAREDES_DRYWALL_EXECUTADAS = PAREDES_DRYWALL_INICIAL.filter(
  (p) => p.dataExecucao
);

export function labelParede(codigo: string): string {
  const n = codigo.replace(/\D/g, "") || codigo;
  return `Painel ${n.padStart(2, "0")}`;
}

export function ordemParede(localizacao: string): number {
  const n = parseInt(localizacao.replace(/\D/g, ""), 10);
  return Number.isNaN(n) ? 999 : n;
}

/** Escopo por parede — alimenta cálculo de % (como porcelanato por tipo). */
export function quantitativosDrywall(
  paredes: ParedeDrywall[]
): { localizacao: string; servico: "Paredes de Drywall"; totalM2: number }[] {
  return paredes
    .filter((p) => p.areaM2 != null && p.areaM2 > 0)
    .map((p) => ({
      localizacao: labelParede(p.codigo),
      servico: "Paredes de Drywall" as const,
      totalM2: p.areaM2!,
    }))
    .sort((a, b) => ordemParede(a.localizacao) - ordemParede(b.localizacao));
}

export function areaTotalParedes(paredes: ParedeDrywall[]): number {
  return paredes.reduce((s, p) => s + (p.areaM2 ?? 0), 0);
}

export function areaExecutadaParedes(paredes: ParedeDrywall[]): number {
  return paredes
    .filter((p) => p.status === "concluida" || p.dataExecucao)
    .reduce((s, p) => s + (p.areaM2 ?? 0), 0);
}

export function produzidoParede(
  codigo: string,
  registros: { localizacao: string; servico: string; areaM2: number }[]
): number {
  const label = labelParede(codigo);
  const n = codigo.replace(/\D/g, "") || codigo;
  return registros
    .filter(
      (r) =>
        r.servico === "Paredes de Drywall" &&
        (r.localizacao === label ||
          r.localizacao === codigo ||
          r.localizacao === `Parede ${codigo}` ||
          r.localizacao === `Parede ${n}` ||
          r.localizacao === n)
    )
    .reduce((s, r) => s + r.areaM2, 0);
}

export function formatarDataExecucao(data?: string): string {
  if (!data) return "—";
  return new Date(data + "T12:00:00").toLocaleDateString("pt-BR");
}

export interface ResumoDiaDrywall {
  data: string;
  areaM2: number;
  paredes: ParedeDrywall[];
}

export function resumoPorDiaDrywall(paredes: ParedeDrywall[]): ResumoDiaDrywall[] {
  const map = new Map<string, ParedeDrywall[]>();
  for (const p of paredes) {
    if (!p.dataExecucao) continue;
    const lista = map.get(p.dataExecucao) ?? [];
    lista.push(p);
    map.set(p.dataExecucao, lista);
  }
  return [...map.entries()]
    .map(([data, lista]) => ({
      data,
      areaM2: Math.round(lista.reduce((s, p) => s + (p.areaM2 ?? 0), 0) * 100) / 100,
      paredes: lista.sort((a, b) => a.codigo.localeCompare(b.codigo)),
    }))
    .sort((a, b) => b.data.localeCompare(a.data));
}

export function rupMedioDrywall(paredes: ParedeDrywall[]): number {
  const porDia = resumoPorDiaDrywall(paredes);
  if (!porDia.length) return 0;
  const total = porDia.reduce((s, d) => s + d.areaM2, 0);
  return Math.round((total / porDia.length) * 10) / 10;
}
