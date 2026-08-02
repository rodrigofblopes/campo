"use client";

import Link from "next/link";
import {
  AreaCelula,
  Card,
  PercentualCelula,
  ProgressBar,
  ProgressoServicoCard,
} from "@/components/ui";
import { useObra } from "@/context/ObraContext";
import { hrefObra } from "@/lib/grupos-nav";
import {
  areaExecutadaServico,
  calcularProgressoServico,
  formatarNumero,
  percentualGeralObra,
  producaoPorLocal,
} from "@/lib/calculations";
import { servicoTemEscopo, totalEscopoServico } from "@/lib/escopo";
import { labelParede, ordemParede } from "@/lib/paredes-drywall";
import { labelParedeInterno, ordemInterno } from "@/lib/paredes-interno";
import type { GrupoServico } from "@/lib/servicos";
import {
  SERVICOS_INTERNO,
  SERVICOS_PLAQUEAMENTO,
  servicosPorGrupo,
} from "@/lib/servicos";

export function GrupoFrenteView({
  grupoId,
  ocultarApontamentos = false,
}: {
  grupoId: GrupoServico;
  ocultarApontamentos?: boolean;
}) {
  const { obra, progresso, obraId } = useObra();
  const servicos = servicosPorGrupo(grupoId);
  const usaTabelaPlaca = grupoId === "Plaqueamento Externo";
  const usaTabelaDrywall = grupoId === "Drywall";
  const usaTabelaInterno = grupoId === "Plaqueamento Interno";

  const linhasDrywall = usaTabelaDrywall
    ? calcularProgressoServico(obra, "Paredes de Drywall").sort(
        (a, b) => ordemParede(a.localizacao) - ordemParede(b.localizacao)
      )
    : [];

  const linhasInterno = usaTabelaInterno
    ? (obra.paredesInterno ?? [])
        .map((p) => ({
          parede: p,
          localizacao: labelParedeInterno(p),
        }))
        .sort((a, b) => ordemInterno(a.localizacao) - ordemInterno(b.localizacao))
    : [];

  const paredePorLabel = new Map(
    (obra.paredesDrywall ?? []).map((p) => [labelParede(p.codigo), p])
  );

  const registrosGrupo = obra.registros.filter((r) =>
    servicos.some((s) => s.id === r.servico)
  );

  return (
    <div>
      <div
        className={`mb-6 grid gap-4 ${
          servicos.length >= 3
            ? "sm:grid-cols-3"
            : servicos.length === 2
              ? "sm:grid-cols-2"
              : "max-w-md"
        }`}
      >
        {servicos.map((cfg) => (
          <ProgressoServicoCard
            key={cfg.id}
            servico={cfg.label}
            percentual={percentualGeralObra(obra, cfg.id)}
            areaProduzida={areaExecutadaServico(obra, cfg.id)}
            areaEscopo={totalEscopoServico(obra, cfg.id)}
            usaEscopo={servicoTemEscopo(obra, cfg.id)}
            status={cfg.status}
          />
        ))}
      </div>

      {usaTabelaPlaca && (
        <Card className="mb-6 overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Localização</th>
                  <th className="border-r-2 border-slate-300 px-4 py-3 text-center">
                    Escopo (m²)
                  </th>
                  {SERVICOS_PLAQUEAMENTO.map((s) => (
                    <th
                      key={s}
                      className="min-w-[200px] border-l border-slate-200 px-4 py-3 text-center first:border-l-2 first:border-slate-300"
                    >
                      {s === "Plaqueamento Glasroc-x" ? "Glasroc-x" : s}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {progresso.map((item) => (
                  <tr
                    key={item.localizacao}
                    className="border-b border-slate-100 hover:bg-slate-50/80"
                  >
                    <td className="px-4 py-4 font-medium">{item.localizacao}</td>
                    <td className="border-r-2 border-slate-300 bg-slate-50/50 px-4 py-4 text-center">
                      <span className="inline-block rounded-lg bg-white px-3 py-1.5 text-lg font-black tabular-nums text-slate-800 ring-1 ring-slate-200">
                        {formatarNumero(item.areaTotalM2, 0)}
                        <span className="ml-0.5 text-sm font-bold text-slate-500">m²</span>
                      </span>
                    </td>
                    {SERVICOS_PLAQUEAMENTO.map((servico) => {
                      const p = item.servicos[servico]!;
                      return (
                        <td
                          key={servico}
                          className="border-l border-slate-200 px-4 py-4 align-top first:border-l-2 first:border-slate-300"
                        >
                          <div className="flex min-w-[180px] flex-col gap-2">
                            <div className="flex shrink-0 items-center gap-2">
                              <PercentualCelula percentual={p.percentual} />
                              <AreaCelula
                                produzida={p.areaProduzida}
                                escopo={item.areaTotalM2}
                              />
                            </div>
                            <ProgressBar percentual={p.percentual} size="large" />
                            {p.areaRestante > 0 && (
                              <div className="text-xs font-semibold text-amber-600">
                                Faltam {formatarNumero(p.areaRestante, 0)} m²
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {usaTabelaDrywall && linhasDrywall.length > 0 && (
        <Card className="mb-6 overflow-hidden p-0">
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase text-slate-500">
            Escopo por painel — {formatarNumero(totalEscopoServico(obra, "Paredes de Drywall"), 0)} m² total
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Painel</th>
                  <th className="border-r-2 border-slate-300 px-4 py-3 text-center">
                    Escopo (m²)
                  </th>
                  <th className="px-4 py-3 text-center">Produzido (m²)</th>
                  <th className="px-4 py-3 text-center">Progresso</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {linhasDrywall.map((row) => {
                  const parede = paredePorLabel.get(row.localizacao);
                  const status = parede?.status ?? "pendente";
                  const statusLabel =
                    status === "concluida"
                      ? "Concluída"
                      : status === "em_andamento"
                        ? "Em andamento"
                        : "Pendente";
                  return (
                    <tr
                      key={row.localizacao}
                      className="border-b border-slate-100 hover:bg-slate-50/80"
                    >
                      <td className="px-4 py-3 font-medium">{row.localizacao}</td>
                      <td className="border-r-2 border-slate-300 bg-slate-50/50 px-4 py-3 text-center">
                        <span className="inline-block rounded-lg bg-white px-3 py-1.5 text-base font-black tabular-nums text-slate-800 ring-1 ring-slate-200">
                          {formatarNumero(row.totalM2, 2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold tabular-nums">
                        {formatarNumero(row.areaProduzida, 2)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex min-w-[140px] flex-col items-center gap-1.5">
                          <PercentualCelula percentual={row.percentual} />
                          <ProgressBar percentual={row.percentual} size="large" />
                          {row.areaRestante > 0 && (
                            <div className="text-xs font-semibold text-amber-600">
                              Faltam {formatarNumero(row.areaRestante, 2)} m²
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                            status === "concluida"
                              ? "bg-emerald-100 text-emerald-800"
                              : status === "em_andamento"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {statusLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {usaTabelaInterno && linhasInterno.length > 0 && (
        <Card className="mb-6 overflow-hidden p-0">
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase text-slate-500">
            Escopo por parede — Performa{" "}
            {formatarNumero(totalEscopoServico(obra, "Plaqueamento Performa"), 0)} m² · RU{" "}
            {formatarNumero(totalEscopoServico(obra, "Plaqueamento RU"), 0)} m²
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Local</th>
                  <th className="border-r-2 border-slate-300 px-4 py-3 text-center">Tipo</th>
                  {SERVICOS_INTERNO.map((s) => (
                    <th
                      key={s}
                      className="min-w-[160px] border-l border-slate-200 px-4 py-3 text-center first:border-l-2 first:border-slate-300"
                    >
                      {s === "Plaqueamento Performa" ? "Performa" : "RU"}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {linhasInterno.map(({ parede, localizacao }) => (
                  <tr
                    key={parede.id}
                    className="border-b border-slate-100 hover:bg-slate-50/80"
                  >
                    <td className="px-4 py-3 font-medium">{localizacao}</td>
                    <td className="border-r-2 border-slate-300 bg-slate-50/50 px-4 py-3 text-center text-xs uppercase text-slate-500">
                      {parede.tipo === "steel" ? "Steel" : "Painel"}
                    </td>
                    {SERVICOS_INTERNO.map((servico) => {
                      const escopo =
                        servico === "Plaqueamento Performa"
                          ? (parede.performaM2 ?? 0)
                          : (parede.ruM2 ?? 0);
                      const prog = calcularProgressoServico(obra, servico).find(
                        (l) => l.localizacao === localizacao
                      );
                      const pct = prog?.percentual ?? 0;
                      const exec = prog?.areaProduzida ?? 0;
                      if (escopo <= 0) {
                        return (
                          <td
                            key={servico}
                            className="border-l border-slate-200 px-4 py-4 text-center text-slate-300 first:border-l-2 first:border-slate-300"
                          >
                            —
                          </td>
                        );
                      }
                      return (
                        <td
                          key={servico}
                          className="border-l border-slate-200 px-4 py-4 align-top first:border-l-2 first:border-slate-300"
                        >
                          <div className="flex min-w-[140px] flex-col gap-2">
                            <div className="flex shrink-0 items-center gap-2">
                              <PercentualCelula percentual={pct} />
                              <AreaCelula produzida={exec} escopo={escopo} />
                            </div>
                            <ProgressBar percentual={pct} size="large" />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {!usaTabelaPlaca &&
        !usaTabelaDrywall &&
        !usaTabelaInterno &&
        servicos.map((cfg) => {
          const comEscopo = servicoTemEscopo(obra, cfg.id);
          const linhas = comEscopo
            ? calcularProgressoServico(obra, cfg.id)
            : producaoPorLocal(obra.registros, cfg.id).map((row) => ({
                localizacao: row.localizacao,
                totalM2: 0,
                areaProduzida: row.areaM2,
                percentual: 0,
                areaRestante: 0,
              }));

          if (linhas.length === 0 && cfg.status === "futuro") return null;

          return (
            <Card key={cfg.id} className="mb-4 overflow-hidden p-0">
              <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase text-slate-500">
                {cfg.label} — por localização
              </div>
              {linhas.length === 0 ? (
                <p className="px-4 py-6 text-sm text-slate-500">
                  Nenhum apontamento ainda.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                        <th className="px-4 py-2">Localização</th>
                        {comEscopo && (
                          <th className="px-4 py-2 text-center">Total (m²)</th>
                        )}
                        <th className="px-4 py-2 text-right">Produzido (m²)</th>
                        {comEscopo && (
                          <th className="px-4 py-2 text-center">%</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {linhas.map((row) => (
                        <tr key={row.localizacao} className="border-b border-slate-50">
                          <td className="px-4 py-2.5 font-medium">{row.localizacao}</td>
                          {comEscopo && (
                            <td className="px-4 py-2.5 text-center">
                              {formatarNumero(row.totalM2, 0)}
                            </td>
                          )}
                          <td className="px-4 py-2.5 text-right font-semibold">
                            {formatarNumero(row.areaProduzida, 1)}
                          </td>
                          {comEscopo && (
                            <td className="px-4 py-2.5 text-center">
                              <PercentualCelula percentual={row.percentual} />
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          );
        })}

      {!ocultarApontamentos && registrosGrupo.length > 0 && (
        <Card className="mt-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">
            Últimos apontamentos desta frente
          </h3>
          <ul className="space-y-2 text-sm">
            {[...registrosGrupo]
              .sort((a, b) => b.data.localeCompare(a.data))
              .slice(0, 5)
              .map((r) => (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2"
                >
                  <span className="text-slate-600">
                    {new Date(r.data + "T12:00:00").toLocaleDateString("pt-BR")} ·{" "}
                    {r.localizacao}
                  </span>
                  <span className="font-semibold text-slate-900">
                    {formatarNumero(r.areaM2, 1)} m²
                  </span>
                </li>
              ))}
          </ul>
          <Link
            href={hrefObra(obraId, "/producao")}
            className="mt-3 inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Conferir planilha completa →
          </Link>
        </Card>
      )}
    </div>
  );
}
