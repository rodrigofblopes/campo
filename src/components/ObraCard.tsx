"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Building2, Lock, MapPin } from "lucide-react";
import { Card, Badge } from "@/components/ui";
import type { ObraMeta, StatusObra } from "@/lib/obras";

/** Senha compartilhada para acessar o dashboard de cada obra a partir da home. */
const SENHA_OBRAS = "netolara2026";

const STATUS_LABEL: Record<StatusObra, string> = {
  em_andamento: "Em andamento",
  planejamento: "Planejamento",
  concluida: "Concluída",
};

const STATUS_VARIANT: Record<StatusObra, "success" | "warning" | "default"> = {
  em_andamento: "success",
  planejamento: "warning",
  concluida: "default",
};

function chaveSessao(obraId: string) {
  return `campo-obra-unlock-${obraId}`;
}

/**
 * Card de obra na home. Protegido por senha (proteção de tela, não é
 * autenticação real — a senha e os dados continuam no bundle do app).
 * Desbloqueio fica em sessionStorage: não pede de novo na mesma aba até
 * fechar o navegador.
 */
export function ObraCard({ obra }: { obra: ObraMeta }) {
  const router = useRouter();
  const [formAberto, setFormAberto] = useState(false);
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(false);

  function jaDesbloqueada() {
    return (
      typeof window !== "undefined" &&
      sessionStorage.getItem(chaveSessao(obra.id)) === "ok"
    );
  }

  function abrir() {
    if (jaDesbloqueada()) {
      router.push(`/obras/${obra.id}`);
      return;
    }
    setFormAberto(true);
  }

  function confirmar() {
    if (senha === SENHA_OBRAS) {
      sessionStorage.setItem(chaveSessao(obra.id), "ok");
      router.push(`/obras/${obra.id}`);
    } else {
      setErro(true);
      setSenha("");
    }
  }

  return (
    <Card className="relative transition-all hover:border-slate-300 hover:shadow-md">
      <div className="absolute right-4 top-4">
        <Image
          src="/logo_netolara.jpg"
          alt="Netolara"
          width={64}
          height={24}
          className="h-5 w-auto object-contain opacity-70"
          unoptimized
        />
      </div>

      <button
        type="button"
        onClick={abrir}
        className="flex w-full items-center gap-4 text-left"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <Building2 size={22} />
        </div>
        <div className="min-w-0 flex-1 pr-12">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">{obra.nome}</h2>
            <Badge variant={STATUS_VARIANT[obra.status]}>
              {STATUS_LABEL[obra.status]}
            </Badge>
          </div>
          <p className="mt-0.5 text-sm text-slate-500">{obra.descricao}</p>
          {obra.localizacao && (
            <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
              <MapPin size={12} /> {obra.localizacao}
            </p>
          )}
        </div>
        {formAberto ? (
          <Lock className="shrink-0 text-slate-300" size={20} />
        ) : (
          <ArrowRight className="shrink-0 text-slate-300" size={20} />
        )}
      </button>

      {formAberto && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2">
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
              placeholder="Senha da obra"
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
            <p className="mt-2 text-xs font-medium text-red-500">
              Senha incorreta.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
