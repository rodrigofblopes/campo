"use client";

import { GrupoFrenteView } from "@/components/GrupoFrenteView";
import { RegistroProducaoPanel } from "@/components/RegistroProducaoPanel";
import { GRUPOS_SERVICO, SERVICOS_PLAQUEAMENTO } from "@/lib/servicos";

const grupo = GRUPOS_SERVICO.find((g) => g.id === "Plaqueamento Externo")!;

export default function PlaqueamentoExternoPage() {
  return (
    <div>
      <p className="mb-4 text-sm text-slate-600">{grupo.descricao}</p>
      <GrupoFrenteView grupoId="Plaqueamento Externo" ocultarApontamentos />
      <RegistroProducaoPanel
        titulo="Histórico — Plaqueamento externo"
        descricao="Apontamentos da planilha (Glasroc-x, juntas, basecoat) — somente consulta."
        servicosFiltro={[...SERVICOS_PLAQUEAMENTO]}
      />
    </div>
  );
}
