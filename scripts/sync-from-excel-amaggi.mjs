/**
 * Gera src/lib/default-data-amaggi.ts a partir de "Produtividade Amaggi.xlsx"
 * (pasta Campo/Amaggi). Equivalente ao par sync-from-excel.mjs +
 * generate-default-data.mjs do Sicredi, só que em um único passo — o modelo
 * de dados da Amaggi é mais simples (uma obra, sem abas de resumo por
 * serviço) e ainda não tem histórico real de produção, então não compensa
 * manter um sync-output.json intermediário.
 *
 * Uso: node scripts/sync-from-excel-amaggi.mjs
 *
 * IMPORTANTE: bump manual de OBRA_AMAGGI_DATA_VERSION abaixo antes de rodar,
 * quando a mudança for para publicar (mesmo convenção do Sicredi).
 */
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import XLSX from "xlsx";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, "../src/lib/default-data-amaggi.ts");

// Bump manual — mesma convenção do Sicredi (incrementar quando publicar).
const OBRA_AMAGGI_DATA_VERSION = 5;

const xlsxPath = join(__dirname, "../../Amaggi/Produtividade Amaggi.xlsx");
const wb = XLSX.readFile(xlsxPath, { cellDates: true });

/** Ver comentário equivalente em sync-from-excel.mjs — falha alto em vez de devolver undefined. */
function getSheet(nome) {
  const ws = wb.Sheets[nome];
  if (ws) return ws;
  const disponiveis = wb.SheetNames;
  const normalizado = (s) => s.trim().toLowerCase();
  const parecido = disponiveis.find((n) => normalizado(n).includes(normalizado(nome).slice(0, 6)));
  const sugestao = parecido ? ` Aba parecida encontrada: "${parecido}".` : "";
  throw new Error(
    `Aba "${nome}" não existe na planilha.${sugestao} Abas disponíveis: ${disponiveis.join(", ")}`
  );
}

function formatDate(val) {
  if (!val) return undefined;
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  if (typeof val === "number") {
    const d = XLSX.SSF.parse_date_code(val);
    if (d) return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  const str = String(val);
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
  const m = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) {
    const [, d, mo, y] = m;
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return undefined;
}

function normalizeServico(val) {
  const lower = String(val).toLowerCase();
  if (lower.includes("glasroc") || (lower.includes("plaqueamento") && !lower.includes("performa") && !/\bru\b/.test(lower)))
    return "Plaqueamento Glasroc-x";
  if (lower.includes("tratamento") || lower.includes("junta")) return "Tratamento de Juntas";
  if (lower.includes("basecoat")) return "Basecoat";
  return null;
}

function parseNum(val) {
  const n = parseFloat(String(val ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

/** Linhas de exemplo do template ("Exemplo — apagar esta linha") — nunca importar. */
function ehLinhaExemplo(observacao) {
  return /exemplo/i.test(String(observacao ?? ""));
}

function slugify(nome) {
  return String(nome)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[.]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// --- Plaqueamento Externo (Escopo) ---
const escopoRows = XLSX.utils.sheet_to_json(getSheet("Plaqueamento Externo (Escopo)"), {
  header: 1,
  defval: "",
});
const escopoExterno = [];
for (const row of escopoRows) {
  const loc = String(row[0] ?? "").trim();
  if (!loc || loc.toLowerCase() === "localização" || loc.toLowerCase() === "total") continue;
  const areaTotalM2 = parseNum(row[1]);
  if (areaTotalM2 && areaTotalM2 > 0) escopoExterno.push({ localizacao: loc, areaTotalM2 });
}

// --- Histórico-Plaqueamento Externo (registros reais; ignora linha de exemplo) ---
const histRows = XLSX.utils.sheet_to_json(getSheet("Histórico-Plaqueamento Externo"), {
  header: 1,
  defval: "",
});
const registros = [];
for (const row of histRows) {
  const equipe = String(row[0] ?? "").trim();
  const localizacao = String(row[1] ?? "").trim();
  const data = formatDate(row[2]);
  const servico = normalizeServico(row[3]);
  const areaM2 = parseNum(row[4]);
  const observacao = String(row[6] ?? "").trim() || undefined;
  if (!equipe || equipe.toLowerCase() === "equipe" || ehLinhaExemplo(observacao)) continue;
  if (!localizacao || !data || !servico || !areaM2 || areaM2 <= 0) continue;
  registros.push({
    id: `am-reg-${registros.length + 1}`,
    equipe,
    localizacao,
    data,
    servico,
    areaM2,
    observacao,
  });
}

// --- Paredes Internas Steel (montagem estrutural — card "Painéis internos") ---
const paredesRows = XLSX.utils.sheet_to_json(getSheet("Paredes Internas Steel"), { defval: "" });
const areaParedeUmaFace = [];
const paredesDrywall = [];
for (const row of paredesRows) {
  const codigo = String(row["Parede (nº)"] ?? "").trim();
  const areaM2 = parseNum(row["Área (m²)"]);
  if (!codigo || codigo.toLowerCase() === "total" || !areaM2) continue;
  areaParedeUmaFace.push({ codigo, areaM2 });
  const data = formatDate(row["Data Execução"]);
  const statusPlanilha = String(row["Status"] ?? "").trim().toLowerCase();
  const status = data
    ? "concluida"
    : statusPlanilha.includes("andamento")
      ? "em_andamento"
      : "pendente";
  paredesDrywall.push({
    id: `pd-amaggi-${String(paredesDrywall.length + 1).padStart(2, "0")}`,
    codigo,
    tipo: "steel",
    areaM2,
    status,
    dataExecucao: data,
  });
}

// --- Plaqueamento Interno (Performa/RU) — inclui linhas EXT-* já prontas na planilha ---
const internoRows = XLSX.utils.sheet_to_json(getSheet("Plaqueamento Interno"), { defval: "" });
const paredesInterno = [];
for (const row of internoRows) {
  const codigo = String(row["Código"] ?? "").trim();
  if (!codigo || codigo.toLowerCase() === "total") continue;
  const tipo = String(row["Tipo (drywall/steel)"] ?? "steel").trim() === "drywall" ? "drywall" : "steel";
  const areaM2 = parseNum(row["Área (m²)"]);
  const performaM2 = parseNum(row["Performa (m²)"]);
  const ruM2 = parseNum(row["RU (m²)"]);
  const dataExecucao = formatDate(row["Data Execução"]);
  if (!areaM2 && !performaM2 && !ruM2) continue;
  paredesInterno.push({
    id: `pi-amaggi-${String(paredesInterno.length + 1).padStart(2, "0")}`,
    codigo,
    tipo,
    areaM2,
    performaM2,
    ruM2,
    dataExecucao,
  });
}

// --- Forro ---
const forroRows = XLSX.utils.sheet_to_json(getSheet("Forro"), { defval: "" });
const forro = [];
for (const row of forroRows) {
  const ambiente = String(row["Ambiente"] ?? "").trim();
  const areaM2 = parseNum(row["Área (m²)"]);
  if (!ambiente || !areaM2 || areaM2 <= 0) continue; // pula rodapé com texto explicativo
  forro.push({
    id: `forro-${slugify(ambiente)}`,
    ambiente,
    areaM2,
    dataEstruturacao: formatDate(row["Data Estruturação"]),
    dataPlaqueamento: formatDate(row["Data Plaqueamento/Instalação"]),
  });
}

// --- Revestimentos (Escopo) ---
const revEscopoRows = XLSX.utils.sheet_to_json(getSheet("Revestimentos (Escopo)"), { defval: "" });
const tiposPorcelanato = [];
for (const row of revEscopoRows) {
  const ambiente = String(row["Ambiente/Local"] ?? "").trim();
  const areaTotalM2 = parseNum(row["Escopo (m²)"]);
  if (!ambiente || !areaTotalM2 || areaTotalM2 <= 0) continue;
  tiposPorcelanato.push({ id: `porc-${slugify(ambiente)}`, descricao: ambiente, areaTotalM2 });
}

// --- Revestimentos - Produção (apontamentos reais; ignora linha de exemplo) ---
const revProducaoRows = XLSX.utils.sheet_to_json(getSheet("Revestimentos - Produção"), { defval: "" });
const apontamentosPorcelanato = [];
for (const row of revProducaoRows) {
  const ambiente = String(row["Ambiente/Local"] ?? "").trim();
  const observacao = String(row["Observação"] ?? "").trim();
  const areaExecutadaM2 = parseNum(row["Área Executada (m²)"]);
  const dataExecucao = formatDate(row["Data"]);
  if (!ambiente || ehLinhaExemplo(observacao)) continue;
  if (!areaExecutadaM2 || areaExecutadaM2 <= 0 || !dataExecucao) continue;
  const tipo = tiposPorcelanato.find((t) => t.id === `porc-${slugify(ambiente)}`);
  apontamentosPorcelanato.push({
    id: `am-porc-${apontamentosPorcelanato.length + 1}`,
    tipoId: tipo ? tipo.id : `porc-${slugify(ambiente)}`,
    areaExecutadaM2,
    dataExecucao,
  });
}

// ---------------------------------------------------------------------------
// Geração do arquivo TypeScript
// ---------------------------------------------------------------------------

function ts(v) {
  return JSON.stringify(v, null, 2);
}

const arquivo = `import type {
  AmbienteForro,
  ApontamentoPorcelanato,
  EscopoLocalizacao,
  Obra,
  ParedeDrywall,
  ParedePlaqueamentoInterno,
  RegistroProducao,
  TipoPorcelanato,
} from "./types";

// GERADO POR scripts/sync-from-excel-amaggi.mjs — não editar à mão.
// Rodar: node scripts/sync-from-excel-amaggi.mjs (a partir de app/)

export const OBRA_AMAGGI_DATA_VERSION = ${OBRA_AMAGGI_DATA_VERSION};

/** Aba "Plaqueamento Externo (Escopo)" da planilha Produtividade Amaggi.xlsx. */
const ESCOPO_EXTERNO_AMAGGI: EscopoLocalizacao[] = ${ts(escopoExterno)};

/** Aba "Histórico-Plaqueamento Externo" — apontamentos reais de produção. */
const REGISTROS_AMAGGI: RegistroProducao[] = ${ts(registros)};

/** Aba "Paredes Internas Steel" — montagem estrutural (card "Painéis internos"). */
const PAREDES_DRYWALL_AMAGGI: ParedeDrywall[] = ${ts(paredesDrywall)};

/** Aba "Plaqueamento Interno" — placas Performa/RU, inclui face interna das paredes externas (códigos EXT-*). */
const PAREDES_INTERNO_AMAGGI: ParedePlaqueamentoInterno[] = ${ts(paredesInterno)};

/** Aba "Forro". */
const FORRO_AMAGGI: AmbienteForro[] = ${ts(forro)};

/** Aba "Revestimentos (Escopo)". */
const TIPOS_PORCELANATO_AMAGGI: TipoPorcelanato[] = ${ts(tiposPorcelanato)};

/** Aba "Revestimentos - Produção" — apontamentos reais. */
const APONTAMENTOS_PORCELANATO_AMAGGI: ApontamentoPorcelanato[] = ${ts(apontamentosPorcelanato)};

export const OBRA_AMAGGI: Obra = {
  id: "amaggi-001",
  nome: "Amaggi - Steel Frame",
  cliente: "Amaggi Exportação e Importação Ltda.",
  escopo: ESCOPO_EXTERNO_AMAGGI,
  paredesDrywall: PAREDES_DRYWALL_AMAGGI,
  paredesInterno: PAREDES_INTERNO_AMAGGI,
  forro: FORRO_AMAGGI,
  tiposPorcelanato: TIPOS_PORCELANATO_AMAGGI,
  apontamentosPorcelanato: APONTAMENTOS_PORCELANATO_AMAGGI,
  registros: REGISTROS_AMAGGI,
  resumos: [],
  observacoesGerais:
    "Escopo de Plaqueamento Externo, Painéis Internos, Plaqueamento Interno (Performa/RU), Forro e Revestimentos " +
    "sincronizado automaticamente de Produtividade Amaggi.xlsx (scripts/sync-from-excel-amaggi.mjs). " +
    "Apontamentos de produção entram conforme forem lançados nas abas Histórico-Plaqueamento Externo e Revestimentos - Produção.",
};
`;

writeFileSync(OUT_PATH, arquivo);

const counts = {
  escopoExterno: escopoExterno.length,
  registros: registros.length,
  paredesDrywall: paredesDrywall.length,
  paredesInterno: paredesInterno.length,
  forro: forro.length,
  tiposPorcelanato: tiposPorcelanato.length,
  apontamentosPorcelanato: apontamentosPorcelanato.length,
};
console.log(JSON.stringify({ counts }));

const CRITICOS = ["escopoExterno", "paredesDrywall", "paredesInterno", "forro", "tiposPorcelanato"];
const zerados = CRITICOS.filter((k) => counts[k] === 0);
if (zerados.length > 0) {
  console.error(
    `\n⚠️  Sync suspeito: ${zerados.join(", ")} veio com 0. Provável aba renomeada/movida — conferir antes de publicar.\n`
  );
  process.exitCode = 1;
}
