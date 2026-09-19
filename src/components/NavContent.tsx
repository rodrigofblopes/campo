"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import {
  BarChart3,
  Calendar,
  Camera,
  ClipboardList,
  Clock,
  FileText,
  Home,
  Layers,
  LineChart,
  Lock,
} from "lucide-react";
import { useObra } from "@/context/ObraContext";
import { getObraMeta, obraTemAba, type ObraMeta } from "@/lib/obras";
import { GRUPOS_SERVICO } from "@/lib/servicos";
import { hrefGrupo, hrefObra } from "@/lib/grupos-nav";
import {
  produtividadeLiberadaSnapshot,
  produtividadeLiberadaSnapshotServidor,
  subscribeProdutividade,
} from "@/lib/produtividade-lock";

/** Itens principais do menu unificado da obra — nesta ordem. "Produtividade"
 * fica protegida por senha (pedida na hora, ao clicar); os demais são de
 * acesso livre, usados no dia a dia de campo. Itens com `aba` somem do
 * menu quando a obra não tem essa aba (ver `abasDesativadas` em ObraMeta). */
export function linksPrincipais(obraId: string, obraMeta: ObraMeta) {
  const todos = [
    {
      href: hrefObra(obraId),
      label: "Produtividade",
      icon: BarChart3,
      protegido: true,
      aba: "produtividade" as const,
    },
    {
      href: hrefObra(obraId, "/vistoria"),
      label: "Nova Vistoria",
      icon: Camera,
      protegido: false,
      aba: null,
    },
    {
      href: hrefObra(obraId, "/historico"),
      label: "Histórico",
      icon: Clock,
      protegido: false,
      aba: null,
    },
    {
      href: hrefObra(obraId, "/pcp"),
      label: "PCP Semanal",
      icon: Calendar,
      protegido: false,
      aba: null,
    },
    {
      href: hrefObra(obraId, "/rdo"),
      label: "RDO Simplificado",
      icon: ClipboardList,
      protegido: false,
      aba: "rdo" as const,
    },
  ];
  return todos.filter((item) => item.aba === null || obraTemAba(obraMeta, item.aba));
}

/** Sub-itens que só aparecem indentados sob "Produtividade" quando o
 * usuário está navegando dentro dela (e já desbloqueou com a senha). */
function linksProdutividade(obraId: string) {
  return [
    { href: hrefObra(obraId), label: "Dashboard", icon: Home },
    { href: hrefObra(obraId, "/resumo"), label: "Resumo", icon: LineChart },
    { href: hrefObra(obraId, "/relatorios"), label: "Relatório PDF", icon: FileText },
    { href: hrefObra(obraId, "/estimativas"), label: "Estimativas", icon: Clock },
  ] as const;
}

function linkConferencia(obraId: string) {
  return {
    href: hrefObra(obraId, "/producao"),
    label: "Conferência",
    icon: ClipboardList,
  } as const;
}

function emProdutividade(pathname: string, obraId: string): boolean {
  const base = hrefObra(obraId);
  if (pathname === base) return true;
  for (const item of linksProdutividade(obraId)) {
    if (pathname === item.href) return true;
  }
  if (pathname.startsWith(hrefObra(obraId, "/frentes"))) return true;
  if (pathname === hrefObra(obraId, "/producao")) return true;
  if (pathname === hrefObra(obraId, "/progresso")) return true;
  return false;
}

export function tituloPagina(pathname: string, obraId: string): string {
  const base = hrefObra(obraId);
  const obraMeta = getObraMeta(obraId);
  const temProdutividade = !obraMeta || obraTemAba(obraMeta, "produtividade");
  const temRdo = !obraMeta || obraTemAba(obraMeta, "rdo");

  if (pathname === base) return temProdutividade ? "Dashboard" : "Indisponível";
  if (pathname === hrefObra(obraId, "/resumo")) return "Resumo";
  if (pathname === hrefObra(obraId, "/relatorios")) return "Relatório PDF";
  if (pathname === hrefObra(obraId, "/producao")) return "Conferência";
  if (pathname === hrefObra(obraId, "/estimativas")) return "Estimativas";
  if (pathname === hrefObra(obraId, "/frentes")) return "Frentes de serviço";
  if (pathname === hrefObra(obraId, "/vistoria")) return "Nova Vistoria";
  if (pathname === hrefObra(obraId, "/historico")) return "Histórico";
  if (pathname === hrefObra(obraId, "/pcp")) return "PCP Semanal";
  if (pathname === hrefObra(obraId, "/rdo")) return temRdo ? "RDO Simplificado" : "Indisponível";

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
  const produtividadeLiberada = useSyncExternalStore(
    subscribeProdutividade,
    produtividadeLiberadaSnapshot(obraId),
    produtividadeLiberadaSnapshotServidor
  );

  const linkClass = mobile
    ? "flex min-h-[48px] items-center gap-3 rounded-xl px-3 py-3 text-base font-medium transition-colors"
    : "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors";
  const subLinkClass = mobile
    ? "flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
    : "flex items-center gap-2.5 rounded-lg py-2 pl-9 pr-3 text-[13px] font-medium transition-colors";

  const conferencia = linkConferencia(obraId);
  const dentroProdutividade = emProdutividade(pathname, obraId);

  return (
    <>
      {showBranding && (
        <div className="border-b border-slate-700 px-3 py-4">
          <h1 className="text-base font-bold leading-tight">Campo</h1>
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

          {linksPrincipais(obraId, obraMeta).map(({ href, label, icon: Icon, protegido }) => {
            const active =
              label === "Produtividade" ? dentroProdutividade : pathname === href;
            const mostrarCadeado = protegido && !produtividadeLiberada;
            return (
              <div key={href}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  className={`${linkClass} ${
                    active
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon size={18} />
                  <span className="flex-1 truncate">{label}</span>
                  {mostrarCadeado && (
                    <Lock size={14} className="shrink-0 text-slate-400" />
                  )}
                </Link>

                {label === "Produtividade" &&
                  dentroProdutividade &&
                  produtividadeLiberada && (
                    <div className="mt-1 space-y-0.5">
                      {linksProdutividade(obraId).map((sub) => {
                        const subActive = pathname === sub.href;
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            onClick={onNavigate}
                            className={`${subLinkClass} ${
                              subActive
                                ? "bg-slate-800 text-white"
                                : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                            }`}
                          >
                            <sub.icon size={15} />
                            <span className="truncate">{sub.label}</span>
                          </Link>
                        );
                      })}

                      <div className="flex items-center justify-between py-1 pl-9 pr-3">
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
                      {GRUPOS_SERVICO.map((grupo) => {
                        const grupoHref = hrefGrupo(obraId, grupo.id);
                        const grupoActive =
                          pathname === grupoHref ||
                          pathname.startsWith(`${grupoHref}/`);
                        return (
                          <Link
                            key={grupo.id}
                            href={grupoHref}
                            onClick={onNavigate}
                            className={`${subLinkClass} ${
                              grupoActive
                                ? "bg-slate-800 text-white"
                                : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                            }`}
                          >
                            <Layers size={15} />
                            <span className="truncate">{grupo.label}</span>
                          </Link>
                        );
                      })}

                      <Link
                        href={conferencia.href}
                        onClick={onNavigate}
                        className={`${subLinkClass} ${
                          pathname === conferencia.href
                            ? "bg-slate-800 text-white"
                            : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                        }`}
                      >
                        <conferencia.icon size={15} />
                        <span className="truncate">{conferencia.label}</span>
                      </Link>
                    </div>
                  )}
              </div>
            );
          })}
        </div>
      </nav>

      {showFooter && (
        <div className="hidden border-t border-slate-700 p-4 text-xs text-slate-500 lg:block">
          Vistoria, RDO e PCP de acesso livre · Produtividade protegida por senha
        </div>
      )}
    </>
  );
}
