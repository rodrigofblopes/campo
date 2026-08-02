"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MobileBottomNav, MobileDrawer, MobileHeader } from "@/components/MobileNav";
import { NavContent } from "@/components/NavContent";
import type { Servico } from "@/lib/types";
import { GRUPOS_SERVICO, servicosPorGrupo } from "@/lib/servicos";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-slate-900 text-white lg:flex">
      <NavContent pathname={pathname} />
    </aside>
  );
}

export function PageHeader({
  title,
  description,
  children,
  compact = false,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3 sm:mb-6 sm:gap-4">
      <div className="min-w-0 flex-1">
        <h2
          className={`font-bold text-slate-900 ${compact ? "text-lg sm:text-2xl" : "text-xl sm:text-2xl"}`}
        >
          {title}
        </h2>
        {description && (
          <p
            className={`mt-1 text-sm text-slate-500 ${compact ? "hidden sm:block" : ""}`}
          >
            {description}
          </p>
        )}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  trend?: "up" | "down" | "neutral";
}) {
  const trendColor =
    trend === "up"
      ? "text-emerald-600"
      : trend === "down"
        ? "text-red-600"
        : "text-slate-500";

  return (
    <Card>
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${trendColor}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-400">{sub}</div>}
    </Card>
  );
}

export function ProgressBar({
  percentual,
  className = "",
  size = "default",
}: {
  percentual: number;
  className?: string;
  size?: "default" | "large";
}) {
  const pct = Math.min(100, Math.max(0, percentual));
  const cor =
    pct >= 100 ? "bg-emerald-500" : pct >= 50 ? "bg-blue-500" : "bg-amber-500";
  const height = size === "large" ? "h-3.5" : "h-2";

  return (
    <div
      className={`w-full overflow-hidden rounded-full bg-slate-200 ${height} ${className}`}
    >
      <div
        className={`h-full rounded-full transition-all ${cor}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function corPercentual(pct: number) {
  if (pct >= 100) return { text: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-200" };
  if (pct >= 50) return { text: "text-blue-600", bg: "bg-blue-50", ring: "ring-blue-200" };
  if (pct > 0) return { text: "text-amber-600", bg: "bg-amber-50", ring: "ring-amber-200" };
  return { text: "text-slate-400", bg: "bg-slate-50", ring: "ring-slate-200" };
}

export function PercentualDestaque({
  percentual,
  size = "lg",
  showLabel = true,
  variant = "light",
}: {
  percentual: number;
  size?: "md" | "lg" | "xl";
  showLabel?: boolean;
  variant?: "light" | "dark";
}) {
  const pct = Math.min(100, Math.max(0, percentual));
  const cores = corPercentual(pct);
  const tamanhos = {
    md: "text-3xl",
    lg: "text-5xl",
    xl: "text-6xl",
  };

  const boxClass =
    variant === "dark"
      ? "bg-white/10 ring-white/25 text-white"
      : `${cores.bg} ${cores.ring}`;
  const textClass = variant === "dark" ? "text-white" : cores.text;

  return (
    <div className="flex flex-col items-center">
      <div
        className={`inline-flex items-baseline gap-0.5 rounded-2xl px-5 py-3 ring-2 ${boxClass}`}
      >
        <span className={`font-black tabular-nums leading-none ${textClass} ${tamanhos[size]}`}>
          {pct.toFixed(0)}
        </span>
        <span className={`text-2xl font-bold opacity-80 ${textClass}`}>%</span>
      </div>
      {showLabel && (
        <span className="mt-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
          Executado
        </span>
      )}
    </div>
  );
}

export function AreaDestaque({
  produzida,
  escopo,
  size = "md",
  variant = "light",
  showLabel = true,
}: {
  produzida: number;
  escopo: number;
  size?: "md" | "lg";
  variant?: "light" | "dark";
  showLabel?: boolean;
}) {
  const tamanhos = { md: "text-2xl", lg: "text-3xl" };
  const boxClass =
    variant === "dark"
      ? "bg-white/10 ring-white/25"
      : "bg-slate-100 ring-slate-200";
  const produzidaClass = variant === "dark" ? "text-white" : "text-slate-900";
  const escopoClass = variant === "dark" ? "text-slate-300" : "text-slate-500";

  return (
    <div className="flex flex-col items-center">
      <div
        className={`inline-flex items-baseline gap-1 rounded-xl px-4 py-2 ring-2 ${boxClass}`}
      >
        <span className={`font-black tabular-nums ${produzidaClass} ${tamanhos[size]}`}>
          {produzida.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
        </span>
        <span className={`text-lg ${escopoClass}`}>/</span>
        <span className={`text-lg font-bold tabular-nums ${escopoClass}`}>
          {escopo.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
        </span>
        <span className={`text-sm font-bold ${escopoClass}`}>m²</span>
      </div>
      {showLabel && (
        <span className="mt-1.5 text-xs font-semibold uppercase tracking-widest text-slate-500">
          Produzido / Escopo
        </span>
      )}
    </div>
  );
}

export function ProgressoServicoCard({
  servico,
  percentual,
  areaProduzida,
  areaEscopo,
  usaEscopo = true,
  status = "ativo",
}: {
  servico: string;
  percentual: number;
  areaProduzida: number;
  areaEscopo: number;
  usaEscopo?: boolean;
  status?: "ativo" | "futuro";
}) {
  const pct = Math.min(100, Math.max(0, percentual));
  const areaRestante = usaEscopo ? Math.max(0, areaEscopo - areaProduzida) : 0;
  const futuro = status === "futuro";

  return (
    <Card
      className={`flex flex-col items-center py-6 text-center ${futuro ? "opacity-60" : ""}`}
    >
      <div className="flex items-center gap-2">
        <div className="text-sm font-medium text-slate-500">{servico}</div>
        {futuro && (
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
            Futuro
          </span>
        )}
      </div>

      {usaEscopo ? (
        <>
          <div className="mt-4">
            <PercentualDestaque percentual={pct} size="lg" />
          </div>
          <div className="mt-4">
            <AreaDestaque produzida={areaProduzida} escopo={areaEscopo} size="md" />
          </div>
          <div className="mt-5 w-full px-2">
            <ProgressBar percentual={pct} size="large" />
          </div>
          {areaRestante > 0 && (
            <p className="mt-3 text-sm font-semibold text-amber-600">
              Faltam {areaRestante.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} m²
            </p>
          )}
          {pct >= 100 && (
            <p className="mt-3 text-sm font-semibold text-emerald-600">Escopo concluído</p>
          )}
        </>
      ) : (
        <>
          <div className="mt-4">
            <div className="inline-flex items-baseline gap-1 rounded-2xl bg-slate-100 px-5 py-3 ring-2 ring-slate-200">
              <span className="text-5xl font-black tabular-nums text-slate-900">
                {areaProduzida.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
              </span>
              <span className="text-xl font-bold text-slate-500">m²</span>
            </div>
          </div>
          <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
            {futuro ? "Previsão futura" : "Produzido até agora"}
          </p>
          {!futuro && areaProduzida === 0 && (
            <p className="mt-3 text-xs text-slate-400">Nenhum apontamento ainda</p>
          )}
          {!futuro && (
            <p className="mt-2 text-xs text-slate-400">
              Escopo definido na planilha Quantitativos
            </p>
          )}
        </>
      )}
    </Card>
  );
}

export function PercentualCelula({ percentual }: { percentual: number }) {
  const pct = Math.min(100, Math.max(0, percentual));
  const cores = corPercentual(pct);

  return (
    <span
      className={`inline-flex min-w-[3.5rem] items-center justify-center rounded-lg px-2.5 py-1 text-base font-black tabular-nums ${cores.bg} ${cores.text} ring-1 ${cores.ring}`}
    >
      {pct.toFixed(0)}%
    </span>
  );
}

export function AreaCelula({
  produzida,
  escopo,
}: {
  produzida: number;
  escopo: number;
}) {
  return (
    <span className="inline-flex flex-col items-center rounded-lg bg-slate-100 px-2.5 py-1.5 ring-1 ring-slate-200">
      <span className="text-sm font-black tabular-nums text-slate-900">
        {produzida.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
        <span className="text-xs font-bold text-slate-500"> m²</span>
      </span>
      <span className="text-[10px] font-medium text-slate-400">
        de {escopo.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} m²
      </span>
    </span>
  );
}

export function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
}) {
  const colors = {
    default: "bg-slate-100 text-slate-700",
    success: "bg-emerald-100 text-emerald-800",
    warning: "bg-amber-100 text-amber-800",
    danger: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[variant]}`}
    >
      {children}
    </span>
  );
}

export function ServicoSelect({
  value,
  onChange,
  includeFuturos = false,
  className = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm",
}: {
  value: Servico;
  onChange: (servico: Servico) => void;
  includeFuturos?: boolean;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Servico)}
      className={className}
    >
      {GRUPOS_SERVICO.map((grupo) => {
        const servicos = servicosPorGrupo(grupo.id).filter(
          (s) => includeFuturos || s.status === "ativo"
        );
        if (servicos.length === 0) return null;
        return (
          <optgroup key={grupo.id} label={grupo.label}>
            {servicos.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </optgroup>
        );
      })}
    </select>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader
          menuOpen={menuOpen}
          onToggleMenu={() => setMenuOpen((o) => !o)}
        />
        <main className="flex-1 overflow-x-hidden p-3 pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:p-4 lg:p-8 lg:pb-8">
          {children}
        </main>
        <MobileBottomNav onOpenMenu={() => setMenuOpen(true)} />
      </div>
      <MobileDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
