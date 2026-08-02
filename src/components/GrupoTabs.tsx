"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GRUPOS_SERVICO } from "@/lib/servicos";
import { hrefGrupo, hrefObra } from "@/lib/grupos-nav";
import { useObra } from "@/context/ObraContext";
import {
  HorizontalScrollTabs,
} from "@/components/HorizontalScrollTabs";
import {
  Building2,
  LayoutGrid,
  PanelTop,
  Sparkles,
  SquareStack,
} from "lucide-react";

const GRUPO_ICONS = {
  "Plaqueamento Externo": Building2,
  Porcelanato: LayoutGrid,
  Drywall: SquareStack,
  "Plaqueamento Interno": Sparkles,
  Forro: PanelTop,
} as const;

export function GrupoTabs() {
  const pathname = usePathname();
  const { obraId } = useObra();

  if (pathname === hrefObra(obraId, "/frentes")) return null;

  return (
    <HorizontalScrollTabs sticky ariaLabel="Frentes de serviço" className="mb-4 lg:mb-6">
      <div className="inline-flex min-w-max gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1">
        {GRUPOS_SERVICO.map((grupo) => {
          const href = hrefGrupo(obraId, grupo.id);
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const Icon = GRUPO_ICONS[grupo.id];
          const labelCurto =
            grupo.id === "Plaqueamento Externo"
              ? "Externo"
              : grupo.id === "Plaqueamento Interno"
                ? "Interno"
                : grupo.id === "Porcelanato"
                  ? "Porcelanato"
                  : grupo.id === "Forro"
                    ? "Forro"
                    : "Painéis";
          return (
            <Link
              key={grupo.id}
              href={href}
              role="tab"
              aria-selected={active}
              className={`inline-flex snap-start items-center gap-2 whitespace-nowrap rounded-lg px-3 py-3 text-sm font-medium transition-colors active:scale-[0.98] sm:px-4 ${
                active
                  ? "bg-white text-blue-700 shadow-sm ring-1 ring-slate-200"
                  : "text-slate-600 hover:bg-white/60 hover:text-slate-900"
              }`}
            >
              <Icon size={16} className="shrink-0 opacity-70" />
              <span className="sm:hidden">{labelCurto}</span>
              <span className="hidden sm:inline">{grupo.label}</span>
            </Link>
          );
        })}
      </div>
    </HorizontalScrollTabs>
  );
}
