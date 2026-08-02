/** Lógica compartilhada de importação da aba Porcelanato (sync + excel-import). */

export const DESCRICOES_PORCELANATO = {
  "pc-ugl": "Porcelanato UGL 90x90 Polido 8 mm Eliane Minimun Cimento PO",
  "pc-parede": "Revestimento de Parede Forma Branco 32x60",
};

export function slugPorcelanato(descricao) {
  if (descricao.includes("UGL 90x90")) return "pc-ugl";
  if (descricao.includes("32x60")) return "pc-parede";
  return null;
}

/** Ambientes detalhados já compõem totais de piso/parede UGL — não somar de novo. */
export function isSubAreaEscopoPorcelanato(descTipo) {
  const d = descTipo.toLowerCase();
  if (d.includes("banheiro")) return true;
  if (d.startsWith("copa")) return true;
  if (d.startsWith("lixeira")) return true;
  if (d.includes("ambientes")) return true;
  return false;
}

export function importarPorcelanatoRows(rows, formatDate) {
  const escopoPorId = { "pc-ugl": 0, "pc-parede": 0 };
  const tipos = [];
  const apontamentos = [];
  let paId = 1;

  for (const row of rows) {
    const descTipo = String(row["Tipo de Porcelanato"] ?? row.Tipo ?? "").trim();
    const escopoRaw = row["Escopo (m²)"] ?? row["Escopo (m2)"] ?? "";
    if (!descTipo || descTipo === "Escopo (m²)") continue;

    const escopoTipo = parseFloat(String(escopoRaw).replace(",", "."));
    if (isNaN(escopoTipo) || escopoTipo <= 0) continue;

    const id = slugPorcelanato(descTipo);
    if (!id) continue;

    // Ambientes detalhados (banheiro, copa, lixeira, ambientes) já compõem o
    // total do material — nunca somar de novo, nem para parede 32x60.
    if (isSubAreaEscopoPorcelanato(descTipo)) continue;

    // Linhas "... - Total =" apenas restatement do total já contado na linha
    // base do material — ignorar para não contar a mesma área duas vezes.
    if (descTipo.toLowerCase().includes("total")) continue;

    if (descTipo.includes("Porcelanato UGL") || id === "pc-parede") {
      escopoPorId[id] += escopoTipo;
    }
  }

  for (const id of ["pc-ugl", "pc-parede"]) {
    if (escopoPorId[id] > 0) {
      tipos.push({
        id,
        descricao: DESCRICOES_PORCELANATO[id],
        areaTotalM2: Math.round(escopoPorId[id] * 100) / 100,
      });
    }
  }

  for (const row of rows) {
    const desc = String(row.Descrição ?? row.Descricao ?? "").trim();
    if (!desc || desc.toLowerCase().includes("total executado")) continue;

    const areaExec = parseFloat(
      String(
        row["Área executada (m²)"] ?? row["Area executada (m2)"] ?? row["Área executada"] ?? ""
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
