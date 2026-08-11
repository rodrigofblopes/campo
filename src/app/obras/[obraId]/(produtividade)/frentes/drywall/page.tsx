"use client";

import { GrupoFrenteView } from "@/components/GrupoFrenteView";
import { ParedesDrywallPanel } from "@/components/ParedesDrywallPanel";
import { GRUPOS_SERVICO } from "@/lib/servicos";

const grupo = GRUPOS_SERVICO.find((g) => g.id === "Drywall")!;

export default function DrywallPage() {
  return (
    <div className="space-y-8">
      <p className="text-sm text-slate-600">{grupo.descricao}</p>
      <GrupoFrenteView grupoId="Drywall" />
      <ParedesDrywallPanel />
    </div>
  );
}
