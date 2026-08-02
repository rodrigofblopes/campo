"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge, Card, ProgressBar } from "@/components/ui";
import { useObra } from "@/context/ObraContext";
import { formatarNumero } from "@/lib/calculations";
import { hrefGrupo } from "@/lib/grupos-nav";
import {
  areaExecutadaParedes,
  areaTotalParedes,
  formatarDataExecucao,
  labelParede,
  resumoPorDiaDrywall,
  rupMedioDrywall,
} from "@/lib/paredes-drywall";
import type { ParedeDrywall } from "@/lib/types";

const STATUS_LABEL = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluida: "Concluída",
} as const;

const STATUS_VARIANT = {
  pendente: "default",
  em_andamento: "warning",
  concluida: "success",
} as const;

export function ResumoDrywall() {
  const { obra, obraId } = useObra();
  const paredes = obra.paredesDrywall ?? [];
  const [selecionada, setSelecionada] = useState<string | null>(null);

  const areaTotal = areaTotalParedes(paredes);
  const areaExecutada = areaExecutadaParedes(paredes);
  const pct =
    areaTotal > 0
      ? Math.min(100, Math.round((areaExecutada / areaTotal) * 1000) / 10)
      : 0;
  const concluidas = paredes.filter(
    (p) => p.status === "concluida" || p.dataExecucao
  ).length;
  const porDia = useMemo(() => resumoPorDiaDrywall(paredes), [paredes]);
  const rupMedio = rupMedioDrywall(paredes);
  const areaRestante = Math.max(0, areaTotal - areaExecutada);
  const diasEstimados =
    rupMedio > 0 && areaRestante > 0 ? Math.ceil(areaRestante / rupMedio) : null;

  const paredeDetalhe: ParedeDrywall | undefined = selecionada
    ? paredes.find((p) => p.id === selecionada)
    : undefined;

  if (paredes.length === 0) {
    return (
      <Card className="py-10 text-center text-sm text-slate-500">
        Nenhum painel na planilha. Os dados serão exibidos após a próxima
        publicação com a aba Parede Drywall preenchida.
      </Card>
    );
  }

  return (
    <div>
      <Card className="mb-6 flex flex-wrap items-center justify-center gap-6 bg-gradient-to-br from-violet-900 to-violet-950 py-6 text-white sm:gap-8">
        <div className="text-center">
          <div className="text-5xl font-black tabular-nums">{formatarNumero(pct, 0)}%</div>
          <div className="mt-1 text-xs uppercase tracking-wide text-violet-300">
            Executado
          </div>
        </div>
        <div className="text-center">
          <div className="inline-flex items-baseline gap-1 rounded-xl bg-white/10 px-4 py-2 ring-2 ring-white/25">
            <span className="text-3xl font-black tabular-nums">
              {formatarNumero(areaExecutada, 0)}
            </span>
            <span className="text-lg text-violet-300">/</span>
            <span className="text-lg font-bold tabular-nums text-violet-300">
              {formatarNumero(areaTotal, 0)}
            </span>
            <span className="text-sm font-bold text-violet-300">m²</span>
          </div>
          <div className="mt-1.5 text-xs uppercase tracking-wide text-violet-300">
            Executado / Escopo
          </div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-black text-amber-300">
            {formatarNumero(areaRestante, 0)}
          </div>
          <div className="text-xs uppercase tracking-wide text-violet-300">
            Restante (m²)
          </div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-black text-violet-300">
            {concluidas}/{paredes.length}
          </div>
          <div className="text-xs uppercase tracking-wide text-violet-400">
            Painéis concluídos
          </div>
          <div className="mt-1 text-xs text-violet-500">
            RUP médio {formatarNumero(rupMedio, 1)} m²/dia
          </div>
        </div>
      </Card>

      {areaRestante > 0 && diasEstimados != null && (
        <Card className="mb-6 border-amber-200 bg-amber-50/80 py-3 text-center text-sm text-amber-900">
          Faltam <strong>{formatarNumero(areaRestante, 0)} m²</strong> · previsão ~{" "}
          <strong>{diasEstimados} dia{diasEstimados !== 1 ? "s" : ""}</strong> ao RUP
          médio de {formatarNumero(rupMedio, 1)} m²/dia
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {paredes.map((p) => {
              const ativo = selecionada === p.id;
              const escopo = p.areaM2 ?? 0;
              const concluida = p.status === "concluida" || !!p.dataExecucao;
              const executado = concluida ? escopo : 0;
              const restante = Math.max(0, escopo - executado);
              const pctParede =
                escopo > 0
                  ? Math.min(100, Math.round((executado / escopo) * 1000) / 10)
                  : concluida
                    ? 100
                    : p.status === "em_andamento"
                      ? 50
                      : 0;

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelecionada(ativo ? null : p.id)}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    ativo
                      ? "border-violet-500 bg-violet-50 ring-2 ring-violet-200"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-slate-900">
                      {labelParede(p.codigo)}
                    </span>
                    <Badge variant={STATUS_VARIANT[p.status]}>
                      {STATUS_LABEL[p.status]}
                    </Badge>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {formatarNumero(executado, 1)} / {formatarNumero(escopo, 1)} m²
                    {p.dataExecucao && (
                      <> · {formatarDataExecucao(p.dataExecucao)}</>
                    )}
                  </div>
                  {restante > 0 && (
                    <div className="mt-0.5 text-xs font-medium text-amber-600">
                      Faltam {formatarNumero(restante, 1)} m²
                    </div>
                  )}
                  <div className="mt-3">
                    <ProgressBar percentual={pctParede} size="large" />
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {formatarNumero(pctParede, 0)}% executado
                  </div>
                </button>
              );
            })}
          </div>

          {porDia.length > 0 && (
            <Card className="overflow-hidden p-0">
              <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase text-slate-500">
                Produção por dia
              </div>
              <div className="divide-y divide-slate-100">
                {porDia.map((d) => {
                  const rupMax = Math.max(...porDia.map((x) => x.areaM2), 1);
                  return (
                    <div
                      key={d.data}
                      className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50"
                    >
                      <span className="w-24 shrink-0 text-sm font-medium">
                        {formatarDataExecucao(d.data)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-violet-500"
                            style={{
                              width: `${(d.areaM2 / rupMax) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                      <span className="w-20 shrink-0 text-right text-sm font-bold text-violet-700">
                        {formatarNumero(d.areaM2, 1)} m²
                      </span>
                      <span className="hidden w-28 shrink-0 text-right text-xs text-slate-500 sm:block">
                        {d.paredes.length} painel{d.paredes.length !== 1 ? "éis" : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        <div>
          <Card
            className={
              paredeDetalhe
                ? "border-violet-200 bg-gradient-to-br from-violet-50 to-white"
                : ""
            }
          >
            {paredeDetalhe ? (
              <>
                <h3 className="text-lg font-bold text-slate-900">
                  {labelParede(paredeDetalhe.codigo)}
                </h3>
                <div className="mt-2">
                  <Badge variant={STATUS_VARIANT[paredeDetalhe.status]}>
                    {STATUS_LABEL[paredeDetalhe.status]}
                  </Badge>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
                    <div className="text-xs text-slate-500">Escopo</div>
                    <div className="text-2xl font-black text-slate-900">
                      {formatarNumero(paredeDetalhe.areaM2 ?? 0, 1)}
                    </div>
                    <div className="text-xs text-slate-400">m²</div>
                  </div>
                  <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
                    <div className="text-xs text-slate-500">Executado</div>
                    <div className="text-2xl font-black text-violet-600">
                      {paredeDetalhe.status === "concluida" || paredeDetalhe.dataExecucao
                        ? formatarNumero(paredeDetalhe.areaM2 ?? 0, 1)
                        : "0"}
                    </div>
                    <div className="text-xs text-slate-400">m²</div>
                  </div>
                  <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
                    <div className="text-xs text-slate-500">Restante</div>
                    <div className="text-2xl font-black text-amber-700">
                      {paredeDetalhe.status === "concluida" || paredeDetalhe.dataExecucao
                        ? "0"
                        : formatarNumero(paredeDetalhe.areaM2 ?? 0, 1)}
                    </div>
                    <div className="text-xs text-slate-400">m²</div>
                  </div>
                  <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
                    <div className="text-xs text-slate-500">Execução</div>
                    <div className="text-lg font-black text-violet-600">
                      {formatarDataExecucao(paredeDetalhe.dataExecucao)}
                    </div>
                  </div>
                </div>

                {(paredeDetalhe.comprimentoM || paredeDetalhe.alturaM) && (
                  <p className="mt-4 text-sm text-slate-600">
                    {paredeDetalhe.comprimentoM != null &&
                      `${formatarNumero(paredeDetalhe.comprimentoM, 2)} m`}
                    {paredeDetalhe.comprimentoM && paredeDetalhe.alturaM && " × "}
                    {paredeDetalhe.alturaM != null &&
                      `${formatarNumero(paredeDetalhe.alturaM, 2)} m`}
                  </p>
                )}

                <Link
                  href={hrefGrupo(obraId, "Drywall")}
                  className="mt-4 inline-block text-sm font-medium text-violet-700 hover:underline"
                >
                  Ver frente de painéis de drywall →
                </Link>
              </>
            ) : (
              <div className="py-6 text-center text-slate-500">
                <p className="text-sm">
                  Selecione um painel para ver detalhes ou consulte a produção
                  diária abaixo.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
