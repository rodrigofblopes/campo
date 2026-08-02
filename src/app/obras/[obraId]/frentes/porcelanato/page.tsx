"use client";

import { PorcelanatoPanel } from "@/components/PorcelanatoPanel";
import { GRUPOS_SERVICO } from "@/lib/servicos";

const grupo = GRUPOS_SERVICO.find((g) => g.id === "Porcelanato")!;

export default function PorcelanatoPage() {
  return (
    <div>
      <p className="mb-4 text-sm text-slate-600">{grupo.descricao}</p>
      <PorcelanatoPanel />
    </div>
  );
}
