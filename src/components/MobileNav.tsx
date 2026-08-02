"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  ChevronLeft,
  ClipboardList,
  Home,
  Layers,
  Menu,
  MoreHorizontal,
  X,
} from "lucide-react";
import { NavContent, tituloPagina } from "@/components/NavContent";
import { useObra } from "@/context/ObraContext";
import { hrefObra } from "@/lib/grupos-nav";

function bottomLinks(obraId: string) {
  const base = hrefObra(obraId);
  const frentes = hrefObra(obraId, "/frentes");
  return [
    { href: base, label: "Início", icon: Home, match: (p: string) => p === base },
    {
      href: hrefObra(obraId, "/resumo"),
      label: "Resumo",
      icon: BarChart3,
      match: (p: string) => p === hrefObra(obraId, "/resumo"),
    },
    {
      href: frentes,
      label: "Frentes",
      icon: Layers,
      match: (p: string) => p.startsWith(frentes),
    },
    {
      href: hrefObra(obraId, "/producao"),
      label: "Conferência",
      icon: ClipboardList,
      match: (p: string) => p === hrefObra(obraId, "/producao"),
    },
  ] as const;
}

function backHref(pathname: string, obraId: string): string | null {
  const frentes = hrefObra(obraId, "/frentes");
  if (pathname.startsWith(`${frentes}/`) && pathname !== frentes) {
    return frentes;
  }
  return null;
}

export function MobileHeader({
  menuOpen,
  onToggleMenu,
}: {
  menuOpen: boolean;
  onToggleMenu: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { obraId } = useObra();
  const titulo = tituloPagina(pathname, obraId);
  const voltar = backHref(pathname, obraId);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-white/80 lg:hidden">
      <div className="flex items-center gap-2 px-3 py-2.5">
        {voltar ? (
          <button
            type="button"
            onClick={() => router.push(voltar)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 active:bg-slate-200"
            aria-label="Voltar para frentes"
          >
            <ChevronLeft size={24} />
          </button>
        ) : (
          <button
            type="button"
            onClick={onToggleMenu}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 active:bg-slate-200"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        )}
        <div className="min-w-0 flex-1 px-1">
          <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Campo
          </p>
          <h1 className="truncate text-base font-bold leading-tight text-slate-900">
            {titulo}
          </h1>
        </div>
        {voltar && (
          <button
            type="button"
            onClick={onToggleMenu}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 active:bg-slate-200"
            aria-expanded={menuOpen}
            aria-label="Abrir menu"
          >
            <Menu size={22} />
          </button>
        )}
      </div>
    </header>
  );
}

export function MobileDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 lg:hidden ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        aria-label="Fechar menu"
        onClick={onClose}
        tabIndex={open ? 0 : -1}
      />
      <aside
        className={`relative flex h-full w-[min(100%,20rem)] flex-col bg-slate-900 text-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <span className="text-sm font-semibold text-slate-300">Menu</span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Fechar menu"
          >
            <X size={22} />
          </button>
        </div>
        <NavContent pathname={pathname} onNavigate={onClose} showFooter={false} mobile />
      </aside>
    </div>
  );
}

export function MobileBottomNav({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname();
  const { obraId } = useObra();
  const maisAtivo = pathname === hrefObra(obraId, "/relatorios");
  const links = bottomLinks(obraId);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 lg:hidden"
      aria-label="Navegação principal"
    >
      <div className="mx-auto grid max-w-lg grid-cols-5 px-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-1">
        {links.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-semibold transition-colors active:scale-95 ${
                active
                  ? "text-blue-600"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span
                className={`flex h-8 w-10 items-center justify-center rounded-full transition-colors ${
                  active ? "bg-blue-100" : ""
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.25 : 2} />
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={onOpenMenu}
          className={`flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-semibold transition-colors active:scale-95 ${
            maisAtivo ? "text-blue-600" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <span
            className={`flex h-8 w-10 items-center justify-center rounded-full transition-colors ${
              maisAtivo ? "bg-blue-100" : ""
            }`}
          >
            <MoreHorizontal size={22} strokeWidth={maisAtivo ? 2.25 : 2} />
          </span>
          <span>Mais</span>
        </button>
      </div>
    </nav>
  );
}
