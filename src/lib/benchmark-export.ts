import * as XLSX from "xlsx";
import type { BenchmarkServico, RankingEquipe } from "./dashboard";
import type { Obra } from "./types";

/**
 * Exporta o benchmark de produtividade (RUP por serviço) e o ranking de
 * equipes em um único xlsx — pensado para ser reaproveitado como
 * referência de orçamento e cronograma em novas obras.
 */
export function exportarBenchmarkXLSX(
  obra: Obra,
  benchmark: BenchmarkServico[],
  ranking: RankingEquipe[]
) {
  const wb = XLSX.utils.book_new();

  const benchmarkData = [
    ["Serviço", "Grupo", "Área executada (m²)", "Dias com apontamento", "RUP (m²/dia)"],
    ...benchmark.map((b) => [b.label, b.grupoLabel, b.areaTotal, b.dias, b.rupDiario]),
  ];
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(benchmarkData),
    "Benchmark por serviço"
  );

  const rankingData = [
    ["Equipe", "Área total (m²)", "Dias trabalhados", "RUP (m²/dia)", "Serviços"],
    ...ranking.map((r) => [r.equipe, r.areaTotal, r.dias, r.rupDiario, r.servicos]),
  ];
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(rankingData),
    "Ranking de equipes"
  );

  const nomeArquivo = `benchmark-produtividade-${obra.nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}.xlsx`;

  XLSX.writeFile(wb, nomeArquivo);
}
