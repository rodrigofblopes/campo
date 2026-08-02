"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import {
  AppShell,
  Badge,
  Card,
  PageHeader,
  ProgressBar,
} from "@/components/ui";
import { useObra } from "@/context/ObraContext";
import {
  benchmarkProdutividade,
  calcularDestaques,
  dataAtualizacaoObra,
  formatarDataCurta,
  formatarNumero,
  previsaoPorRupReferencia,
  previsoesConclusao,
  rankingEquipesPlaqueamentoExterno,
  rankingLocalizacoesGlasroc,
  resumoFrentesDashboard,
  seriesProducaoPorFrente,
} from "@/lib/dashboard";
import { exportarBenchmarkXLSX } from "@/lib/benchmark-export";
import { getObraMeta } from "@/lib/obras";
import { TrendChart } from "@/components/TrendChart";
import {
  areaProduzidaPorServico,
  calcularAnalise,
  inferirConfigDeProducao,
} from "@/lib/calculations";
import { hrefGrupo, hrefObra } from "@/lib/grupos-nav";
import { gerarRelatorioPDF } from "@/lib/pdf-report";
import {
  getServicoConfig,
  labelServico,
  type GrupoServico,
} from "@/lib/servicos";
import type { Servico } from "@/lib/types";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  Clock,
  Download,
  FileText,
  LineChart,
  Sheet,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";

const CORES_FRENTE: Record<
  GrupoServico,
  { border: string; bg: string; text: string; bar: string }
> = {
  "Plaqueamento Externo": {
    border: "border-blue-200",
    bg: "bg-blue-50",
    text: "text-blue-700",
    bar: "bg-blue-500",
  },
  Porcelanato: {
    border: "border-emerald-200",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    bar: "bg-emerald-500",
  },
  Drywall: {
    border: "border-violet-200",
    bg: "bg-violet-50",
    text: "text-violet-700",
    bar: "bg-violet-500",
  },
  "Plaqueamento Interno": {
    border: "border-slate-200",
    bg: "bg-slate-50",
    text: "text-slate-600",
    bar: "bg-slate-400",
  },
  Forro: {
    border: "border-amber-200",
    bg: "bg-amber-50",
    text: "text-amber-700",
    bar: "bg-amber-500",
  },
};

const CORES_TENDENCIA: Record<GrupoServico, string> = {
  "Plaqueamento Externo": "#3b82f6",
  Porcelanato: "#10b981",
  Drywall: "#8b5cf6",
  "Plaqueamento Interno": "#94a3b8",
  Forro: "#f59e0b",
};

export default function DashboardPage() {
  const { obraId, obra, obraMeta, progresso, equipes, resumosCalculados } = useObra();

  const resumos =
    obra.resumos.length > 0 ? obra.resumos : resumosCalculados;
  const frentes = useMemo(() => resumoFrentesDashboard(obra), [obra]);
  const frentesAtivas = frentes.filter((f) => f.ativo);
  const ranking = useMemo(
    () => rankingLocalizacoesGlasroc(progresso, resumos),
    [progresso, resumos]
  );
  const destaques = useMemo(
    () => calcularDestaques(obra, progresso, resumos),
    [obra, progresso, resumos]
  );
  const previsoes = useMemo(() => previsoesConclusao(obra, frentes), [obra, frentes]);
  const series = useMemo(() => seriesProducaoPorFrente(obra), [obra]);
  const rankingEquipes = useMemo(
    () => rankingEquipesPlaqueamentoExterno(obra),
    [obra]
  );
  const benchmark = useMemo(() => benchmarkProdutividade(obra), [obra]);
  const obraReferencia = obraId !== "sicredi" ? getObraMeta("sicredi")?.obra : undefined;
  const benchmarkReferencia = useMemo(
    () => (obraReferencia ? benchmarkProdutividade(obraReferencia) : []),
    [obraReferencia]
  );
  const previsaoRup = useMemo(
    () => (obraReferencia ? previsaoPorRupReferencia(obra, benchmarkReferencia) : []),
    [obra, obraReferencia, benchmarkReferencia]
  );
  const dataAtualizacao = dataAtualizacaoObra(obra);
  const diasUnicos = new Set(obra.registros.map((r) => r.data)).size;
  const areaPorServico = areaProduzidaPorServico(obra.registros);
  const servicosComRegistro = [
    ...new Set(obra.registros.map((r) => r.servico)),
  ] as Servico[];

  return (
    <AppShell>
      <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-lg">
        {obraMeta.foto ? (
          <div className="relative mx-auto aspect-[5/2] min-h-[180px] max-h-[280px] w-full sm:aspect-[2.4/1] sm:max-h-[320px]">
            <Image
              src={obraMeta.foto}
              alt={`Vista aérea — ${obra.nome}`}
              fill
              className="scale-110 object-cover object-[55%_72%] sm:object-[52%_68%]"
              sizes="(max-width: 768px) 100vw, calc(100vw - 16rem)"
              priority
              quality={90}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent" />
            <div className="absolute inset-0 flex flex-col items-center justify-end px-4 pb-5 pt-10 text-center text-white sm:pb-7">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-300">
                {obra.cliente ?? "Steel Frame"}
              </p>
              <h2 className="mt-1 max-w-2xl text-xl font-bold drop-shadow-md sm:text-2xl">
                {obra.nome}
              </h2>
              {dataAtualizacao && (
                <p className="mt-2 text-xs text-slate-400">
                  Dados atualizados em {dataAtualizacao}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-1 px-4 py-8 text-center text-white">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-300">
              {obra.cliente ?? "Steel Frame"}
            </p>
            <h2 className="max-w-2xl text-xl font-bold sm:text-2xl">{obra.nome}</h2>
            <p className="mt-1 text-xs text-slate-400">
              Foto da obra em aberto — adicionar quando os trabalhos começarem
            </p>
          </div>
        )}
      </div>

      <PageHeader
        title="Dashboard"
        description="Visão executiva da obra — escopo, executado e restante por frente"
        compact
      >
        <button
          type="button"
          onClick={() => gerarRelatorioPDF(obra)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800 sm:text-sm"
        >
          <Download size={16} />
          PDF
        </button>
      </PageHeader>

      {/* Faixa executiva */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {frentesAtivas.map((f) => {
          const cores = CORES_FRENTE[f.id];
          return (
            <Link
              key={f.id}
              href={
                f.id === "Plaqueamento Externo"
                  ? hrefObra(obraId, "/resumo")
                  : hrefGrupo(obraId, f.id)
              }
              className={`rounded-xl border-2 p-4 transition-shadow hover:shadow-md ${cores.border} ${cores.bg}`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-semibold text-slate-800">{f.label}</span>
                <span className={`text-2xl font-black tabular-nums ${cores.text}`}>
                  {formatarNumero(f.percentual, 0)}%
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-600">
                {formatarNumero(f.executado, 0)} / {formatarNumero(f.escopo, 0)} m²
              </div>
              {f.restante > 0 ? (
                <div className="mt-1 text-xs font-medium text-amber-700">
                  Faltam {formatarNumero(f.restante, 0)} m²
                </div>
              ) : (
                <div className="mt-1 text-xs font-medium text-emerald-700">Concluído</div>
              )}
              {f.detalhe && (
                <div className="mt-1 text-[10px] text-slate-500">{f.detalhe}</div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Destaques */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {destaques.maisAtrasada && (
          <Card className="border-amber-200 bg-amber-50/80 py-3">
            <div className="flex gap-3">
              <AlertTriangle className="shrink-0 text-amber-600" size={18} />
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase text-amber-800">
                  Mais atrasada
                </div>
                <div className="mt-0.5 truncate font-semibold text-slate-900">
                  {destaques.maisAtrasada.localizacao}
                </div>
                <div className="text-xs text-amber-900">
                  {formatarNumero(destaques.maisAtrasada.percentual, 0)}% · faltam{" "}
                  {formatarNumero(destaques.maisAtrasada.restante, 0)} m²
                </div>
              </div>
            </div>
          </Card>
        )}
        {destaques.melhorRup && (
          <Card className="border-blue-200 bg-blue-50/80 py-3">
            <div className="flex gap-3">
              <Trophy className="shrink-0 text-blue-600" size={18} />
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase text-blue-800">
                  Melhor RUP
                </div>
                <div className="mt-0.5 truncate font-semibold text-slate-900">
                  {destaques.melhorRup.localizacao}
                </div>
                <div className="text-xs text-blue-900">
                  {formatarNumero(destaques.melhorRup.rupDiario, 1)} m²/dia
                </div>
              </div>
            </div>
          </Card>
        )}
        {destaques.ultimoApontamento && (
          <Card className="py-3">
            <div className="flex gap-3">
              <Calendar className="shrink-0 text-slate-500" size={18} />
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase text-slate-500">
                  Último apontamento
                </div>
                <div className="mt-0.5 font-semibold text-slate-900">
                  {formatarDataCurta(destaques.ultimoApontamento.data)}
                </div>
                <div className="truncate text-xs text-slate-600">
                  {destaques.ultimoApontamento.localizacao} ·{" "}
                  {formatarNumero(destaques.ultimoApontamento.areaM2, 1)} m²
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Cards por frente */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {frentes.map((f) => {
          const cores = CORES_FRENTE[f.id];
          const previsao = previsoes.find((p) => p.id === f.id);
          const href = hrefGrupo(obraId, f.id);
          return (
            <Card
              key={f.id}
              className={`flex flex-col ${!f.ativo ? "opacity-60" : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900">{f.label}</h3>
                {!f.ativo && (
                  <Badge variant="default">Futuro</Badge>
                )}
              </div>
              {f.ativo ? (
                <>
                  <div className={`mt-3 text-4xl font-black tabular-nums ${cores.text}`}>
                    {formatarNumero(f.percentual, 0)}%
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    {formatarNumero(f.executado, 0)} / {formatarNumero(f.escopo, 0)} m²
                  </div>
                  <div className="mt-3">
                    <ProgressBar percentual={f.percentual} size="large" />
                  </div>
                  {f.restante > 0 && (
                    <p className="mt-2 text-xs font-medium text-amber-600">
                      Faltam {formatarNumero(f.restante, 0)} m²
                    </p>
                  )}
                  {previsao && previsao.dataPrevista && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <Clock size={12} className="shrink-0" />
                      Previsão: {formatarDataCurta(previsao.dataPrevista)} · ritmo{" "}
                      {formatarNumero(previsao.ritmoDiario, 1)} m²/dia
                    </p>
                  )}
                  {previsao && !previsao.dataPrevista && previsao.diasRestantes === null && (
                    <p className="mt-1 text-xs text-slate-400">
                      Ritmo recente insuficiente para prever conclusão
                    </p>
                  )}
                  {f.detalhe && (
                    <p className="mt-1 text-xs text-slate-400">{f.detalhe}</p>
                  )}
                </>
              ) : (
                <p className="mt-3 text-sm text-slate-500">{f.detalhe}</p>
              )}
              <Link
                href={href}
                className={`mt-4 inline-flex items-center gap-1 text-sm font-medium ${cores.text} hover:underline`}
              >
                Ver frente <ArrowRight size={14} />
              </Link>
            </Card>
          );
        })}
      </div>

      {/* Previsão por RUP histórico (obras em planejamento, sem ritmo próprio ainda) */}
      {previsaoRup.length > 0 && (
        <Card className="mb-8 overflow-hidden p-0">
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <Clock className="text-blue-600" size={16} />
              <h3 className="font-semibold text-slate-900">
                Previsão por RUP histórico
              </h3>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Dias restantes estimados aplicando o RUP de {obraReferencia?.nome} sobre o
              escopo ainda não executado desta obra — referência até a Amaggi ter ritmo
              próprio.
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {previsaoRup.map((p) => (
              <div
                key={p.servico}
                className="flex items-center justify-between gap-3 px-4 py-2.5"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-900">
                    {p.label}
                  </div>
                  <div className="text-xs text-slate-500">
                    {p.grupoLabel} · faltam {formatarNumero(p.escopoRestante, 0)} m² · RUP{" "}
                    {formatarNumero(p.rupReferencia, 1)} m²/dia
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-lg font-black text-blue-600">
                    {p.diasPrevistos}
                  </div>
                  <div className="text-[10px] text-slate-400">dias corridos</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tendência de produção */}
      <Card className="mb-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <LineChart className="text-blue-600" size={20} />
            <div>
              <h3 className="font-semibold text-slate-900">Tendência de produção</h3>
              <p className="text-xs text-slate-500">
                Área acumulada por frente ao longo da obra
              </p>
            </div>
          </div>
        </div>
        <TrendChart series={series} cores={CORES_TENDENCIA} />
      </Card>

      {/* Stats compactos */}
      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        <Card className="py-3 text-center">
          <div className="text-2xl font-black text-slate-900">{diasUnicos}</div>
          <div className="text-xs text-slate-500">Dias com apontamento</div>
        </Card>
        <Card className="py-3 text-center">
          <div className="text-2xl font-black text-slate-900">{obra.registros.length}</div>
          <div className="text-xs text-slate-500">Registros totais</div>
        </Card>
        <Card className="py-3">
          <div className="text-center text-2xl font-black text-slate-900">{equipes.length}</div>
          <div className="text-center text-xs text-slate-500">Equipes ativas</div>
          <div className="mt-2 flex flex-wrap justify-center gap-1">
            {equipes.slice(0, 3).map((e) => (
              <Badge key={e}>{e}</Badge>
            ))}
            {equipes.length > 3 && (
              <Badge variant="default">+{equipes.length - 3}</Badge>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Ranking faces */}
        <Card className="overflow-hidden p-0">
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-slate-900">
                Faces — Glasroc-x (escopo × executado)
              </h3>
              <Link
                href={hrefObra(obraId, "/resumo")}
                className="shrink-0 text-xs font-medium text-blue-600 hover:underline"
              >
                Resumo →
              </Link>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Ordenado por % executado — menor primeiro
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {ranking.map((l) => (
              <div key={l.localizacao} className="px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-slate-900">
                      {l.localizacao}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {formatarNumero(l.executado, 0)} / {formatarNumero(l.escopo, 0)} m²
                      {l.restante > 0 && (
                        <span className="ml-2 text-amber-600">
                          · faltam {formatarNumero(l.restante, 0)} m²
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-lg font-black text-blue-600">
                      {formatarNumero(l.percentual, 0)}%
                    </div>
                    {l.rupDiario > 0 && (
                      <div className="text-[10px] text-slate-400">
                        RUP {formatarNumero(l.rupDiario, 1)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-2">
                  <ProgressBar percentual={l.percentual} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Produtividade por serviço */}
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="text-blue-600" size={20} />
            <h3 className="font-semibold text-slate-900">Produtividade por serviço</h3>
          </div>
          <div className="space-y-3">
            {servicosComRegistro.map((servico) => {
              const { config, areaTotal: area } = inferirConfigDeProducao(
                obra.registros,
                { servico }
              );
              const res = calcularAnalise({ config, areaRealizada: area });
              const cfg = getServicoConfig(servico);

              return (
                <div
                  key={servico}
                  className="rounded-lg border border-slate-100 px-3 py-2.5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-slate-900">
                      {labelServico(servico)}
                    </span>
                    <span className="text-[10px] font-semibold uppercase text-slate-400">
                      {cfg.grupoLabel}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400">Produzido</span>
                      <div className="font-semibold">
                        {formatarNumero(areaPorServico[servico], 0)} m²
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400">m²/dia</span>
                      <div className="font-semibold text-blue-600">
                        {formatarNumero(res.produtividadeDiaria, 1)}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400">Dias</span>
                      <div className="font-semibold">{config.dias}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Ranking de equipes */}
        <Card className="overflow-hidden p-0">
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <Users className="text-blue-600" size={16} />
              <h3 className="font-semibold text-slate-900">Ranking de equipes</h3>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              RUP (m²/dia) — plaqueamento externo, por equipe
            </p>
          </div>
          {rankingEquipes.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {rankingEquipes.map((r, i) => (
                <div key={r.equipe} className="flex items-center gap-3 px-4 py-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-slate-900">{r.equipe}</div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {formatarNumero(r.areaTotal, 0)} m² · {r.dias} dias
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-lg font-black text-blue-600">
                      {formatarNumero(r.rupDiario, 1)}
                    </div>
                    <div className="text-[10px] text-slate-400">m²/dia</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-4 py-6 text-center text-sm text-slate-400">
              Sem apontamentos por equipe ainda
            </p>
          )}
        </Card>

        {/* Benchmark de produtividade */}
        <Card className="overflow-hidden p-0">
          <div className="flex items-start justify-between gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="text-emerald-600" size={16} />
                <h3 className="font-semibold text-slate-900">Benchmark de produtividade</h3>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                RUP por serviço — referência para orçar e planejar futuras obras
              </p>
            </div>
            <button
              type="button"
              onClick={() => exportarBenchmarkXLSX(obra, benchmark, rankingEquipes)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Sheet size={14} />
              XLSX
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {benchmark.map((b) => (
              <div key={b.servico} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-900">{b.label}</div>
                  <div className="text-xs text-slate-500">
                    {b.grupoLabel} · {formatarNumero(b.areaTotal, 0)} m² · {b.dias} dias
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm font-black text-emerald-600">
                    {formatarNumero(b.rupDiario, 1)}
                  </div>
                  <div className="text-[10px] text-slate-400">m²/dia</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-6 flex flex-wrap items-center justify-between gap-4 bg-slate-50">
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 shrink-0 text-slate-500" size={20} />
          <div>
            <h3 className="font-semibold text-slate-900">Apresentação à empresa</h3>
            <p className="mt-0.5 text-sm text-slate-600">
              Use o Resumo para detalhar por frente ou baixe o PDF completo para anexar na reunião.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={hrefObra(obraId, "/resumo")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Abrir Resumo <ArrowRight size={16} />
          </Link>
          <Link
            href={hrefObra(obraId, "/relatorios")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Relatório PDF
          </Link>
        </div>
      </Card>
    </AppShell>
  );
}
