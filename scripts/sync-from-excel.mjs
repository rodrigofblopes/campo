import { readFileSync, writeFileSync } from "fs";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(__dirname, ".."));

// Build first so importarExcel is available as CJS from .next - use xlsx directly
import XLSX from "xlsx";
import { importarPorcelanatoRows } from "./porcelanato-import.mjs";

const xlsxPath = join(__dirname, "../../Sicredi/Produtividade Sicredi.xlsx");
const wb = XLSX.readFile(xlsxPath, { cellDates: true });

/**
 * Acesso a aba com validação — se o nome mudar na planilha (já aconteceu:
 * "Parede Drywall" virou "Painéis Internos" e quebrou o sync em silêncio,
 * zerando a contagem de paredes sem erro nenhum), falha alto e sugere o
 * nome mais parecido em vez de devolver undefined e gerar dado zerado.
 */
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
  if (!val) return null;
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  if (typeof val === "number") {
    const d = XLSX.SSF.parse_date_code(val);
    if (d) return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  const str = String(val);
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
  // aceita dd/mm/aaaa, inclusive quando há mais de uma data no campo
  // (ex.: "13/07/2026;14/07/2026" ou "07/07/2026 e 08/07/2026")
  const matches = str.match(/\d{1,2}\/\d{1,2}\/\d{4}/g);
  if (matches) {
    for (const m of matches) {
      const [d, mo, y] = m.split("/").map(Number);
      if (d >= 1 && d <= 31 && mo >= 1 && mo <= 12 && y >= 2020 && y <= 2035) {
        return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      }
    }
  }
  return null;
}

function normalizeServico(val) {
  const lower = String(val).toLowerCase();
  if (lower.includes("glasroc") || (lower.includes("plaqueamento") && !lower.includes("performa") && !/\bru\b/.test(lower)))
    return "Plaqueamento Glasroc-x";
  if (lower.includes("tratamento") || lower.includes("junta")) return "Tratamento de Juntas";
  if (lower.includes("basecoat")) return "Basecoat";
  return null;
}

/**
 * Basecoat é apontado por demão (1ª, 2ª ou "1 e 2ª" combinada) na planilha.
 * A 2ª demão cobre a mesma área física da 1ª — contar as duas somaria o m²
 * em dobro. Consideramos só uma demão: mantemos linhas da 1ª demão (isoladas
 * ou combinadas com a 2ª) e descartamos linhas exclusivas de 2ª demão.
 */
function isSomenteSegundaDemao(val) {
  const texto = String(val ?? "");
  return texto.includes("2") && !texto.includes("1");
}

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
  const areaM2 = parseFloat(String(row[4] ?? "").replace(",", "."));
  if (!equipe || !localizacao || !data || !servico || isNaN(areaM2) || areaM2 <= 0) continue;
  if (equipe.toLowerCase().includes("área total") || equipe === "Equipe") continue;
  if (servico === "Basecoat" && isSomenteSegundaDemao(row[3])) continue;
  // col5 agora é "Valor (R$)"; a Observação passou para col6
  registros.push({ equipe, localizacao, data, servico, areaM2, observacao: String(row[6] ?? "").trim() || undefined });
}

const placaRows = XLSX.utils.sheet_to_json(getSheet("Plaqueamento Externo"), { header: 1, defval: "" });
const escopo = [];
const resumos = [];
for (const row of placaRows) {
  const loc = String(row[0] ?? "").trim();
  if (!loc || loc.toLowerCase().includes("localização") || loc.toLowerCase().includes("plaqueamento externo")) continue;
  const escopoM2 = parseFloat(String(row[1] ?? "").replace(",", "."));
  // planilha atual: col2-5 = escopo por serviço (Glasroc-x/Tratamento/Basecoat/Total),
  // col7 = área executada, col12 = dias, col13 = RUP, col14 = observação
  const areaM2 = parseFloat(String(row[7] ?? "").replace(",", "."));
  const dias = parseInt(String(row[12] ?? ""), 10);
  const rup = parseFloat(String(row[13] ?? "").replace(",", "."));
  const obs = String(row[14] ?? "").trim();
  if (!isNaN(escopoM2) && escopoM2 > 0) escopo.push({ localizacao: loc, areaTotalM2: escopoM2 });
  if (!isNaN(areaM2) && areaM2 > 0) {
    resumos.push({
      localizacao: loc,
      servico: "Plaqueamento Glasroc-x",
      areaM2,
      dias: dias > 0 ? dias : 1,
      rupDiario: !isNaN(rup) && rup > 0 ? rup : areaM2 / (dias > 0 ? dias : 1),
      equipes: [],
      observacao: obs || undefined,
    });
  }
}

// Sheet renamed de "Parede Drywall" para "Painéis Internos" (mesma estrutura de colunas).
const dwRows = XLSX.utils.sheet_to_json(getSheet("Painéis Internos"), { defval: "" });
const paredes = dwRows
  .map((row) => {
    const n = parseInt(String(row.Parede ?? "").replace(/\D/g, ""), 10);
    if (!n) return null;
    const data = formatDate(row.Data);
    return {
      n,
      altura: parseFloat(String(row["Altura (m)"] ?? "").replace(",", ".")),
      comprimento: parseFloat(String(row["Comprimento (m)"] ?? "").replace(",", ".")),
      area: parseFloat(String(row["Área (m²)"] ?? "").replace(",", ".")),
      data,
    };
  })
  .filter(Boolean);

const pcRows = XLSX.utils.sheet_to_json(getSheet("Porcelanato"), { defval: "" });
const { tipos, apontamentos } = importarPorcelanatoRows(pcRows, formatDate);

// Aba "Forro " (com espaço no nome) — um ambiente por linha, com escopo (m²) e
// duas datas de execução (estruturação e plaqueamento). Nomes de ambiente se
// repetem (ex.: "Circulação" aparece em vários pontos da planta); numeramos
// as repetições para não colidir no motor genérico de escopo por localização.
const forroRows = XLSX.utils.sheet_to_json(getSheet("Forro "), { defval: "" });
const forro = [];
const forroNomeCount = new Map();
for (const row of forroRows) {
  const ambienteBase = String(row["Ambiente"] ?? "").trim();
  if (!ambienteBase) continue;
  const areaM2 = parseFloat(String(row["Área(m²)"] ?? "").replace(",", "."));
  if (isNaN(areaM2) || areaM2 <= 0) continue;
  const n = (forroNomeCount.get(ambienteBase) ?? 0) + 1;
  forroNomeCount.set(ambienteBase, n);
  const ambiente = n > 1 ? `${ambienteBase} (${n})` : ambienteBase;
  const dataEstruturacao = formatDate(row["Data Estruturação"]);
  const dataPlaqueamento = formatDate(row["Data Plaqueamento"]);
  forro.push({
    id: `fr-${forro.length + 1}`,
    ambiente,
    areaM2: Math.round(areaM2 * 1000) / 1000,
    dataEstruturacao: dataEstruturacao ?? undefined,
    dataPlaqueamento: dataPlaqueamento ?? undefined,
  });
}

function parseNum(val) {
  const n = parseFloat(String(val ?? "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

const internoRows = XLSX.utils.sheet_to_json(getSheet("Plaqueamento Interno"), {
  header: 1,
  defval: "",
});
const paredesInterno = [];
const escopoInterno = { performa: undefined, ru: undefined };

for (let i = 0; i < Math.min(3, internoRows.length); i++) {
  const label = String(internoRows[i][8] ?? "").trim();
  const esc = parseNum(internoRows[i][9]);
  if (label.includes("Performa") && esc) escopoInterno.performa = esc;
  if (label.includes("RU") && esc) escopoInterno.ru = esc;
}

const steelIdx = internoRows.findIndex((r) => String(r[0] ?? "").trim() === "Parede Steel");

for (let i = 1; i < (steelIdx > 0 ? steelIdx : internoRows.length); i++) {
  const n = parseInt(String(internoRows[i][0] ?? ""), 10);
  if (!n) continue;
  // header atual: n, altura, comprimento, área, Faces, Placa ST, Placa RU, Valor Plaqueamento(R$), Data Plaqueamento, ...
  const performaM2 = parseNum(internoRows[i][5]);
  const ruM2 = parseNum(internoRows[i][6]);
  const data = formatDate(internoRows[i][8]);
  if (!performaM2 && !ruM2) continue;
  paredesInterno.push({
    codigo: String(n).padStart(2, "0"),
    tipo: "drywall",
    performaM2,
    ruM2,
    data,
  });
}

if (steelIdx >= 0) {
  for (let i = steelIdx + 1; i < internoRows.length; i++) {
    const codigo = String(internoRows[i][0] ?? "").trim();
    if (!codigo || codigo.toLowerCase().startsWith("total")) break;
    // header atual: codigo, área, Placa Performa, Placa RU, Valor Plaqueamento(R$), Data Plaqueamento, ...
    const areaM2 = parseNum(internoRows[i][1]);
    const performaM2 = parseNum(internoRows[i][2]);
    const ruM2 = parseNum(internoRows[i][3]);
    const data = formatDate(internoRows[i][5]);
    if (!areaM2 && !performaM2 && !ruM2) continue;
    paredesInterno.push({
      codigo,
      tipo: "steel",
      areaM2,
      performaM2,
      ruM2,
      data,
    });
  }
}

const out = { registros, escopo, resumos, paredes, tipos, apontamentos, paredesInterno, escopoInterno, forro };
writeFileSync(join(__dirname, "sync-output.json"), JSON.stringify(out, null, 2));

const counts = Object.fromEntries(Object.entries(out).map(([k, v]) => [k, Array.isArray(v) ? v.length : v]));
console.log(JSON.stringify({ counts }));

/**
 * Checagem de sanidade — evita repetir o bug de "Painéis Internos" (aba
 * renomeada, sync rodou sem erro e devolveu paredes:0 sem avisar ninguém).
 * "resumos" fica de fora: campo legado, não é mais lido pelo dashboard
 * (resumosCalculados é derivado de registros em tempo de execução).
 */
const CRITICOS = ["registros", "escopo", "paredes", "tipos", "apontamentos", "paredesInterno", "forro"];
const zerados = CRITICOS.filter((k) => (counts[k] ?? 0) === 0);
if (zerados.length > 0) {
  console.error(
    `\n⚠️  Sync suspeito: ${zerados.join(", ")} veio com 0 registros. ` +
      `Provável aba renomeada/movida na planilha ou coluna fora do lugar — conferir antes de rodar generate-default-data.mjs.\n`
  );
  process.exitCode = 1;
}
