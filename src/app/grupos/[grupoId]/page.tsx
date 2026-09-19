import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Layers } from "lucide-react";
import { ObraCard } from "@/components/ObraCard";
import { getGrupo, obrasDoGrupo } from "@/lib/obras";

export default async function GrupoPage({
  params,
}: {
  params: Promise<{ grupoId: string }>;
}) {
  const { grupoId } = await params;
  const grupo = getGrupo(grupoId);
  if (!grupo) {
    notFound();
  }
  const obras = obrasDoGrupo(grupoId);

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-10 sm:py-16">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft size={16} /> Todas as obras
      </Link>

      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
          <Layers size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">{grupo.nome}</h1>
          {grupo.descricao && (
            <p className="mt-0.5 text-sm text-slate-500">{grupo.descricao}</p>
          )}
        </div>
      </div>

      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
        Obras
      </p>
      <div className="space-y-4">
        {obras.map((o) => (
          <ObraCard key={o.id} obra={o} />
        ))}
      </div>
    </div>
  );
}
 
