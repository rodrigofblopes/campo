"use client";

import { GrupoFrenteView } from "@/components/GrupoFrenteView";
import { GRUPOS_SERVICO } from "@/lib/servicos";

const grupo = GRUPOS_SERVICO.find((g) => g.id === "Plaqueamento Interno")!;

export default function PlaqueamentoInternoPage() {
  return (
    <div>
      <p className="mb-4 text-sm text-slate-600">{grupo.descricao}</p>
      <GrupoFrenteView grupoId="Plaqueamento Interno" />
    </div>
  );
}
