"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FileSpreadsheet, Search } from "lucide-react";
import { AppShell, Badge, Card, PageHeader } from "@/components/ui";
import { useObra } from "@/context/ObraContext";
import { formatarNumero } from "@/lib/calculations";
import { localizacoesDisponiveisServico } from "@/lib/escopo";
import { GRUPOS_SERVICO, labelServico } from "@/lib/servicos";
import { hrefGrupo } from "@/lib/grupos-nav";
import type { Servico } from "@/lib/types";

export default function ProducaoPage() {
  const { obra, obraId, obraMeta } = useObra();
  const [filtroServico, setFiltroServico] = useState<Servico | "">("");
  const [filtroLocal, setFiltroLocal] = useState("");
  const [filtroEquipe, setFiltroEquipe] = useState("");
  const [busca, setBusca] = useState("");

  const servicos = useMemo(
    () => [...new Set(obra.registros.map((r) => r.servico))] as Servico[],
    [obra.registros]
  );
  const localizacoes = useMemo(() => {
    if (filtroServico) {
      return localizacoesDisponiveisServico(obra, filtroServico);
    }
    return [...new Set(obra.registros.map((r) => r.localizacao))].sort((a, b) =>
      a.localeCompare(b, "pt-BR")
    );
  }, [obra, filtroServico]);
  const equipes = useMemo(
    () => [...new Set(obra.registros.map((r) => r.equipe))].sort(),
    [obra.registros]
  );

  const registros = useMemo(() => {
    return obra.registros
      .filter((r) => !filtroServico || r.servico === filtroServico)
      .filter((r) => !filtroLocal || r.localizacao === filtroLocal)
      .filter((r) => !filtroEquipe || r.equipe === filtroEquipe)
      .filter((r) => {
        if (!busca.trim()) return true;
        const q = busca.toLowerCase();
        return (
          r.localizacao.toLowerCase().includes(q) ||
          r.equipe.toLowerCase().includes(q) ||
          r.observacao?.toLowerCase().includes(q) ||
          labelServico(r.servico).toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.data.localeCompare(a.data));
  }, [obra.registros, filtroServico, filtroLocal, filtroEquipe, busca]);

  const totalM2 = registros.reduce((s, r) => s + r.areaM2, 0);
  const diasUnicos = new Set(registros.map((r) => r.data)).size;

  return (
    <AppShell>
      <PageHeader
        title="Conferência — Produção"
        description="Espelho da aba Produção da planilha · somente consulta e validação"
      />

      <Card className="mb-6 border-blue-100 bg-blue-50/60">
        <div className="flex gap-4">
          <div className="hidden shrink-0 rounded-xl bg-blue-100 p-3 text-blue-600 sm:block">
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">
              Espelho da planilha — somente consulta
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Todos os apontamentos vêm da planilha{" "}
              <strong>Produtividade {obraMeta.nome}.xlsx</strong>. Use os filtros abaixo
              para conferir lançamentos por serviço, localização ou equipe. Para
              ver o detalhe por frente, acesse:
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {GRUPOS_SERVICO.map((g) => (
                <Link
                  key={g.id}
                  href={hrefGrupo(obraId, g.id)}
                  className="rounded-full bg-white px-3 py-1 text-xs font-medium text-blue-800 ring-1 ring-blue-200 hover:bg-blue-100"
                >
                  {g.label} →
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Card className="py-4 text-center">
          <div className="text-2xl font-black text-slate-900">{registros.length}</div>
          <div className="text-xs text-slate-500">Registros filtrados</div>
        </Card>
        <Card className="py-4 text-center">
          <div className="text-2xl font-black text-blue-700">
            {formatarNumero(totalM2, 1)}
          </div>
          <div className="text-xs text-slate-500">m² no filtro</div>
        </Card>
        <Card className="py-4 text-center">
          <div className="text-2xl font-black text-slate-900">{diasUnicos}</div>
          <div className="text-xs text-slate-500">Dias com apontamento</div>
        </Card>
      </div>

      <Card className="mb-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="block lg:col-span-2">
            <span className="text-xs font-medium text-slate-500">Buscar</span>
            <div className="relative mt-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Local, equipe, observação..."
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm"
              />
            </div>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-500">Serviço</span>
            <select
              value={filtroServico}
              onChange={(e) => {
                const servico = e.target.value as Servico | "";
                setFiltroServico(servico);
                if (servico && filtroLocal) {
                  const locs = localizacoesDisponiveisServico(obra, servico);
                  if (!locs.includes(filtroLocal)) setFiltroLocal("");
                }
              }}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              {servicos.map((s) => (
                <option key={s} value={s}>
                  {labelServico(s)}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-500">Localização</span>
            <select
              value={filtroLocal}
              onChange={(e) => setFiltroLocal(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Todas</option>
              {localizacoes.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-500">Equipe</span>
            <select
              value={filtroEquipe}
              onChange={(e) => setFiltroEquipe(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Todas</option>
              {equipes.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Equipe</th>
                <th className="px-4 py-3">Localização</th>
                <th className="px-4 py-3">Serviço</th>
                <th className="px-4 py-3 text-right">Área (m²)</th>
                <th className="px-4 py-3">Obs.</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="whitespace-nowrap px-4 py-2.5">
                    {new Date(r.data + "T12:00:00").toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-2.5">{r.equipe}</td>
                  <td className="px-4 py-2.5 font-medium">{r.localizacao}</td>
                  <td className="px-4 py-2.5">
                    <Badge>{labelServico(r.servico)}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold tabular-nums">
                    {formatarNumero(r.areaM2, 2)}
                  </td>
                  <td className="max-w-[240px] truncate px-4 py-2.5 text-xs text-slate-500">
                    {r.observacao}
                  </td>
                </tr>
              ))}
              {registros.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    Nenhum registro com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
