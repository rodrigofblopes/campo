"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AreaDestaque,
  Badge,
  Card,
  PercentualDestaque,
  ProgressBar,
} from "@/components/ui";
import { useObra } from "@/context/ObraContext";
import { formatarNumero } from "@/lib/calculations";
import { hrefGrupo } from "@/lib/grupos-nav";
import {
  areaExecutadaPorcelanato,
  areaTotalPorcelanato,
  formatarDataPorcelanato,
  percentualPorcelanato,
  resumosPorTipoPorcelanato,
} from "@/lib/porcelanato";

export function ResumoPorcelanato() {
  const { obra, obraId } = useObra();
  const tipos = obra.tiposPorcelanato ?? [];
  const apontamentos = obra.apontamentosPorcelanato ?? [];
  const [tipoSelecionado, setTipoSelecionado] = useState<string | null>(null);

  const resumos = useMemo(
    () => resumosPorTipoPorcelanato(tipos, apontamentos),
    [tipos, apontamentos]
  );

  const rupMax = useMemo(
    () => Math.max(...resumos.map((r) => r.rupDiario), 1),
    [resumos]
  );

  const detalhe = tipoSelecionado
    ? resumos.find((r) => r.tipo.id === tipoSelecionado)
    : null;

  const areaTotal = areaTotalPorcelanato(tipos);
  const areaExecutada = areaExecutadaPorcelanato(apontamentos);
  const pctGeral = percentualPorcelanato(tipos, apontamentos);
  const diasGerais = new Set(apontamentos.map((a) => a.dataExecucao)).size;
  const rupGeral =
    diasGerais > 0 ? Math.round((areaExecutada / diasGerais) * 10) / 10 : 0;

  if (tipos.length === 0) {
    return (
      <Card className="py-10 text-center text-sm text-slate-500">
        Nenhum tipo de porcelanato na planilha. Os dados serão exibidos após a
        próxima publicação com a aba Porcelanato preenchida.
      </Card>
    );
  }

  return (
    <div>
      <Card className="mb-6 flex flex-wrap items-center justify-center gap-8 bg-gradient-to-br from-slate-900 to-slate-800 py-6 text-white">
        <PercentualDestaque percentual={pctGeral} size="lg" variant="dark" />
        <AreaDestaque
          produzida={areaExecutada}
          escopo={areaTotal}
          size="md"
          variant="dark"
        />
        <div className="text-center">
          <div className="text-3xl font-black text-amber-300">
            {formatarNumero(Math.max(0, areaTotal - areaExecutada), 1)}
          </div>
          <div className="text-xs uppercase tracking-wide text-slate-400">
            Restante (m²)
          </div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-black text-emerald-400">
            {formatarNumero(rupGeral, 1)}
          </div>
          <div className="text-xs uppercase tracking-wide text-slate-400">
            RUP geral (m²/dia)
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {diasGerais} dia{diasGerais !== 1 ? "s" : ""} com apontamento
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <div className="grid gap-3 sm:grid-cols-2">
            {resumos.map((r) => {
              const ativo = tipoSelecionado === r.tipo.id;
              return (
                <button
                  key={r.tipo.id}
                  type="button"
                  onClick={() =>
                    setTipoSelecionado(ativo ? null : r.tipo.id)
                  }
                  className={`rounded-xl border p-4 text-left transition-all ${
                    ativo
                      ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-slate-900">{r.label}</span>
                    <span className="text-lg font-black text-emerald-600">
                      {formatarNumero(r.rupDiario, 1)}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-slate-400">m²/dia</div>
                  <div className="mt-3">
                    <ProgressBar percentual={r.percentual} size="large" />
                  </div>
                  <div className="mt-2 flex flex-wrap justify-between gap-x-2 gap-y-1 text-xs text-slate-500">
                    <span>{formatarNumero(r.percentual, 0)}% executado</span>
                    <span>
                      {formatarNumero(r.areaExecutada, 0)} /{" "}
                      {formatarNumero(r.tipo.areaTotalM2, 0)} m²
                    </span>
                  </div>
                  {r.areaRestante > 0 && (
                    <div className="mt-1 text-xs font-medium text-amber-600">
                      Faltam {formatarNumero(r.areaRestante, 1)} m²
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {resumos.some((r) => r.rupDiario > 0) && (
            <Card className="overflow-hidden p-0">
              <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase text-slate-500">
                Comparativo RUP por tipo
              </div>
              <div className="divide-y divide-slate-100">
                {[...resumos]
                  .filter((r) => r.rupDiario > 0)
                  .sort((a, b) => b.rupDiario - a.rupDiario)
                  .map((r) => (
                    <div
                      key={r.tipo.id}
                      className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {r.label}
                      </span>
                      <div className="hidden w-48 sm:block">
                        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{
                              width: `${(r.rupDiario / rupMax) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                      <span className="w-16 shrink-0 text-right text-sm font-bold text-emerald-700">
                        {formatarNumero(r.rupDiario, 1)}
                      </span>
                    </div>
                  ))}
              </div>
            </Card>
          )}
        </div>

        <div>
          <Card
            className={
              detalhe
                ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white"
                : ""
            }
          >
            {detalhe ? (
              <>
                <h3 className="text-lg font-bold text-slate-900">{detalhe.label}</h3>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
                    <div className="text-xs text-slate-500">Escopo</div>
                    <div className="text-2xl font-black text-slate-900">
                      {formatarNumero(detalhe.tipo.areaTotalM2, 1)}
                    </div>
                    <div className="text-xs text-slate-400">m² total</div>
                  </div>
                  <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
                    <div className="text-xs text-slate-500">Executado</div>
                    <div className="text-2xl font-black text-emerald-600">
                      {formatarNumero(detalhe.percentual, 0)}%
                    </div>
                    <div className="text-xs text-slate-400">
                      {formatarNumero(detalhe.areaExecutada, 1)} m²
                    </div>
                  </div>
                  <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
                    <div className="text-xs text-slate-500">Restante</div>
                    <div className="text-2xl font-black text-amber-700">
                      {formatarNumero(detalhe.areaRestante, 1)}
                    </div>
                    <div className="text-xs text-slate-400">m²</div>
                  </div>
                  <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
                    <div className="text-xs text-slate-500">RUP</div>
                    <div className="text-2xl font-black text-emerald-600">
                      {formatarNumero(detalhe.rupDiario, 1)}
                    </div>
                    <div className="text-xs text-slate-400">m²/dia</div>
                  </div>
                </div>

                {detalhe.areaRestante > 0 && detalhe.rupDiario > 0 && (
                  <div className="mt-4 rounded-lg bg-amber-50 p-3 ring-1 ring-amber-200">
                    <div className="text-sm font-medium text-amber-900">
                      Faltam {formatarNumero(detalhe.areaRestante, 1)} m²
                    </div>
                    <div className="mt-1 text-xs text-amber-800">
                      Previsão: ~
                      {Math.ceil(detalhe.areaRestante / detalhe.rupDiario)} dia
                      {Math.ceil(detalhe.areaRestante / detalhe.rupDiario) !== 1
                        ? "s"
                        : ""}{" "}
                      ao RUP atual
                    </div>
                  </div>
                )}

                {detalhe.apontamentos.length > 0 && (
                  <div className="mt-4 border-t border-slate-200 pt-4">
                    <div className="text-xs font-semibold uppercase text-slate-500">
                      Apontamentos
                    </div>
                    <ul className="mt-2 max-h-52 space-y-1.5 overflow-y-auto text-sm">
                      {detalhe.apontamentos.map((a) => (
                        <li
                          key={a.id}
                          className="flex justify-between rounded bg-white/80 px-2 py-1.5"
                        >
                          <span className="text-slate-600">
                            {formatarDataPorcelanato(a.dataExecucao)}
                          </span>
                          <span className="font-semibold">
                            {formatarNumero(a.areaExecutadaM2, 2)} m²
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Link
                  href={hrefGrupo(obraId, "Porcelanato")}
                  className="mt-4 inline-block text-sm font-medium text-emerald-700 hover:underline"
                >
                  Ver frente de porcelanato →
                </Link>
              </>
            ) : (
              <div className="py-6 text-center text-slate-500">
                <p className="text-sm">
                  Selecione um tipo de material para ver RUP, progresso e
                  apontamentos.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
