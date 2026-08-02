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
import { normalizarLocalizacao } from "@/lib/localizacoes";
import { hrefGrupo } from "@/lib/grupos-nav";
import { totalEscopoServico } from "@/lib/escopo";
import { SERVICOS_PLAQUEAMENTO, labelServico } from "@/lib/servicos";
import type { Servico } from "@/lib/types";

interface LinhaResumo {
  localizacao: string;
  escopo: number;
  executado: number;
  restante: number;
  percentual: number;
  rupDiario: number;
  dias: number;
  equipes: string[];
}

export function ResumoPlaqueamentoExterno() {
  const { resumosCalculados, progresso, obra, obraId } = useObra();
  const [servicoAtivo, setServicoAtivo] = useState<Servico>("Plaqueamento Glasroc-x");
  const [localSelecionada, setLocalSelecionada] = useState<string | null>(null);

  const resumosServico = useMemo(
    () => resumosCalculados.filter((r) => r.servico === servicoAtivo),
    [resumosCalculados, servicoAtivo]
  );

  const linhasResumo = useMemo((): LinhaResumo[] => {
    return progresso
      .map((p) => {
        const prog = p.servicos[servicoAtivo];
        const resumo = resumosServico.find(
          (r) =>
            normalizarLocalizacao(r.localizacao) ===
            normalizarLocalizacao(p.localizacao)
        );
        const escopo = p.areaTotalM2;
        const executado = prog?.areaProduzida ?? 0;
        const restante = prog?.areaRestante ?? Math.max(0, escopo - executado);
        const percentual = prog?.percentual ?? 0;

        return {
          localizacao: p.localizacao,
          escopo,
          executado,
          restante,
          percentual,
          rupDiario: resumo?.rupDiario ?? 0,
          dias: resumo?.dias ?? 0,
          equipes: resumo?.equipes ?? [],
        };
      })
      .filter((l) => l.escopo > 0 || l.executado > 0);
  }, [progresso, servicoAtivo, resumosServico]);

  const totais = useMemo(() => {
    const escopo = totalEscopoServico(obra, servicoAtivo);
    const executado = linhasResumo.reduce((s, l) => s + l.executado, 0);
    const restante = Math.max(0, escopo - executado);
    const pct =
      escopo > 0 ? Math.min(100, Math.round((executado / escopo) * 1000) / 10) : 0;
    const dias = new Set(
      obra.registros.filter((r) => r.servico === servicoAtivo).map((r) => r.data)
    ).size;
    const rupGeral = dias > 0 ? Math.round((executado / dias) * 10) / 10 : 0;
    return { escopo, executado, restante, pct, rupGeral, dias };
  }, [linhasResumo, obra, servicoAtivo]);

  const rupMax = useMemo(
    () => Math.max(...linhasResumo.map((r) => r.rupDiario), 1),
    [linhasResumo]
  );

  const detalhe = localSelecionada
    ? linhasResumo.find(
        (r) =>
          normalizarLocalizacao(r.localizacao) ===
          normalizarLocalizacao(localSelecionada)
      )
    : null;

  const diasEstimados =
    detalhe && detalhe.rupDiario > 0 && detalhe.restante > 0
      ? Math.ceil(detalhe.restante / detalhe.rupDiario)
      : null;

  const registrosLocal = localSelecionada
    ? obra.registros
        .filter(
          (r) =>
            normalizarLocalizacao(r.localizacao) ===
              normalizarLocalizacao(localSelecionada) &&
            r.servico === servicoAtivo
        )
        .sort((a, b) => b.data.localeCompare(a.data))
    : [];

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {SERVICOS_PLAQUEAMENTO.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setServicoAtivo(s);
              setLocalSelecionada(null);
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              servicoAtivo === s
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {labelServico(s)}
          </button>
        ))}
      </div>

      {linhasResumo.length > 0 && (
        <Card className="mb-6 flex flex-wrap items-center justify-center gap-6 bg-gradient-to-br from-slate-900 to-slate-800 py-6 text-white sm:gap-8">
          <PercentualDestaque percentual={totais.pct} size="lg" variant="dark" />
          <AreaDestaque
            produzida={totais.executado}
            escopo={totais.escopo}
            size="md"
            variant="dark"
          />
          <div className="text-center">
            <div className="text-3xl font-black text-blue-400">
              {formatarNumero(totais.restante, 0)}
            </div>
            <div className="text-xs uppercase tracking-wide text-slate-400">
              Restante (m²)
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black text-blue-400">
              {formatarNumero(totais.rupGeral, 1)}
            </div>
            <div className="text-xs uppercase tracking-wide text-slate-400">
              RUP geral (m²/dia)
            </div>
            {totais.dias > 0 && (
              <div className="mt-1 text-xs text-slate-500">
                {totais.dias} dia{totais.dias !== 1 ? "s" : ""} com apontamento
              </div>
            )}
          </div>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {linhasResumo.map((r) => {
              const ativo =
                localSelecionada != null &&
                normalizarLocalizacao(localSelecionada) ===
                  normalizarLocalizacao(r.localizacao);

              return (
                <button
                  key={r.localizacao}
                  type="button"
                  onClick={() =>
                    setLocalSelecionada(ativo ? null : r.localizacao)
                  }
                  className={`rounded-xl border p-4 text-left transition-all ${
                    ativo
                      ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-slate-900">
                      {r.localizacao}
                    </span>
                    {r.rupDiario > 0 && (
                      <span className="text-lg font-black text-blue-600">
                        {formatarNumero(r.rupDiario, 1)}
                      </span>
                    )}
                  </div>
                  {r.rupDiario > 0 && (
                    <div className="mt-0.5 text-xs text-slate-400">m²/dia</div>
                  )}
                  <div className="mt-3">
                    <ProgressBar percentual={r.percentual} size="large" />
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    <span className="font-medium text-slate-700">
                      {formatarNumero(r.percentual, 0)}% executado
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-slate-500">
                    <span>
                      {formatarNumero(r.executado, 0)} / {formatarNumero(r.escopo, 0)} m²
                    </span>
                    {r.restante > 0 ? (
                      <span className="font-medium text-amber-600">
                        Faltam {formatarNumero(r.restante, 0)} m²
                      </span>
                    ) : r.escopo > 0 ? (
                      <span className="font-medium text-emerald-600">Concluído</span>
                    ) : null}
                  </div>
                  {r.rupDiario > 0 && (
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all"
                        style={{
                          width: `${Math.min(100, (r.rupDiario / rupMax) * 100)}%`,
                        }}
                      />
                    </div>
                  )}
                </button>
              );
            })}
            {linhasResumo.length === 0 && (
              <Card className="col-span-full py-8 text-center text-sm text-slate-500">
                Nenhum escopo ou apontamento para {labelServico(servicoAtivo)} ainda.
              </Card>
            )}
          </div>

          {linhasResumo.length > 0 && (
            <Card className="overflow-hidden p-0">
              <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase text-slate-500">
                Escopo vs executado — {labelServico(servicoAtivo)}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                      <th className="px-4 py-2">Localização</th>
                      <th className="px-4 py-2 text-right">Escopo</th>
                      <th className="px-4 py-2 text-right">Executado</th>
                      <th className="px-4 py-2 text-right">Restante</th>
                      <th className="px-4 py-2 text-center">%</th>
                      <th className="px-4 py-2 text-right">RUP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linhasResumo.map((r) => (
                      <tr
                        key={r.localizacao}
                        className="border-b border-slate-50 hover:bg-slate-50"
                      >
                        <td className="px-4 py-2.5 font-medium">{r.localizacao}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">
                          {formatarNumero(r.escopo, 0)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold tabular-nums">
                          {formatarNumero(r.executado, 0)}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-amber-700">
                          {r.restante > 0 ? formatarNumero(r.restante, 0) : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-center font-medium">
                          {formatarNumero(r.percentual, 0)}%
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-blue-700">
                          {r.rupDiario > 0 ? formatarNumero(r.rupDiario, 1) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card
            className={
              localSelecionada
                ? "border-blue-200 bg-gradient-to-br from-blue-50 to-white"
                : ""
            }
          >
            {localSelecionada && detalhe ? (
              <>
                <h3 className="text-lg font-bold text-slate-900">
                  {detalhe.localizacao}
                </h3>
                <p className="mt-0.5 text-sm text-slate-500">
                  {labelServico(servicoAtivo)}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
                    <div className="text-xs text-slate-500">Escopo</div>
                    <div className="text-2xl font-black text-slate-900">
                      {formatarNumero(detalhe.escopo, 0)}
                    </div>
                    <div className="text-xs text-slate-400">m² total</div>
                  </div>
                  <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
                    <div className="text-xs text-slate-500">Executado</div>
                    <div className="text-2xl font-black text-blue-600">
                      {formatarNumero(detalhe.percentual, 0)}%
                    </div>
                    <div className="text-xs text-slate-400">
                      {formatarNumero(detalhe.executado, 0)} m²
                    </div>
                  </div>
                  <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
                    <div className="text-xs text-slate-500">Restante</div>
                    <div className="text-2xl font-black text-amber-700">
                      {formatarNumero(detalhe.restante, 0)}
                    </div>
                    <div className="text-xs text-slate-400">m²</div>
                  </div>
                  <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
                    <div className="text-xs text-slate-500">RUP</div>
                    <div className="text-2xl font-black text-blue-600">
                      {detalhe.rupDiario > 0
                        ? formatarNumero(detalhe.rupDiario, 1)
                        : "—"}
                    </div>
                    <div className="text-xs text-slate-400">m²/dia</div>
                  </div>
                </div>

                {detalhe.restante > 0 && (
                  <div className="mt-4 rounded-lg bg-amber-50 p-3 ring-1 ring-amber-200">
                    <div className="text-sm font-medium text-amber-900">
                      Faltam {formatarNumero(detalhe.restante, 0)} m² de{" "}
                      {formatarNumero(detalhe.escopo, 0)} m²
                    </div>
                    {diasEstimados != null && (
                      <div className="mt-1 text-xs text-amber-800">
                        Previsão: ~{diasEstimados} dia
                        {diasEstimados !== 1 ? "s" : ""} ao RUP de{" "}
                        {formatarNumero(detalhe.rupDiario, 1)} m²/dia
                      </div>
                    )}
                  </div>
                )}

                {detalhe.percentual >= 100 && (
                  <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200">
                    Escopo concluído nesta localização
                  </div>
                )}

                {detalhe.equipes.length > 0 && (
                  <div className="mt-4">
                    <div className="text-xs font-semibold uppercase text-slate-500">
                      Equipes
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {detalhe.equipes.map((e) => (
                        <Badge key={e}>{e}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {registrosLocal.length > 0 && (
                  <div className="mt-4 border-t border-slate-200 pt-4">
                    <div className="text-xs font-semibold uppercase text-slate-500">
                      Apontamentos
                    </div>
                    <ul className="mt-2 max-h-48 space-y-1.5 overflow-y-auto text-sm">
                      {registrosLocal.slice(0, 8).map((r) => (
                        <li
                          key={r.id}
                          className="flex justify-between rounded bg-white/80 px-2 py-1.5"
                        >
                          <span className="text-slate-600">
                            {new Date(r.data + "T12:00:00").toLocaleDateString(
                              "pt-BR"
                            )}
                          </span>
                          <span className="font-semibold">
                            {formatarNumero(r.areaM2, 1)} m²
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Link
                  href={hrefGrupo(obraId, "Plaqueamento Externo")}
                  className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline"
                >
                  Ver frente de plaqueamento externo →
                </Link>
              </>
            ) : (
              <div className="py-6 text-center text-slate-500">
                <p className="text-sm">
                  Selecione uma face para ver escopo, executado, restante e
                  previsão.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
