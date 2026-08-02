"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, Card, ProgressBar } from "@/components/ui";
import { useObra } from "@/context/ObraContext";
import { formatarNumero } from "@/lib/calculations";
import { hrefGrupo } from "@/lib/grupos-nav";
import {
  areaEstruturadaForro,
  areaExecutadaForro,
  areaTotalForro,
  formatarDataForro,
  percentualForro,
  statusForro,
} from "@/lib/forro";
import type { AmbienteForro } from "@/lib/types";

const STATUS_LABEL = {
  pendente: "Pendente",
  estruturado: "Estruturado",
  concluido: "Concluído",
} as const;

const STATUS_VARIANT = {
  pendente: "default",
  estruturado: "warning",
  concluido: "success",
} as const;

export function ResumoForro() {
  const { obra, obraId } = useObra();
  const forro = obra.forro ?? [];
  const [selecionado, setSelecionado] = useState<string | null>(null);

  const areaTotal = areaTotalForro(forro);
  const areaEstruturada = areaEstruturadaForro(forro);
  const areaExecutada = areaExecutadaForro(forro);
  const pct = percentualForro(forro);
  const concluidos = forro.filter((f) => f.dataPlaqueamento).length;
  const areaRestante = Math.max(0, areaTotal - areaExecutada);

  const detalhe: AmbienteForro | undefined = selecionado
    ? forro.find((f) => f.id === selecionado)
    : undefined;

  if (forro.length === 0) {
    return (
      <Card className="py-10 text-center text-sm text-slate-500">
        Nenhum ambiente na planilha. Os dados serão exibidos após a próxima
        publicação com a aba Forro preenchida.
      </Card>
    );
  }

  return (
    <div>
      <Card className="mb-6 flex flex-wrap items-center justify-center gap-6 bg-gradient-to-br from-amber-900 to-amber-950 py-6 text-white sm:gap-8">
        <div className="text-center">
          <div className="text-5xl font-black tabular-nums">{formatarNumero(pct, 0)}%</div>
          <div className="mt-1 text-xs uppercase tracking-wide text-amber-300">
            Plaqueado
          </div>
        </div>
        <div className="text-center">
          <div className="inline-flex items-baseline gap-1 rounded-xl bg-white/10 px-4 py-2 ring-2 ring-white/25">
            <span className="text-3xl font-black tabular-nums">
              {formatarNumero(areaExecutada, 0)}
            </span>
            <span className="text-lg text-amber-300">/</span>
            <span className="text-lg font-bold tabular-nums text-amber-300">
              {formatarNumero(areaTotal, 0)}
            </span>
            <span className="text-sm font-bold text-amber-300">m²</span>
          </div>
          <div className="mt-1.5 text-xs uppercase tracking-wide text-amber-300">
            Plaqueado / Escopo
          </div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-black text-amber-200">
            {formatarNumero(areaEstruturada, 0)}
          </div>
          <div className="text-xs uppercase tracking-wide text-amber-300">
            Estruturado (m²)
          </div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-black text-amber-300">
            {concluidos}/{forro.length}
          </div>
          <div className="text-xs uppercase tracking-wide text-amber-400">
            Ambientes plaqueados
          </div>
        </div>
      </Card>

      {areaRestante > 0 && (
        <Card className="mb-6 border-amber-200 bg-amber-50/80 py-3 text-center text-sm text-amber-900">
          Faltam <strong>{formatarNumero(areaRestante, 0)} m²</strong> de plaqueamento
          {areaEstruturada > areaExecutada && (
            <>
              {" "}
              · {formatarNumero(areaEstruturada - areaExecutada, 0)} m² já estruturados,
              aguardando plaqueamento
            </>
          )}
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {forro.map((f) => {
              const ativo = selecionado === f.id;
              const status = statusForro(f);
              const pctAmbiente =
                status === "concluido" ? 100 : status === "estruturado" ? 50 : 0;

              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelecionado(ativo ? null : f.id)}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    ativo
                      ? "border-amber-500 bg-amber-50 ring-2 ring-amber-200"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-slate-900">{f.ambiente}</span>
                    <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {formatarNumero(f.areaM2, 1)} m²
                  </div>
                  <div className="mt-3">
                    <ProgressBar percentual={pctAmbiente} size="large" />
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {pctAmbiente}% executado
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <Card
            className={
              detalhe ? "border-amber-200 bg-gradient-to-br from-amber-50 to-white" : ""
            }
          >
            {detalhe ? (
              <>
                <h3 className="text-lg font-bold text-slate-900">{detalhe.ambiente}</h3>
                <div className="mt-2">
                  <Badge variant={STATUS_VARIANT[statusForro(detalhe)]}>
                    {STATUS_LABEL[statusForro(detalhe)]}
                  </Badge>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
                    <div className="text-xs text-slate-500">Área</div>
                    <div className="text-2xl font-black text-slate-900">
                      {formatarNumero(detalhe.areaM2, 1)}
                    </div>
                    <div className="text-xs text-slate-400">m²</div>
                  </div>
                  <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
                    <div className="text-xs text-slate-500">Estruturação</div>
                    <div className="text-sm font-black text-amber-600">
                      {formatarDataForro(detalhe.dataEstruturacao)}
                    </div>
                  </div>
                  <div className="col-span-2 rounded-lg bg-white p-3 ring-1 ring-slate-200">
                    <div className="text-xs text-slate-500">Plaqueamento</div>
                    <div className="text-sm font-black text-amber-700">
                      {formatarDataForro(detalhe.dataPlaqueamento)}
                    </div>
                  </div>
                </div>

                <Link
                  href={hrefGrupo(obraId, "Forro")}
                  className="mt-4 inline-block text-sm font-medium text-amber-700 hover:underline"
                >
                  Ver frente de forro →
                </Link>
              </>
            ) : (
              <div className="py-6 text-center text-slate-500">
                <p className="text-sm">
                  Selecione um ambiente para ver as datas de estruturação e
                  plaqueamento.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
