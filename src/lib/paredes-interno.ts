import type { ParedePlaqueamentoInterno } from "./types";

type ParedeInternoPlanilha = {
  codigo: string;
  tipo: "drywall" | "steel";
  areaM2?: number;
  performaM2?: number;
  ruM2?: number;
  data?: string;
};

const DADOS_PLANILHA: ParedeInternoPlanilha[] = [
  { codigo: "01", tipo: "drywall", performaM2: 22.704, data: "2026-07-13" },
  { codigo: "02", tipo: "drywall", performaM2: 22.704, data: "2026-07-08" },
  { codigo: "03", tipo: "drywall", performaM2: 22.704, data: "2026-07-07" },
  { codigo: "04", tipo: "drywall", performaM2: 47.916, data: "2026-07-08" },
  { codigo: "05", tipo: "drywall", performaM2: 11.6, ruM2: 11.6, data: "2026-07-02" },
  { codigo: "06", tipo: "drywall", performaM2: 37.818, data: "2026-07-04" },
  { codigo: "07", tipo: "drywall", performaM2: 13.662, data: "2026-07-02" },
  { codigo: "08", tipo: "drywall", ruM2: 13.926, data: "2026-07-07" },
  { codigo: "09", tipo: "drywall", performaM2: 19.8, data: "2026-07-08" },
  { codigo: "10", tipo: "drywall", performaM2: 37.818, data: "2026-07-05" },
  { codigo: "11", tipo: "drywall", performaM2: 23.1, data: "2026-07-13" },
  { codigo: "12", tipo: "drywall", performaM2: 19.8, data: "2026-07-07" },
  { codigo: "13", tipo: "drywall", performaM2: 27.72, data: "2026-07-07" },
  { codigo: "14", tipo: "drywall", performaM2: 7.9, ruM2: 7.92, data: "2026-07-07" },
  { codigo: "15", tipo: "drywall", performaM2: 13.86, ruM2: 13.86, data: "2026-07-02" },
  { codigo: "16", tipo: "drywall", performaM2: 27.72, data: "2026-07-05" },
  { codigo: "17", tipo: "drywall", performaM2: 23.76, data: "2026-07-02" },
  { codigo: "18", tipo: "drywall", performaM2: 23.1, data: "2026-07-02" },
  { codigo: "19", tipo: "drywall", performaM2: 7.92, data: "2026-07-08" },
  { codigo: "PS1", tipo: "steel", areaM2: 37.3, performaM2: 37.3, data: "2026-07-09" },
  { codigo: "PS2", tipo: "steel", areaM2: 9.9, performaM2: 9.9, data: "2026-07-08" },
  { codigo: "PS3", tipo: "steel", areaM2: 9.9, performaM2: 9.9, data: "2026-07-03" },
  { codigo: "PS4", tipo: "steel", areaM2: 11.22, performaM2: 11.22, data: "2026-07-03" },
  { codigo: "PS5", tipo: "steel", areaM2: 31.41, performaM2: 12.87, ruM2: 18.54, data: "2026-06-30" },
  { codigo: "PS6", tipo: "steel", areaM2: 22.1, performaM2: 22.1, data: "2026-06-30" },
  { codigo: "PS6X", tipo: "steel", areaM2: 26.8, performaM2: 26.8, data: "2026-07-01" },
  { codigo: "PS7", tipo: "steel", areaM2: 51.48, ruM2: 51.48, data: "2026-06-30" },
  { codigo: "PS7X", tipo: "steel", areaM2: 17.65, performaM2: 17.65, data: "2026-07-02" },
  { codigo: "PS8", tipo: "steel", areaM2: 28.05, ruM2: 28.05, data: "2026-07-01" },
  { codigo: "PS9", tipo: "steel", areaM2: 19.8, ruM2: 19.8, data: "2026-07-07" },
  { codigo: "PS10", tipo: "steel", areaM2: 35.6, performaM2: 35.6, data: "2026-07-01" },
  { codigo: "PS11", tipo: "steel", areaM2: 9.57, performaM2: 9.57, data: "2026-07-06" },
  { codigo: "PS12", tipo: "steel", areaM2: 35.24, performaM2: 35.24, data: "2026-07-22" },
  { codigo: "PS12X", tipo: "steel", areaM2: 11.55, performaM2: 11.55, data: "2026-07-02" },
  { codigo: "PS12X'", tipo: "steel", areaM2: 11.55, performaM2: 11.55, data: "2026-07-05" },
  { codigo: "PS13", tipo: "steel", areaM2: 29.83, performaM2: 29.83, data: "2026-07-06" },
  { codigo: "PS14", tipo: "steel", areaM2: 18.87, performaM2: 18.87, data: "2026-07-03" },
  { codigo: "PS15", tipo: "steel", areaM2: 21.6, performaM2: 21.6, data: "2026-07-04" },
  { codigo: "PS16", tipo: "steel", areaM2: 10.06, performaM2: 10.06, data: "2026-07-05" },
  { codigo: "PS17", tipo: "steel", areaM2: 28.85, performaM2: 28.85, data: "2026-07-05" },
];

/** Paredes Performa/RU — aba Plaqueamento Interno da planilha Produtividade Sicredi. */
export const PAREDES_INTERNO_INICIAL: ParedePlaqueamentoInterno[] = DADOS_PLANILHA.map((p, i) => ({
  id: `pi-${String(i + 1).padStart(2, "0")}`,
  codigo: p.codigo,
  tipo: p.tipo,
  areaM2: p.areaM2,
  performaM2: p.performaM2,
  ruM2: p.ruM2,
  dataExecucao: p.data,
}));

export function labelParedeInterno(p: Pick<ParedePlaqueamentoInterno, "codigo" | "tipo">): string {
  if (p.tipo === "steel") return p.codigo;
  const n = p.codigo.replace(/\D/g, "") || p.codigo;
  return `Painel ${n.padStart(2, "0")}`;
}

export function ordemInterno(localizacao: string): number {
  const steel = localizacao.match(/^PS(\d+)/i);
  if (steel) return 100 + parseInt(steel[1], 10);
  const n = parseInt(localizacao.replace(/\D/g, ""), 10);
  return Number.isNaN(n) ? 999 : n;
}

export function quantitativosInterno(
  paredes: ParedePlaqueamentoInterno[]
): { localizacao: string; servico: "Plaqueamento Performa" | "Plaqueamento RU"; totalM2: number }[] {
  const items: { localizacao: string; servico: "Plaqueamento Performa" | "Plaqueamento RU"; totalM2: number }[] = [];
  for (const p of paredes) {
    const loc = labelParedeInterno(p);
    if (p.performaM2 != null && p.performaM2 > 0) {
      items.push({ localizacao: loc, servico: "Plaqueamento Performa", totalM2: p.performaM2 });
    }
    if (p.ruM2 != null && p.ruM2 > 0) {
      items.push({ localizacao: loc, servico: "Plaqueamento RU", totalM2: p.ruM2 });
    }
  }
  return items.sort((a, b) => ordemInterno(a.localizacao) - ordemInterno(b.localizacao));
}

export function areaTotalInterno(
  paredes: ParedePlaqueamentoInterno[],
  servico: "Plaqueamento Performa" | "Plaqueamento RU"
): number {
  return quantitativosInterno(paredes)
    .filter((q) => q.servico === servico)
    .reduce((s, q) => s + q.totalM2, 0);
}

export function areaExecutadaInterno(
  paredes: ParedePlaqueamentoInterno[],
  servico: "Plaqueamento Performa" | "Plaqueamento RU"
): number {
  let total = 0;
  for (const p of paredes) {
    if (!p.dataExecucao) continue;
    if (servico === "Plaqueamento Performa" && p.performaM2) total += p.performaM2;
    if (servico === "Plaqueamento RU" && p.ruM2) total += p.ruM2;
  }
  return Math.round(total * 1000) / 1000;
}
