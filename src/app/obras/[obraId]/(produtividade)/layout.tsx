"use client";

import { useState, useSyncExternalStore } from "react";
import { Lock } from "lucide-react";
import { AppShell } from "@/components/ui";
import { useObra } from "@/context/ObraContext";
import {
  desbloquearProdutividade,
  produtividadeLiberadaSnapshot,
  produtividadeLiberadaSnapshotServidor,
  subscribeProdutividade,
} from "@/lib/produtividade-lock";

/** Mesma senha compartilhada de antes — proteção de tela, não autenticação
 * real (a senha continua no bundle do app). Desbloqueio fica salvo em
 * sessionStorage por obra, então não pede de novo na mesma aba. */
const SENHA_PRODUTIVIDADE = "netolara2026";

export default function ProdutividadeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { obraId, obraMeta } = useObra();
  const liberado = useSyncExternalStore(
    subscribeProdutividade,
    produtividadeLiberadaSnapshot(obraId),
    produtividadeLiberadaSnapshotServidor
  );
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(false);

  function confirmar() {
    if (senha === SENHA_PRODUTIVIDADE) {
      desbloquearProdutividade(obraId);
    } else {
      setErro(true);
      setSenha("");
    }
  }

  if (!liberado) {
    return (
      <AppShell>
        <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Lock size={20} />
            </div>
            <h1 className="text-center text-lg font-bold text-slate-900">
              Produtividade
            </h1>
            <p className="mt-1 text-center text-sm text-slate-500">
              Área restrita — digite a senha para ver o dashboard de{" "}
              {obraMeta.nome}.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <input
                type="password"
                autoFocus
                value={senha}
                onChange={(e) => {
                  setSenha(e.target.value);
                  setErro(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmar();
                }}
                placeholder="Senha"
                className={`flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300 ${
                  erro ? "border-red-400" : "border-slate-300"
                }`}
              />
              <button
                type="button"
                onClick={confirmar}
                className="shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Entrar
              </button>
            </div>
            {erro && (
              <p className="mt-2 text-center text-xs font-medium text-red-500">
                Senha incorreta.
              </p>
            )}
          </div>
        </div>
      </AppShell>
    );
  }

  return <>{children}</>;
}
