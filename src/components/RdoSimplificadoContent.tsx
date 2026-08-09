"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { EQUIPES } from "@/lib/vistoria-types";
import type { Profissional, RegistroRdo } from "@/lib/rdo-types";
import {
  calcularRupPorProfissional,
  criarProfissional,
  criarRegistroRdo,
  excluirProfissional,
  excluirRegistroRdo,
  gerarComentarioIA,
  listarProfissionais,
  listarRegistrosRdo,
} from "@/lib/rdo-storage";

function novoId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function formatarDataBr(iso: string): string {
  if (!iso) return "-";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * Aba RDO Simplificado: cadastro de profissionais por equipe, registro de
 * serviços executados (com comentário gerado por IA pro RDO documental) e
 * o RUP calculado automaticamente por profissional — uma forma alternativa
 * de alimentar a produtividade da obra sem depender da planilha externa.
 */
export function RdoSimplificadoContent({
  obraId,
  obraNome,
}: {
  obraId: string;
  obraNome: string;
}) {
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [registros, setRegistros] = useState<RegistroRdo[]>([]);
  const [carregando, setCarregando] = useState(true);

  // ---- novo profissional ----
  const [novoNome, setNovoNome] = useState("");
  const [novaFuncao, setNovaFuncao] = useState("");
  const [novaEquipeProf, setNovaEquipeProf] = useState("");
  const [salvandoProf, setSalvandoProf] = useState(false);

  // ---- novo registro de serviço ----
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [equipe, setEquipe] = useState("");
  const [servico, setServico] = useState("");
  const [profissionaisIds, setProfissionaisIds] = useState<string[]>([]);
  const [areaM2, setAreaM2] = useState("");
  const [diarias, setDiarias] = useState("");
  const [precoDiaria, setPrecoDiaria] = useState("");
  const [comentario, setComentario] = useState("");
  const [gerandoComentario, setGerandoComentario] = useState(false);
  const [salvandoRegistro, setSalvandoRegistro] = useState(false);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    Promise.all([listarProfissionais(obraId), listarRegistrosRdo(obraId)]).then(
      ([profs, regs]) => {
        if (!ativo) return;
        setProfissionais(profs);
        setRegistros(regs);
        setCarregando(false);
      }
    );
    return () => {
      ativo = false;
    };
  }, [obraId]);

  const profissionaisPorEquipe = useMemo(() => {
    const mapa = new Map<string, Profissional[]>();
    for (const p of profissionais) {
      const lista = mapa.get(p.equipe) || [];
      lista.push(p);
      mapa.set(p.equipe, lista);
    }
    return Array.from(mapa.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [profissionais]);

  const profissionaisDaEquipeSelecionada = useMemo(
    () => profissionais.filter((p) => p.equipe === equipe),
    [profissionais, equipe]
  );

  const rupPorProfissional = useMemo(
    () => calcularRupPorProfissional(registros, profissionais),
    [registros, profissionais]
  );

  async function handleAdicionarProfissional() {
    if (!novoNome.trim() || !novaEquipeProf) {
      alert("Preencha nome e equipe do profissional.");
      return;
    }
    setSalvandoProf(true);
    try {
      const p: Profissional = {
        id: novoId(),
        obraId,
        nome: novoNome.trim(),
        funcao: novaFuncao.trim() || undefined,
        equipe: novaEquipeProf,
      };
      const ok = await criarProfissional(p);
      if (!ok) {
        alert("Não foi possível salvar agora. Verifique a conexão e tente novamente.");
        return;
      }
      setProfissionais((lista) => [...lista, p]);
      setNovoNome("");
      setNovaFuncao("");
    } finally {
      setSalvandoProf(false);
    }
  }

  async function handleExcluirProfissional(id: string) {
    if (
      !window.confirm("Remover este profissional? Registros de RDO já salvos não são afetados.")
    )
      return;
    const ok = await excluirProfissional(id);
    if (!ok) {
      alert("Não foi possível remover agora. Tente novamente.");
      return;
    }
    setProfissionais((lista) => lista.filter((p) => p.id !== id));
  }

  function alternarProfissionalSelecionado(id: string) {
    setProfissionaisIds((lista) =>
      lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id]
    );
  }

  async function handleGerarComentario() {
    if (!equipe || !servico.trim()) {
      alert("Preencha equipe e serviço antes de gerar o comentário.");
      return;
    }
    setGerandoComentario(true);
    try {
      const nomes = profissionais
        .filter((p) => profissionaisIds.includes(p.id))
        .map((p) => p.nome);
      const texto = await gerarComentarioIA({
        equipe,
        servico: servico.trim(),
        areaM2: Number(areaM2) || 0,
        diarias: Number(diarias) || 0,
        precoDiaria: Number(precoDiaria) || 0,
        profissionaisNomes: nomes,
        data,
      });
      if (!texto) {
        alert("Não foi possível gerar o comentário agora. Você pode escrever manualmente.");
        return;
      }
      setComentario(texto);
    } finally {
      setGerandoComentario(false);
    }
  }

  function limparFormularioRegistro() {
    setServico("");
    setProfissionaisIds([]);
    setAreaM2("");
    setDiarias("");
    setPrecoDiaria("");
    setComentario("");
  }

  async function handleSalvarRegistro() {
    if (!equipe || !servico.trim() || !areaM2 || !diarias || !precoDiaria) {
      alert("Preencha equipe, serviço, área, diárias e preço da diária.");
      return;
    }
    setSalvandoRegistro(true);
    try {
      const registro: RegistroRdo = {
        id: novoId(),
        obraId,
        data,
        equipe,
        servico: servico.trim(),
        profissionaisIds,
        areaM2: Number(areaM2),
        diarias: Number(diarias),
        precoDiaria: Number(precoDiaria),
        comentario: comentario.trim(),
        criadoEm: new Date().toISOString(),
      };
      const ok = await criarRegistroRdo(registro);
      if (!ok) {
        alert("Não foi possível salvar agora. Verifique a conexão e tente novamente.");
        return;
      }
      setRegistros((lista) => [registro, ...lista]);
      limparFormularioRegistro();
    } finally {
      setSalvandoRegistro(false);
    }
  }

  async function handleExcluirRegistro(id: string) {
    if (!window.confirm("Excluir este registro de RDO? Essa ação não pode ser desfeita.")) return;
    const ok = await excluirRegistroRdo(id);
    if (!ok) {
      alert("Não foi possível excluir agora. Tente novamente.");
      return;
    }
    setRegistros((lista) => lista.filter((r) => r.id !== id));
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
        <Loader2 className="animate-spin" size={18} />
        Carregando RDO Simplificado...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Card>
        <h3 className="mb-1 text-sm font-bold text-slate-900">Profissionais por equipe</h3>
        <p className="mb-3 text-xs text-slate-500">
          Cadastre quem está na obra pra depois marcar quem executou cada serviço.
        </p>

        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
          <input
            type="text"
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            placeholder="Nome"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={novaFuncao}
            onChange={(e) => setNovaFuncao(e.target.value)}
            placeholder="Função (opcional)"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={novaEquipeProf}
            onChange={(e) => setNovaEquipeProf(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Equipe</option>
            {EQUIPES.map((eq) => (
              <option key={eq} value={eq}>
                {eq}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={salvandoProf}
            onClick={handleAdicionarProfissional}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus size={14} /> Adicionar
          </button>
        </div>

        {profissionaisPorEquipe.length === 0 ? (
          <p className="mt-4 text-center text-xs text-slate-400">
            Nenhum profissional cadastrado ainda.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {profissionaisPorEquipe.map(([eq, lista]) => (
              <div key={eq}>
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  {eq} · {lista.length}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {lista.map((p) => (
                    <span
                      key={p.id}
                      className="flex items-center gap-1.5 rounded-full bg-slate-100 py-1 pl-3 pr-1.5 text-xs font-medium text-slate-700"
                    >
                      {p.nome}
                      {p.funcao ? ` · ${p.funcao}` : ""}
                      <button
                        type="button"
                        onClick={() => handleExcluirProfissional(p.id)}
                        aria-label={`Remover ${p.nome}`}
                        className="flex h-4 w-4 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                      >
                        <Trash2 size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h3 className="mb-1 text-sm font-bold text-slate-900">Registrar serviço executado</h3>
        <p className="mb-3 text-xs text-slate-500">
          Cada registro vira um lançamento de RUP e um comentário pro RDO documental.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium text-slate-500">Data</span>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-500">Equipe</span>
            <select
              value={equipe}
              onChange={(e) => {
                setEquipe(e.target.value);
                setProfissionaisIds([]);
              }}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Selecione</option>
              {EQUIPES.map((eq) => (
                <option key={eq} value={eq}>
                  {eq}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="mt-3 block">
          <span className="text-xs font-medium text-slate-500">Serviço executado</span>
          <input
            type="text"
            value={servico}
            onChange={(e) => setServico(e.target.value)}
            placeholder="Ex: Fechamento de parede externa"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <div className="mt-3">
          <span className="text-xs font-medium text-slate-500">Quem está executando</span>
          {!equipe ? (
            <p className="mt-1 text-xs text-slate-400">Selecione a equipe primeiro.</p>
          ) : profissionaisDaEquipeSelecionada.length === 0 ? (
            <p className="mt-1 text-xs text-slate-400">
              Nenhum profissional cadastrado nessa equipe ainda.
            </p>
          ) : (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {profissionaisDaEquipeSelecionada.map((p) => {
                const marcado = profissionaisIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => alternarProfissionalSelecionado(p.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                      marcado
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {p.nome}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="text-xs font-medium text-slate-500">Área executada (m²)</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={areaM2}
              onChange={(e) => setAreaM2(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-500">Diárias</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.5"
              value={diarias}
              onChange={(e) => setDiarias(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-500">Preço médio da diária (R$)</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={precoDiaria}
              onChange={(e) => setPrecoDiaria(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
        </div>

        <label className="mt-3 block">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Comentário do serviço (RDO)</span>
            <button
              type="button"
              disabled={gerandoComentario}
              onClick={handleGerarComentario}
              className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline disabled:opacity-50"
            >
              {gerandoComentario ? (
                <Loader2 className="animate-spin" size={12} />
              ) : (
                <Sparkles size={12} />
              )}
              Gerar com IA
            </button>
          </div>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Descreva o serviço executado, ou gere com IA a partir dos dados acima"
            rows={3}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <button
          type="button"
          disabled={salvandoRegistro}
          onClick={handleSalvarRegistro}
          className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {salvandoRegistro ? "Salvando..." : "Salvar registro"}
        </button>
      </Card>

      {rupPorProfissional.length > 0 && (
        <Card>
          <h3 className="mb-3 text-sm font-bold text-slate-900">RUP por profissional</h3>
          <div className="space-y-2.5">
            {rupPorProfissional
              .filter((r) => r.totalDiarias > 0)
              .map((r) => (
                <div
                  key={r.profissional.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {r.profissional.nome}
                    </p>
                    <p className="text-xs text-slate-500">{r.profissional.equipe}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-slate-900">
                      {r.rup.toFixed(3)}{" "}
                      <span className="text-xs font-normal text-slate-400">diária/m²</span>
                    </p>
                    <p className="text-xs text-slate-500">
                      {r.totalDiarias.toFixed(1)} diárias · {r.totalAreaM2.toFixed(1)} m² ·{" "}
                      {formatarMoeda(r.custoTotal)}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}

      <Card className="p-0">
        <div className="p-5 pb-0">
          <h3 className="mb-1 text-sm font-bold text-slate-900">
            Histórico de registros · {obraNome}
          </h3>
        </div>
        {registros.length === 0 ? (
          <p className="p-5 text-center text-xs text-slate-400">
            Nenhum registro de RDO salvo ainda.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {registros.map((r) => {
              const nomes = profissionais
                .filter((p) => r.profissionaisIds.includes(p.id))
                .map((p) => p.nome);
              const custoTotal = r.diarias * r.precoDiaria;
              return (
                <div key={r.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="default">{r.equipe}</Badge>
                        <span className="text-xs text-slate-400">{formatarDataBr(r.data)}</span>
                      </div>
                      <p className="mt-1 text-sm font-bold text-slate-900">{r.servico}</p>
                      {nomes.length > 0 && (
                        <p className="mt-0.5 text-xs text-slate-500">{nomes.join(", ")}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleExcluirRegistro(r.id)}
                      aria-label="Excluir registro"
                      className="shrink-0 rounded-lg border border-red-200 bg-white p-1.5 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {r.areaM2} m² · {r.diarias} diária(s) · {formatarMoeda(r.precoDiaria)}/diária ·{" "}
                    {formatarMoeda(custoTotal)} total
                  </p>
                  {r.comentario && (
                    <p className="mt-2 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600">
                      {r.comentario}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
