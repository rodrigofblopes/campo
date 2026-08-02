import * as XLSX from "xlsx";
import type { Obra, EscopoLocalizacao, ParedeDrywall, QuantitativoServico, RegistroProducao, ResumoLocalizacao, Servico, TipoPorcelanato, ApontamentoPorcelanato } from "./types";
import { SERVICOS, SERVICOS_PLAQUEAMENTO } from "./types";
import { derivarQuantitativosDeEscopo } from "./escopo";
import { labelParede } from "./paredes-drywall";
import { labelPorcelanatoCurto } from "./porcelanato";
import { importarPorcelanatoRows } from "./porcelanato-import";

function normalizeServico(val: string): Servico | null {
  const lower = val.toLowerCase();
  if (lower.includes("plaqueamento") || lower.includes("glasroc")) {
    if (lower.includes("externo") && lower.includes("glasroc")) return "Plaqueamento Glasroc-x";
    if (lower.includes("performa")) return "Plaqueamento Performa";
    if (/\bru\b/.test(lower) || lower.includes(" placa ru")) return "Plaqueamento RU";
    return "Plaqueamento Glasroc-x";
  }
  if (lower.includes("tratamento") || lower.includes("junta")) {
    return "Tratamento de Juntas";
  }
  if (lower.includes("basecoat")) {
    return "Basecoat";
  }
  if (lower.includes("porcelanato")) {
    return "Assentamento de Porcelanato";
  }
  if (lower.includes("drywall")) {
    return "Paredes de Drywall";
  }
  if (lower.includes("performa")) {
    return "Plaqueamento Performa";
  }
  if (/\bru\b/.test(lower)) {
    return "Plaqueamento RU";
  }
  return null;
}

function formatDate(val: unknown): string | null {
  if (!val) return null;
  if (val instanceof Date) {
    return val.toISOString().slice(0, 10);
  }
  if (typeof val === "number") {
    const d = XLSX.SSF.parse_date_code(val);
    if (d) {
      const mm = String(d.m).padStart(2, "0");
      const dd = String(d.d).padStart(2, "0");
      return `${d.y}-${mm}-${dd}`;
    }
  }
  const str = String(val);
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
  return null;
}

function isSubtotalRow(equipe: string, servico: string): boolean {
  return (
    equipe.toLowerCase().includes("área total") ||
    equipe.toLowerCase().includes("area total") ||
    !servico
  );
}

function isHeaderHistoricoRow(cols: unknown[]): boolean {
  const first = String(cols[0] ?? "").trim().toLowerCase();
  return first === "equipe" || first === "";
}

function importarHistoricoPlaqueamento(
  wb: XLSX.WorkBook,
  sheetNames: string[]
): Omit<RegistroProducao, "id">[] {
  const sheetName = sheetNames.find((n) =>
    /hist[oó]rico.*plaqueamento|plaqueamento.*hist[oó]rico/i.test(n)
  );
  if (!sheetName) return [];

  const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[sheetName], {
    header: 1,
    defval: "",
    raw: false,
  });

  const registros: Omit<RegistroProducao, "id">[] = [];

  for (const row of rows) {
    if (!Array.isArray(row)) continue;
    if (isHeaderHistoricoRow(row)) continue;

    const equipe = String(row[0] ?? "").trim();
    const localizacao = String(row[1] ?? "").trim();
    const data = formatDate(row[2]);
    const servicoRaw = String(row[3] ?? "").trim();
    const areaRaw = row[4];
    const observacao = String(row[5] ?? "").trim();

    const servico = normalizeServico(servicoRaw);
    const areaM2 = parseFloat(String(areaRaw).replace(",", "."));

    if (
      !equipe ||
      !localizacao ||
      !data ||
      !servico ||
      isNaN(areaM2) ||
      areaM2 <= 0 ||
      isSubtotalRow(equipe, servicoRaw)
    ) {
      continue;
    }

    registros.push({
      equipe,
      localizacao,
      data,
      servico,
      areaM2,
      observacao: observacao || undefined,
    });
  }

  return registros;
}

function importarPlaqueamentoExterno(
  wb: XLSX.WorkBook,
  sheetNames: string[]
): { escopo: EscopoLocalizacao[]; resumos: ResumoLocalizacao[] } {
  const sheetName = sheetNames.find(
    (n) =>
      /^plaqueamento externo$/i.test(n.trim()) &&
      !/hist[oó]rico/i.test(n)
  );
  if (!sheetName) return { escopo: [], resumos: [] };

  const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[sheetName], {
    header: 1,
    defval: "",
    raw: false,
  });

  const escopo: EscopoLocalizacao[] = [];
  const resumos: ResumoLocalizacao[] = [];

  for (const row of rows) {
    if (!Array.isArray(row)) continue;
    const localizacao = String(row[0] ?? "").trim();
    if (
      !localizacao ||
      localizacao.toLowerCase().includes("localização") ||
      localizacao.toLowerCase().includes("plaqueamento externo")
    ) {
      continue;
    }

    const escopoM2 = parseFloat(String(row[1] ?? "").replace(",", "."));
    const areaM2 = parseFloat(String(row[2] ?? "").replace(",", "."));
    const dias = parseInt(String(row[3] ?? ""), 10);
    const rupDiario = parseFloat(String(row[4] ?? "").replace(",", "."));
    const observacao = String(row[5] ?? "").trim();

    if (!isNaN(escopoM2) && escopoM2 > 0) {
      escopo.push({ localizacao, areaTotalM2: escopoM2 });
    }

    if (!isNaN(areaM2) && areaM2 > 0) {
      resumos.push({
        localizacao,
        servico: "Plaqueamento Glasroc-x",
        areaM2,
        dias: dias > 0 ? dias : 1,
        rupDiario:
          !isNaN(rupDiario) && rupDiario > 0
            ? rupDiario
            : areaM2 / (dias > 0 ? dias : 1),
        equipes: [],
        observacao: observacao || undefined,
      });
    }
  }

  return { escopo, resumos };
}

function importarProducaoLegado(
  wb: XLSX.WorkBook,
  sheetName: string
): Omit<RegistroProducao, "id">[] {
  const registros: Omit<RegistroProducao, "id">[] = [];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[sheetName], {
    defval: "",
    raw: false,
  });

  for (const row of rows) {
    const equipe = String(row["Equipe"] ?? row["equipe"] ?? "").trim();
    const localizacao = String(
      row["Localização"] ?? row["Localizacao"] ?? row["localização"] ?? ""
    ).trim();
    const data = formatDate(row["Data"] ?? row["data"]);
    const servicoRaw = String(row["Serviço"] ?? row["Servico"] ?? "").trim();
    const areaRaw = row["Área (m²)"] ?? row["Area (m2)"] ?? row["Área"] ?? 0;
    const observacao = String(row["Observação"] ?? row["Observacao"] ?? "").trim();

    const servico = normalizeServico(servicoRaw);
    const areaM2 = parseFloat(String(areaRaw).replace(",", "."));

    if (
      !equipe ||
      !localizacao ||
      !data ||
      !servico ||
      isNaN(areaM2) ||
      isSubtotalRow(equipe, servicoRaw)
    ) {
      continue;
    }

    registros.push({
      equipe,
      localizacao,
      data,
      servico,
      areaM2,
      observacao: observacao || undefined,
    });
  }

  return registros;
}

function importarParedesDrywall(
  wb: XLSX.WorkBook,
  sheetNames: string[]
): { paredes: ParedeDrywall[]; registros: Omit<RegistroProducao, "id">[] } {
  const sheetName = sheetNames.find((n) =>
    /parede.*drywall|drywall.*parede/i.test(n)
  );
  if (!sheetName) return { paredes: [], registros: [] };

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    wb.Sheets[sheetName],
    { defval: "" }
  );

  const paredes: ParedeDrywall[] = [];
  const registros: Omit<RegistroProducao, "id">[] = [];

  for (const row of rows) {
    const paredeRaw =
      row["Parede"] ?? row["Nº"] ?? row["Numero"] ?? row["Número"] ?? "";
    const n = parseInt(String(paredeRaw).replace(/\D/g, ""), 10);
    if (!n || isNaN(n)) continue;

    const altura = parseFloat(
      String(row["Altura (m)"] ?? row["Altura"] ?? "").replace(",", ".")
    );
    const comprimento = parseFloat(
      String(row["Comprimento (m)"] ?? row["Comprimento"] ?? "").replace(",", ".")
    );
    const area = parseFloat(
      String(row["Área (m²)"] ?? row["Area (m2)"] ?? row["Área"] ?? "").replace(
        ",",
        "."
      )
    );
    const dataExecucao = formatDate(row["Data"] ?? row["Data execução"]);

    const codigo = String(n);
    paredes.push({
      id: `pd-${String(n).padStart(2, "0")}`,
      codigo,
      alturaM: isNaN(altura) ? undefined : altura,
      comprimentoM: isNaN(comprimento) ? undefined : comprimento,
      areaM2: isNaN(area) ? undefined : Math.round(area * 1000) / 1000,
      dataExecucao: dataExecucao ?? undefined,
      status: dataExecucao ? "concluida" : "pendente",
    });

    if (dataExecucao && !isNaN(area) && area > 0) {
      registros.push({
        equipe: "Planilha",
        localizacao: labelParede(codigo),
        data: dataExecucao,
        servico: "Paredes de Drywall",
        areaM2: area,
        observacao: "Executado — aba Parede Drywall",
      });
    }
  }

  return { paredes, registros };
}

function importarPorcelanato(
  wb: XLSX.WorkBook,
  sheetNames: string[]
): {
  tipos: TipoPorcelanato[];
  apontamentos: ApontamentoPorcelanato[];
  registros: Omit<RegistroProducao, "id">[];
} {
  const sheetName = sheetNames.find((n) => /^porcelanato$/i.test(n.trim()));
  if (!sheetName) return { tipos: [], apontamentos: [], registros: [] };

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    wb.Sheets[sheetName],
    { defval: "" }
  );

  const { tipos, apontamentos } = importarPorcelanatoRows(rows, formatDate);
  const registros: Omit<RegistroProducao, "id">[] = apontamentos.map((ap) => {
    const tipo = tipos.find((t) => t.id === ap.tipoId);
    return {
      equipe: "Planilha",
      localizacao: labelPorcelanatoCurto(tipo?.descricao ?? ap.tipoId),
      data: ap.dataExecucao,
      servico: "Assentamento de Porcelanato",
      areaM2: ap.areaExecutadaM2,
      observacao: "Executado — aba Porcelanato",
    };
  });

  return { tipos, apontamentos, registros };
}

export function importarExcel(buffer: ArrayBuffer, nomeObra = "Obra Importada"): Obra {
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheetNames = wb.SheetNames;

  let idCounter = 1;
  const historicoRegs = importarHistoricoPlaqueamento(wb, sheetNames);

  const producaoSheet = sheetNames.find(
    (n) =>
      n.toLowerCase().includes("produ") &&
      !/hist[oó]rico/i.test(n)
  );
  const legadoRegs = producaoSheet
    ? importarProducaoLegado(wb, producaoSheet)
    : [];

  const registrosBase = historicoRegs.length ? historicoRegs : legadoRegs;
  const registros: RegistroProducao[] = registrosBase.map((r) => ({
    ...r,
    id: `imp-${idCounter++}`,
  }));

  const { escopo: escopoPlaca, resumos: resumosPlaca } =
    importarPlaqueamentoExterno(wb, sheetNames);

  const resumoSheet = sheetNames.find(
    (n) => n.toLowerCase().includes("resumo") && !/plaqueamento externo/i.test(n)
  );
  const resumos: ResumoLocalizacao[] = resumosPlaca.length ? [...resumosPlaca] : [];
  const quantSheet = sheetNames.find((n) =>
    n.toLowerCase().includes("quantit")
  );
  const servicosSheet = sheetNames.find((n) => n.toLowerCase().includes("servi"));

  if (resumoSheet && !resumos.length) {
    const wsResumo = wb.Sheets[resumoSheet];
    const resumoRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wsResumo, {
      defval: "",
    });
    for (const row of resumoRows) {
      const localizacao = String(
        row["Localização"] ?? row["Localizacao"] ?? ""
      ).trim();
      const areaM2 = parseFloat(
        String(row["Área (m²)"] ?? row["Area (m2)"] ?? 0).replace(",", ".")
      );
      const dias = parseInt(String(row["Dias"] ?? 0), 10);
      const rupDiario = parseFloat(
        String(row["Produção Diária (RUP)"] ?? row["RUP"] ?? 0).replace(",", ".")
      );
      const observacao = String(row["Observação"] ?? row["Observacao"] ?? "").trim();

      if (!localizacao || isNaN(areaM2)) continue;

      resumos.push({
        localizacao,
        servico: "Plaqueamento Glasroc-x",
        areaM2,
        dias: dias || 1,
        rupDiario: rupDiario || areaM2 / (dias || 1),
        equipes: [],
        observacao: observacao || undefined,
      });
    }
  }

  const escopo: EscopoLocalizacao[] = escopoPlaca.length ? [...escopoPlaca] : [];
  let quantitativos: QuantitativoServico[] = [];
  const produzidoPlanilha: Omit<RegistroProducao, "id">[] = [];

  if (quantSheet) {
    const wsQuant = wb.Sheets[quantSheet];
    const quantRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wsQuant, {
      defval: "",
    });
    for (const row of quantRows) {
      const localizacao = String(
        row["Localização"] ?? row["Localizacao"] ?? ""
      ).trim();
      const servicoRaw = String(row["Serviço"] ?? row["Servico"] ?? "").trim();
      const totalRaw =
        row["Total (m²)"] ??
        row["Total (m2)"] ??
        row["Total"] ??
        row["Escopo (m²)"] ??
        0;
      const produzidoRaw =
        row["Produzido (m²)"] ??
        row["Produzido (m2)"] ??
        row["Produzido"] ??
        row["Executado (m²)"] ??
        "";

      const servico = normalizeServico(servicoRaw);
      const totalM2 = parseFloat(String(totalRaw).replace(",", "."));
      const produzidoM2 = parseFloat(String(produzidoRaw).replace(",", "."));

      if (!localizacao || !servico || isNaN(totalM2)) continue;

      quantitativos.push({ localizacao, servico, totalM2 });

      if (!isNaN(produzidoM2) && produzidoM2 > 0) {
        produzidoPlanilha.push({
          equipe: "Planilha",
          localizacao,
          data: new Date().toISOString().slice(0, 10),
          servico,
          areaM2: produzidoM2,
          observacao: "Produzido acumulado importado da aba Quantitativos",
        });
      }
    }
  }

  if (servicosSheet) {
    const wsServicos = wb.Sheets[servicosSheet];
    const servicoRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
      wsServicos,
      { defval: "" }
    );
    for (const row of servicoRows) {
      const localizacao = String(
        row["Localização"] ?? row["Localizacao"] ?? ""
      ).trim();
      const areaM2 = parseFloat(
        String(row["Área (m²)"] ?? row["Area (m2)"] ?? row["Área"] ?? 0).replace(
          ",",
          "."
        )
      );
      if (!localizacao || isNaN(areaM2)) continue;
      escopo.push({ localizacao, areaTotalM2: areaM2 });
    }
  }

  if (!quantitativos.length && escopo.length) {
    quantitativos = derivarQuantitativosDeEscopo(escopo);
  }

  const registrosFinais = [...registros];
  for (const snap of produzidoPlanilha) {
    const jaTem = registrosFinais.some(
      (r) => r.servico === snap.servico && r.localizacao === snap.localizacao
    );
    if (!jaTem) {
      registrosFinais.push({
        ...snap,
        id: `imp-prod-${idCounter++}`,
      });
    }
  }

  const { paredes: paredesDrywall, registros: regsParedes } = importarParedesDrywall(
    wb,
    sheetNames
  );
  for (const snap of regsParedes) {
    const jaTem = registrosFinais.some(
      (r) =>
        r.servico === "Paredes de Drywall" &&
        r.localizacao === snap.localizacao &&
        r.data === snap.data
    );
    if (!jaTem) {
      registrosFinais.push({
        ...snap,
        id: `imp-pd-${idCounter++}`,
      });
    }
  }

  const {
    tipos: tiposPorcelanato,
    apontamentos: apontamentosPorcelanato,
    registros: regsPorcelanato,
  } = importarPorcelanato(wb, sheetNames);
  for (const snap of regsPorcelanato) {
    const jaTem = registrosFinais.some(
      (r) =>
        r.servico === "Assentamento de Porcelanato" &&
        r.localizacao === snap.localizacao &&
        r.data === snap.data &&
        r.areaM2 === snap.areaM2
    );
    if (!jaTem) {
      registrosFinais.push({
        ...snap,
        id: `imp-pc-${idCounter++}`,
      });
    }
  }

  return {
    id: `obra-${Date.now()}`,
    nome: nomeObra,
    escopo,
    quantitativos: quantitativos.length ? quantitativos : undefined,
    paredesDrywall: paredesDrywall.length ? paredesDrywall : undefined,
    tiposPorcelanato: tiposPorcelanato.length ? tiposPorcelanato : undefined,
    apontamentosPorcelanato: apontamentosPorcelanato.length
      ? apontamentosPorcelanato
      : undefined,
    registros: registrosFinais,
    resumos,
  };
}

export function exportarObraParaExcel(obra: Obra): ArrayBuffer {
  const wb = XLSX.utils.book_new();

  const producaoData = [
    ["Equipe", "Localização", "Data", "Serviço", "Área (m²)", "Observação"],
    ...obra.registros.map((r) => [
      r.equipe,
      r.localizacao,
      r.data,
      r.servico,
      r.areaM2,
      r.observacao ?? "",
    ]),
  ];
  const wsProducao = XLSX.utils.aoa_to_sheet(producaoData);
  XLSX.utils.book_append_sheet(wb, wsProducao, "Produção");

  const resumoData = [
    ["Localização", "Serviço", "Área (m²)", "Dias", "RUP (m²/dia)", "Observação"],
    ...obra.resumos.map((r) => [
      r.localizacao,
      r.servico,
      r.areaM2,
      r.dias,
      r.rupDiario,
      r.observacao ?? "",
    ]),
  ];
  const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
  XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo Produção");

  const quantRows =
    obra.quantitativos?.map((q) => {
      const produzido = obra.registros
        .filter((r) => r.servico === q.servico && r.localizacao === q.localizacao)
        .reduce((s, r) => s + r.areaM2, 0);
      return [q.localizacao, q.servico, q.totalM2, produzido];
    }) ??
    derivarQuantitativosDeEscopo(obra.escopo).map((q) => [q.localizacao, q.servico, q.totalM2, ""]);

  const quantData = [
    ["Localização", "Serviço", "Total (m²)", "Produzido (m²)"],
    ...quantRows,
  ];
  const wsQuant = XLSX.utils.aoa_to_sheet(quantData);
  XLSX.utils.book_append_sheet(wb, wsQuant, "Quantitativos");

  const servicosData = [
    ["Localização", "Área (m²)"],
    ...obra.escopo.map((e) => [e.localizacao, e.areaTotalM2]),
  ];
  const wsServicos = XLSX.utils.aoa_to_sheet(servicosData);
  XLSX.utils.book_append_sheet(wb, wsServicos, "Serviços");

  return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}

export function exportarPlanilhaModelo(): ArrayBuffer {
  const wb = XLSX.utils.book_new();

  const quantData = [
    ["Localização", "Serviço", "Total (m²)", "Produzido (m²)"],
    ["Frontal", "Plaqueamento Glasroc-x", 201, 150],
    ["Frontal", "Tratamento de Juntas", 201, 80],
    ["Frontal", "Basecoat", 201, 40],
    ["Hall", "Assentamento de Porcelanato", 120, 45],
    ["Sala reunião", "Paredes de Drywall", 85, 30],
    ["Interno — pav. 1", "Plaqueamento Performa", 500, 0],
    ["Interno — pav. 1", "Plaqueamento RU", 500, 0],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(quantData), "Quantitativos");

  const prodData = [
    ["Equipe", "Localização", "Data", "Serviço", "Área (m²)", "Observação"],
    ["William e Julio", "Fundos", "2026-06-10", "Plaqueamento Glasroc-x", 54.72, ""],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(prodData), "Produção");

  return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}

export { SERVICOS };
