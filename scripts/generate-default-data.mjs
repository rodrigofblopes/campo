import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(join(__dirname, "sync-output.json"), "utf8"));
const DATA_VERSION = 14;
const dataSync = new Date().toLocaleDateString("pt-BR");

function reg(r, i) {
  const lines = [
    "    {",
    `      id: "r${i}",`,
    `      equipe: ${JSON.stringify(r.equipe)},`,
    `      localizacao: ${JSON.stringify(r.localizacao)},`,
    `      data: ${JSON.stringify(r.data)},`,
    `      servico: ${JSON.stringify(r.servico)},`,
    `      areaM2: ${Math.round(r.areaM2 * 1000) / 1000},`,
  ];
  if (r.observacao) lines.push(`      observacao: ${JSON.stringify(r.observacao)},`);
  lines.push("    },");
  return lines.join("\n");
}

function round3(n) {
  return Math.round(n * 1000) / 1000;
}

// --- paredes-drywall.ts ---
const paredesLines = data.paredes
  .map((p) => {
    const parts = [`  { n: ${p.n}, altura: ${p.altura}, comprimento: ${p.comprimento}, area: ${round3(p.area)}`];
    if (p.data) parts.push(`data: ${JSON.stringify(p.data)}`);
    return parts.join(", ") + " },";
  })
  .join("\n");

const paredesFile = `import type { ParedeDrywall } from "./types";

type ParedePlanilha = {
  n: number;
  altura: number;
  comprimento: number;
  area: number;
  data?: string;
};

const DADOS_PLANILHA: ParedePlanilha[] = [
${paredesLines}
];

/** Paredes conforme aba Parede Drywall da planilha Produtividade Sicredi. */
export const PAREDES_DRYWALL_INICIAL: ParedeDrywall[] = DADOS_PLANILHA.map((p) => {
  const codigo = String(p.n);
  return {
    id: \`pd-\${String(p.n).padStart(2, "0")}\`,
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
  const n = codigo.replace(/\\D/g, "") || codigo;
  return \`Painel \${n.padStart(2, "0")}\`;
}

export function ordemParede(localizacao: string): number {
  const n = parseInt(localizacao.replace(/\\D/g, ""), 10);
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
  const n = codigo.replace(/\\D/g, "") || codigo;
  return registros
    .filter(
      (r) =>
        r.servico === "Paredes de Drywall" &&
        (r.localizacao === label ||
          r.localizacao === codigo ||
          r.localizacao === \`Parede \${codigo}\` ||
          r.localizacao === \`Parede \${n}\` ||
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
`;

writeFileSync(join(__dirname, "../src/lib/paredes-drywall.ts"), paredesFile);

// --- paredes-interno.ts ---
const internoLines = (data.paredesInterno ?? [])
  .map((p) => {
    const parts = [
      `  { codigo: ${JSON.stringify(p.codigo)}, tipo: ${JSON.stringify(p.tipo)}`,
    ];
    if (p.areaM2 != null) parts.push(`areaM2: ${round3(p.areaM2)}`);
    if (p.performaM2 != null) parts.push(`performaM2: ${round3(p.performaM2)}`);
    if (p.ruM2 != null) parts.push(`ruM2: ${round3(p.ruM2)}`);
    if (p.data) parts.push(`data: ${JSON.stringify(p.data)}`);
    return parts.join(", ") + " },";
  })
  .join("\n");

const internoFile = `import type { ParedePlaqueamentoInterno } from "./types";

type ParedeInternoPlanilha = {
  codigo: string;
  tipo: "drywall" | "steel";
  areaM2?: number;
  performaM2?: number;
  ruM2?: number;
  data?: string;
};

const DADOS_PLANILHA: ParedeInternoPlanilha[] = [
${internoLines}
];

/** Paredes Performa/RU — aba Plaqueamento Interno da planilha Produtividade Sicredi. */
export const PAREDES_INTERNO_INICIAL: ParedePlaqueamentoInterno[] = DADOS_PLANILHA.map((p, i) => ({
  id: \`pi-\${String(i + 1).padStart(2, "0")}\`,
  codigo: p.codigo,
  tipo: p.tipo,
  areaM2: p.areaM2,
  performaM2: p.performaM2,
  ruM2: p.ruM2,
  dataExecucao: p.data,
}));

export function labelParedeInterno(p: Pick<ParedePlaqueamentoInterno, "codigo" | "tipo">): string {
  if (p.tipo === "steel") return p.codigo;
  const n = p.codigo.replace(/\\D/g, "") || p.codigo;
  return \`Painel \${n.padStart(2, "0")}\`;
}

export function ordemInterno(localizacao: string): number {
  const steel = localizacao.match(/^PS(\\d+)/i);
  if (steel) return 100 + parseInt(steel[1], 10);
  const n = parseInt(localizacao.replace(/\\D/g, ""), 10);
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
`;

writeFileSync(join(__dirname, "../src/lib/paredes-interno.ts"), internoFile);

// --- porcelanato.ts ---
const tiposLines = data.tipos
  .map(
    (t) => `  {
    id: ${JSON.stringify(t.id)},
    descricao: ${JSON.stringify(t.descricao)},
    areaTotalM2: ${t.areaTotalM2},
  },`
  )
  .join("\n");

const apontLines = data.apontamentos
  .map(
    (a) => `  {
    id: ${JSON.stringify(a.id)},
    tipoId: ${JSON.stringify(a.tipoId)},
    areaExecutadaM2: ${a.areaExecutadaM2},
    dataExecucao: ${JSON.stringify(a.dataExecucao)},
  },`
  )
  .join("\n");

const porcTail = readFileSync(join(__dirname, "../src/lib/porcelanato.ts"), "utf8");
const porcHelpers = porcTail.slice(porcTail.indexOf("export function labelPorcelanatoCurto"));

const porcelanatoFile = `import type { ApontamentoPorcelanato, TipoPorcelanato } from "./types";

export const TIPOS_PORCELANATO_INICIAL: TipoPorcelanato[] = [
${tiposLines}
];

export const APONTAMENTOS_PORCELANATO_INICIAL: ApontamentoPorcelanato[] = [
${apontLines}
];

${porcHelpers}`;

writeFileSync(join(__dirname, "../src/lib/porcelanato.ts"), porcelanatoFile);

// --- forro.ts ---
const forroLines = (data.forro ?? [])
  .map((f) => {
    const parts = [
      `  { id: ${JSON.stringify(f.id)}, ambiente: ${JSON.stringify(f.ambiente)}, areaM2: ${round3(f.areaM2)}`,
    ];
    if (f.dataEstruturacao) parts.push(`dataEstruturacao: ${JSON.stringify(f.dataEstruturacao)}`);
    if (f.dataPlaqueamento) parts.push(`dataPlaqueamento: ${JSON.stringify(f.dataPlaqueamento)}`);
    return parts.join(", ") + " },";
  })
  .join("\n");

const forroFile = `import type { AmbienteForro } from "./types";

/** Ambientes de forro (aba "Forro " da planilha Produtividade Sicredi). */
export const FORRO_INICIAL: AmbienteForro[] = [
${forroLines}
];

export function areaTotalForro(forro: AmbienteForro[]): number {
  return forro.reduce((s, f) => s + f.areaM2, 0);
}

/** Área com estruturação (perfis) lançada — etapa intermediária, não conta como concluído. */
export function areaEstruturadaForro(forro: AmbienteForro[]): number {
  return forro
    .filter((f) => f.dataEstruturacao)
    .reduce((s, f) => s + f.areaM2, 0);
}

/** Área com plaqueamento (fechamento) lançado — etapa final, conta como concluído. */
export function areaExecutadaForro(forro: AmbienteForro[]): number {
  return forro
    .filter((f) => f.dataPlaqueamento)
    .reduce((s, f) => s + f.areaM2, 0);
}

export function percentualForro(forro: AmbienteForro[]): number {
  const total = areaTotalForro(forro);
  const exec = areaExecutadaForro(forro);
  return total > 0 ? Math.min(100, Math.round((exec / total) * 1000) / 10) : 0;
}

export type StatusForro = "pendente" | "estruturado" | "concluido";

export function statusForro(ambiente: AmbienteForro): StatusForro {
  if (ambiente.dataPlaqueamento) return "concluido";
  if (ambiente.dataEstruturacao) return "estruturado";
  return "pendente";
}

export function formatarDataForro(data?: string): string {
  if (!data) return "—";
  return new Date(data + "T12:00:00").toLocaleDateString("pt-BR");
}

/** Escopo por ambiente — alimenta o motor genérico de % por serviço (como porcelanato/drywall). */
export function quantitativosForro(
  forro: AmbienteForro[]
): { localizacao: string; servico: "Forro"; totalM2: number }[] {
  return forro.map((f) => ({
    localizacao: f.ambiente,
    servico: "Forro" as const,
    totalM2: f.areaM2,
  }));
}
`;

writeFileSync(join(__dirname, "../src/lib/forro.ts"), forroFile);

// --- default-data.ts ---
const plaqueamentoRegs = data.registros.map((r, i) => reg(r, i + 1)).join("\n");

const escopo = data.escopo
  .map(
    (e) =>
      `    { localizacao: ${JSON.stringify(e.localizacao)}, areaTotalM2: ${e.areaTotalM2} },`
  )
  .join("\n");

const resumos = data.resumos
  .map((r) => {
    let s = `    {
      localizacao: ${JSON.stringify(r.localizacao)},
      servico: "Plaqueamento Glasroc-x",
      areaM2: ${Math.round(r.areaM2 * 100) / 100},
      dias: ${r.dias},
      rupDiario: ${r.rupDiario},
      equipes: [],`;
    if (r.observacao) s += `\n      observacao: ${JSON.stringify(r.observacao)},`;
    s += "\n    },";
    return s;
  })
  .join("\n");

const defaultDataFile = `import type { Obra } from "./types";
import {
  PAREDES_INTERNO_INICIAL,
  labelParedeInterno,
} from "./paredes-interno";
import { PAREDES_DRYWALL_INICIAL, labelParede } from "./paredes-drywall";
import {
  APONTAMENTOS_PORCELANATO_INICIAL,
  TIPOS_PORCELANATO_INICIAL,
  labelPorcelanatoCurto,
} from "./porcelanato";
import { FORRO_INICIAL } from "./forro";

export const OBRA_DATA_VERSION = ${DATA_VERSION};

export const OBRA_SICREDI: Obra = {
  id: "sicredi-001",
  nome: "Sicredi - Steel Frame",
  cliente: "Sicredi",
  dataInicio: "2026-06-10",
  escopo: [
${escopo}
  ],
  paredesDrywall: PAREDES_DRYWALL_INICIAL,
  paredesInterno: PAREDES_INTERNO_INICIAL,
  tiposPorcelanato: TIPOS_PORCELANATO_INICIAL,
  apontamentosPorcelanato: APONTAMENTOS_PORCELANATO_INICIAL,
  forro: FORRO_INICIAL,
  observacoesGerais:
    "Dados sincronizados com a planilha Produtividade Sicredi (${dataSync}).",
  registros: [
${plaqueamentoRegs}
    ...PAREDES_DRYWALL_INICIAL.filter((p) => p.dataExecucao).map((p) => ({
      id: \`rd-\${p.codigo}\`,
      equipe: "Equipe Painéis Drywall",
      localizacao: labelParede(p.codigo),
      data: p.dataExecucao!,
      servico: "Paredes de Drywall" as const,
      areaM2: p.areaM2!,
      observacao: "Executado — aba Parede Drywall",
    })),
    ...PAREDES_INTERNO_INICIAL.flatMap((p) => {
      if (!p.dataExecucao) return [];
      const loc = labelParedeInterno(p);
      const regs = [];
      if (p.performaM2) {
        regs.push({
          id: \`ri-perf-\${p.id}\`,
          equipe: "Equipe Plaqueamento Interno",
          localizacao: loc,
          data: p.dataExecucao,
          servico: "Plaqueamento Performa" as const,
          areaM2: p.performaM2,
          observacao: "Executado — aba Plaqueamento Interno",
        });
      }
      if (p.ruM2) {
        regs.push({
          id: \`ri-ru-\${p.id}\`,
          equipe: "Equipe Plaqueamento Interno",
          localizacao: loc,
          data: p.dataExecucao,
          servico: "Plaqueamento RU" as const,
          areaM2: p.ruM2,
          observacao: "Executado — aba Plaqueamento Interno",
        });
      }
      return regs;
    }),
    ...APONTAMENTOS_PORCELANATO_INICIAL.map((a) => {
      const tipo = TIPOS_PORCELANATO_INICIAL.find((t) => t.id === a.tipoId)!;
      return {
        id: \`rp-\${a.id}\`,
        equipe: "Equipe Porcelanato",
        localizacao: labelPorcelanatoCurto(tipo.descricao),
        data: a.dataExecucao,
        servico: "Assentamento de Porcelanato" as const,
        areaM2: a.areaExecutadaM2,
        observacao: "Executado — aba Porcelanato",
      };
    }),
    ...FORRO_INICIAL.filter((f) => f.dataPlaqueamento).map((f) => ({
      id: \`rf-\${f.id}\`,
      equipe: "Equipe Forro",
      localizacao: f.ambiente,
      data: f.dataPlaqueamento!,
      servico: "Forro" as const,
      areaM2: f.areaM2,
      observacao: "Executado — aba Forro (plaqueamento)",
    })),
  ],
  resumos: [
${resumos}
  ],
};
`;

writeFileSync(join(__dirname, "../src/lib/default-data.ts"), defaultDataFile);

console.log(
  JSON.stringify({
    OBRA_DATA_VERSION: DATA_VERSION,
    counts: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.length])),
    paredesConcluidas: data.paredes.filter((p) => p.data).length,
    porcelanatoM2: data.apontamentos.reduce((s, a) => s + a.areaExecutadaM2, 0),
    internoParedes: (data.paredesInterno ?? []).length,
    internoEscopo: data.escopoInterno,
  })
);
