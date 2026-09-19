import Link from "next/link";
import { Ban } from "lucide-react";
import { hrefObra } from "@/lib/grupos-nav";

/**
 * Tela mostrada quando alguém acessa por URL direta uma aba desativada
 * para a obra (ver `abasDesativadas` em ObraMeta). Mesmo estilo do cartão
 * de senha da Produtividade, sem pedir nada — só avisa e manda de volta.
 */
export function AbaIndisponivel({
  obraId,
  titulo,
  mensagem,
}: {
  obraId: string;
  titulo: string;
  mensagem: string;
}) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
          <Ban size={20} />
        </div>
        <h1 className="text-lg font-bold text-slate-900">{titulo}</h1>
        <p className="mt-1 text-sm text-slate-500">{mensagem}</p>
        <Link
          href={hrefObra(obraId, "/vistoria")}
          className="mt-5 inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Ir para Vistoria
        </Link>
      </div>
    </div>
  );
}
 
