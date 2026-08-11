"use client";

import { ForroPanel } from "@/components/ForroPanel";
import { GRUPOS_SERVICO } from "@/lib/servicos";

const grupo = GRUPOS_SERVICO.find((g) => g.id === "Forro")!;

export default function ForroPage() {
  return (
    <div>
      <p className="mb-4 text-sm text-slate-600">{grupo.descricao}</p>
      <ForroPanel />
    </div>
  );
}
