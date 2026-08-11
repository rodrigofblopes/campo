"use client";

import { useState } from "react";
import { AppShell, Card, PageHeader } from "@/components/ui";
import { HorizontalScrollTabs, HorizontalTab } from "@/components/HorizontalScrollTabs";
import { ResumoDrywall } from "@/components/resumo/ResumoDrywall";
import { ResumoPlaqueamentoExterno } from "@/components/resumo/ResumoPlaqueamentoExterno";
import { ResumoPlaqueamentoInterno } from "@/components/resumo/ResumoPlaqueamentoInterno";
import { ResumoPorcelanato } from "@/components/resumo/ResumoPorcelanato";
import { ResumoForro } from "@/components/resumo/ResumoForro";
import { GRUPOS_SERVICO, type GrupoServico } from "@/lib/servicos";

const TAB_STYLE: Record<
  GrupoServico,
  { active: string; inactive: string }
> = {
  "Plaqueamento Externo": {
    active: "bg-blue-600 text-white shadow-sm",
    inactive: "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-blue-50",
  },
  Porcelanato: {
    active: "bg-emerald-600 text-white shadow-sm",
    inactive: "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-emerald-50",
  },
  Drywall: {
    active: "bg-violet-600 text-white shadow-sm",
    inactive: "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-violet-50",
  },
  "Plaqueamento Interno": {
    active: "bg-slate-700 text-white shadow-sm",
    inactive: "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50",
  },
  Forro: {
    active: "bg-amber-600 text-white shadow-sm",
    inactive: "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-amber-50",
  },
};

const TAB_LABEL_CURTO: Record<GrupoServico, string> = {
  "Plaqueamento Externo": "Externo",
  Porcelanato: "Porcelanato",
  Drywall: "Painéis",
  "Plaqueamento Interno": "Interno",
  Forro: "Forro",
};

export default function ResumoPage() {
  const [grupoAtivo, setGrupoAtivo] = useState<GrupoServico>("Plaqueamento Externo");

  return (
    <AppShell>
      <PageHeader
        title="Resumo de Produtividade"
        description="Visão geral por frente de serviço — RUP, progresso e previsões"
        compact
      />

      <HorizontalScrollTabs sticky ariaLabel="Frentes no resumo" className="mb-6">
        {GRUPOS_SERVICO.map((g) => {
          const styles = TAB_STYLE[g.id];
          const ativo = grupoAtivo === g.id;
          return (
            <HorizontalTab
              key={g.id}
              active={ativo}
              onClick={() => setGrupoAtivo(g.id)}
              className={ativo ? styles.active : styles.inactive}
            >
              <span className="sm:hidden">{TAB_LABEL_CURTO[g.id]}</span>
              <span className="hidden sm:inline">{g.label}</span>
            </HorizontalTab>
          );
        })}
      </HorizontalScrollTabs>

      {grupoAtivo === "Plaqueamento Externo" && <ResumoPlaqueamentoExterno />}
      {grupoAtivo === "Porcelanato" && <ResumoPorcelanato />}
      {grupoAtivo === "Drywall" && <ResumoDrywall />}
      {grupoAtivo === "Plaqueamento Interno" && <ResumoPlaqueamentoInterno />}
      {grupoAtivo === "Forro" && <ResumoForro />}

      <Card className="mt-8">
        <h3 className="mb-2 text-sm font-semibold text-slate-900">Como usar</h3>
        <ul className="space-y-2 text-xs text-slate-600">
          <li>
            Use as <strong>abas acima</strong> para alternar entre frentes de
            serviço.
          </li>
          <li>
            No plaqueamento externo, escolha também o serviço (Glasroc, juntas ou
            basecoat).
          </li>
          <li>
            <strong>Cronograma:</strong> área restante ÷ RUP = dias estimados.
          </li>
          <li>
            Dados calculados em tempo real a partir dos apontamentos de cada frente.
          </li>
        </ul>
      </Card>
    </AppShell>
  );
}
