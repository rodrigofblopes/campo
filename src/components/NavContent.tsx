"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  Camera,
  ClipboardList,
  Clock,
  FileText,
  Home,
  Layers,
} from "lucide-react";
import { useObra } from "@/context/ObraContext";
import { GRUPOS_SERVICO } from "@/lib/servicos";
import { hrefGrupo, hrefObra } from "@/lib/grupos-nav";

export function linksPrincipais(obraId: string) {
  return [
    { href: hrefObra(obraId), label: "Dashboard", icon: Home },
    { href: hrefObra(obraId, "/vistoria"), label: "Vistoria", icon: Camera },
    { href: hrefObra(obraId, "/resumo"), label: "Resumo", icon: BarChart3 },
    { href: hrefObra(obraId, "/relatorios"), label: "Relatório PDF", icon: FileText },
    { href: hrefObra(obraId, "/estimativas"), label: "Estimativas", icon: Clock },
  ] as const;
}

export function linkConferencia(obraId: string) {
  return {
    href: hrefObra(obraId, "/producao"),
    label: "Conferência",
    icon: ClipboardList,
  } as const;
}

export function tituloPagina(pathname: string, obraId: string): string {
  const base = hrefObra(obraId);
  if (pathname === base) return "Dashboard";
  if (pathname === hrefObra(obraId, "/vistoria")) return "Vistoria";
  if (pathname === hrefObra(obraId, "/resumo")) return "Resumo";
  if (pathname === hrefObra(obraId, "/relatorios")) return "Relatório PDF";
  if (pathname === hrefObra(obraId, "/producao")) return "Conferência";
  if (pathname === hrefObra(obraId, "/estimativas")) return "Estimativas";
  if (pathname === hrefObra(obraId, "/frentes")) return "Frentes de serviço";

  for (const grupo of GRUPOS_SERVICO) {
    const href = hrefGrupo(obraId, grupo.id);
    if (pathname === href || pathname.startsWith(`${href}/`)) {
      return grupo.label;
    }
  }

  if (pathname.startsWith(hrefObra(obraId, "/frentes"))) return "Frentes";
  return "Campo";
}

export function NavContent({
  pathname,
  onNavigate,
  showBranding = true,
  showFooter = true,
  mobile = false,
}: {
  pathname: string;
  onNavigate?: () => void;
  showBranding?: boolean;
  showFooter?: boolean;
  mobile?: boolean;
}) {
  const { obraId, obraMeta } = useObra();
  const linkClass = mobile
    ? "flex min-h-[48px] items-center gap-3 rounded-xl px-3 py-3 text-base font-medium transition-colors"
    : "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors";
  const conferencia = linkConferencia(obraId);

  return (
    <>
      {showBranding && (
        <div className="border-b border-slate-700 px-3 py-4">
          <div className="overflow-hidden rounded-lg bg-white px-2 py-2">
            <Image
              src="/logo_netolara.jpg"
              alt="Neto Lara Steel Frame"
              width={320}
              height={120}
              className="mx-auto h-auto w-full min-h-[72px] max-h-28 object-contain object-center scale-110 lg:min-h-[88px] lg:max-h-36"
              priority
              unoptimized
            />
          </div>
          <h1 className="mt-3 text-base font-bold leading-tight">Campo</h1>
          <p className="mt-0.5 text-xs text-slate-400">
            Obra {obraMeta.nome} · Steel Frame
          </p>
        </div>
      )}

      <nav className="flex flex-1 flex-col overflow-y-auto p-3">
        <div className="space-y-1">
          <Link
            href="/"
            onClick={onNavigate}
            className={`${linkClass} text-slate-500 hover:bg-slate-800 hover:text-white`}
          >
            <Layers size={18} />
            Trocar de obra
          </Link>
          {linksPrincipais(obraId).map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                className={`${linkClass} ${
                  active
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </div>

        <div className="pb-1 pt-4">
          <div className="flex items-center justify-between px-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              Frentes
            </p>
            <Link
              href={hrefObra(obraId, "/frentes")}
              onClick={onNavigate}
              className="text-[10px] font-medium text-blue-400 hover:text-blue-300"
            >
              Ver todas
            </Link>
          </div>
        </div>
        <div className="space-y-1">
          {GRUPOS_SERVICO.map((grupo) => {
            const href = hrefGrupo(obraId, grupo.id);
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={grupo.id}
                href={href}
                onClick={onNavigate}
                className={`${linkClass} ${
                  active
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Layers size={18} />
                <span className="truncate">{grupo.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="mt-auto border-t border-slate-800 pt-3">
          <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
            Consulta
          </p>
          <Link
            href={conferencia.href}
            onClick={onNavigate}
            className={`${mobile ? linkClass : "flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors"} ${
              pathname === conferencia.href
                ? "bg-slate-800 text-slate-200"
                : "text-slate-500 hover:bg-slate-800/60 hover:text-slate-400"
            }`}
          >
            <conferencia.icon size={mobile ? 18 : 14} />
            {conferencia.label}
          </Link>
        </div>
      </nav>

      {showFooter && (
        <div className="hidden border-t border-slate-700 p-4 text-xs text-slate-500 lg:block">
          Produção conectada ao resumo e progresso automaticamente
        </div>
      )}
    </>
  );
}
