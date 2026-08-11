"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  LayoutGrid,
  PanelTop,
  Sparkles,
  SquareStack,
} from "lucide-react";
import { Card } from "@/components/ui";
import { useObra } from "@/context/ObraContext";
import { GRUPOS_SERVICO } from "@/lib/servicos";
import { hrefGrupo } from "@/lib/grupos-nav";

const GRUPO_ICONS = {
  "Plaqueamento Externo": Building2,
  Porcelanato: LayoutGrid,
  Drywall: SquareStack,
  "Plaqueamento Interno": Sparkles,
  Forro: PanelTop,
} as const;

const GRUPO_COLORS = {
  "Plaqueamento Externo": "border-blue-200 bg-blue-50 text-blue-700",
  Porcelanato: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Drywall: "border-violet-200 bg-violet-50 text-violet-700",
  "Plaqueamento Interno": "border-slate-200 bg-slate-50 text-slate-700",
  Forro: "border-amber-200 bg-amber-50 text-amber-700",
} as const;

export default function FrentesHubPage() {
  const pathname = usePathname();
  const { obraId } = useObra();

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {GRUPOS_SERVICO.map((grupo) => {
        const href = hrefGrupo(obraId, grupo.id);
        const Icon = GRUPO_ICONS[grupo.id];
        const active = pathname === href || pathname.startsWith(`${href}/`);
        const colors = GRUPO_COLORS[grupo.id];

        return (
          <Link
            key={grupo.id}
            href={href}
            className={`group flex min-h-[88px] items-start gap-4 rounded-2xl border-2 p-4 transition-all active:scale-[0.99] ${
              active
                ? `${colors} ring-2 ring-offset-2 ring-blue-300`
                : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
            }`}
          >
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                active ? "bg-white/80" : colors
              }`}
            >
              <Icon size={24} strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-slate-900">{grupo.label}</div>
              <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">
                {grupo.descricao}
              </p>
            </div>
          </Link>
        );
      })}

      <Card className="sm:col-span-2 border-dashed border-slate-300 bg-slate-50/80 py-4">
        <div className="flex items-start gap-3 text-sm text-slate-600">
          <LayoutGrid className="mt-0.5 shrink-0 text-slate-400" size={18} />
          <p>
            Toque em uma frente para ver progresso, escopo e apontamentos. Use a
            barra inferior para alternar entre Início, Resumo e Conferência.
          </p>
        </div>
      </Card>
    </div>
  );
}
