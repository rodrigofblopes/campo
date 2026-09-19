import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";
import { Card } from "@/components/ui";
import type { GrupoObra, ObraMeta } from "@/lib/obras";

/**
 * Card de condomínio/grupo na home — leva pra /grupos/[id], onde ficam os
 * cards de cada obra individual dentro dele (ver ObraCard).
 */
export function GrupoCard({
  grupo,
  obras,
}: {
  grupo: GrupoObra;
  obras: ObraMeta[];
}) {
  return (
    <Link href={`/grupos/${grupo.id}`} className="block">
      <Card className="relative transition-all hover:border-slate-300 hover:shadow-md">
        <div className="flex w-full items-center gap-4 text-left">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <Layers size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-slate-900">{grupo.nome}</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {grupo.descricao ?? `${obras.length} obras`}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {obras.length} {obras.length === 1 ? "obra" : "obras"}
            </p>
          </div>
          <ArrowRight className="shrink-0 text-slate-300" size={20} />
        </div>
      </Card>
    </Link>
  );
}
 
