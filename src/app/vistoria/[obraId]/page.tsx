import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Camera } from "lucide-react";
import { getObraMeta } from "@/lib/obras";
import { VistoriaContent } from "@/components/VistoriaContent";

export default async function VistoriaObraPage({
  params,
}: {
  params: Promise<{ obraId: string }>;
}) {
  const { obraId } = await params;
  const obraMeta = getObraMeta(obraId);

  if (!obraMeta) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Link
            href="/vistoria"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Voltar"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Camera size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-600">
              Campo · Vistoria
            </p>
            <h1 className="truncate text-sm font-bold text-slate-900">{obraMeta.nome}</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
        <VistoriaContent obraId={obraMeta.id} obraMeta={obraMeta} />
      </main>
    </div>
  );
}
