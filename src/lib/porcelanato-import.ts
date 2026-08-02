import type { ApontamentoPorcelanato, TipoPorcelanato } from "./types";

export const DESCRICOES_PORCELANATO: Record<string, string> = {
  "pc-ugl": "Porcelanato UGL 90x90 Polido 8 mm Eliane Minimun Cimento PO",
  "pc-parede": "Revestimento de Parede Forma Branco 32x60",
};

export function slugPorcelanato(descricao: string): "pc-ugl" | "pc-parede" | null {
  if (descricao.includes("UGL 90x90")) return "pc-ugl";
  if (descricao.includes("32x60")) return "pc-parede";
  return null;
}

export function isSubAreaEscopoPorcelanato(descTipo: string): boolean {
  const d = descTipo.toLowerCase();
  if (d.includes("banheiro")) return true;
  if (d.startsWith("copa")) return true;
  if (d.startsWith("lixeira")) return true;
  if (d.includes("ambientes")) return true;
  return false;
}

export function importarPorcelanatoRows(
  rows: Record<string, unknown>[],
  formatDate: (val: unknown) => string | null
): { tipos: TipoPorcelanato[]; apontamentos: ApontamentoPorcelanato[] } {
  const escopoPorId: Record<string, number> = { "pc-ugl": 0, "pc-parede": 0 };
  const tipos: TipoPorcelanato[] = [];
  const apontamentos: ApontamentoPorcelanato[] = [];
  let paId = 1;

  for (const row of rows) {
    const descTipo = String(row["Tipo de Porcelanato"] ?? row.Tipo ?? "").trim();
    const escopoRaw = row["Escopo (m²)"] ?? row["Escopo (m2)"] ?? "";
    if (!descTipo || descTipo === "Escopo (m²)") continue;

    const escopoTipo = parseFloat(String(escopoRaw).replace(",", "."));
    if (isNaN(escopoTipo) || escopoTipo <= 0) continue;

    const id = slugPorcelanato(descTipo);
    if (!id) continue;

    if (isSubAreaEscopoPorcelanato(descTipo)) {
      if (id === "pc-parede") escopoPorId[id] += escopoTipo;
      continue;
    }

    if (descTipo.includes("Porcelanato UGL") || id === "pc-parede") {
      escopoPorId[id] += escopoTipo;
    }
  }

  for (const id of ["pc-ugl", "pc-parede"] as const) {
    if (escopoPorId[id] > 0) {
      tipos.push({
        id,
        descricao: DESCRICOES_PORCELANATO[id],
        areaTotalM2: Math.round(escopoPorId[id] * 100) / 100,
      });
    }
  }

  for (const row of rows) {
    const desc = String(row["Descrição"] ?? row.Descricao ?? row["Descrição "] ?? "").trim();
    if (!desc || desc.toLowerCase().includes("total executado")) continue;

    const areaExec = parseFloat(
      String(
        row["Área executada (m²)"] ??
          row["Area executada (m2)"] ??
          row["Área executada"] ??
          ""
      ).replace(",", ".")
    );
    const data = formatDate(row.Data ?? row["Data execução"]);
    const tipoId = slugPorcelanato(desc);
    if (!tipoId || isNaN(areaExec) || areaExec <= 0 || !data) continue;

    apontamentos.push({
      id: `pa-${paId++}`,
      tipoId,
      areaExecutadaM2: areaExec,
      dataExecucao: data,
    });
  }

  return { tipos, apontamentos };
}
