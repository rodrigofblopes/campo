"use client";

import { useMemo, useState } from "react";
import { Camera, Plus, Send, X } from "lucide-react";
import { AppShell, Badge, Card, PageHeader } from "@/components/ui";
import { HorizontalScrollTabs, HorizontalTab } from "@/components/HorizontalScrollTabs";
import { useObra } from "@/context/ObraContext";
import { gerarPDFVistoria, nomeArquivoVistoria } from "@/lib/pdf-vistoria";
import {
  contarPendencias,
  getVistorias,
  salvarNovaVistoria,
  atualizarVistoria,
} from "@/lib/vistoria-storage";
import type {
  PendenciaVistoria,
  StatusPendencia,
  VistoriaObra,
} from "@/lib/vistoria-types";
import { statusEfetivo } from "@/lib/vistoria-types";

function novoId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function novaPendenciaDraft(): PendenciaVistoria {
  return {
    id: novoId(),
    local: "",
    responsavel: "",
    prioridade: "Média",
    prazo: "",
    descricao: "",
    foto: null,
    status: "Pendente",
    fotoDepois: null,
    concluidoEm: null,
  };
}

function lerArquivoComoDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function badgeVariant(status: string): "default" | "success" | "warning" | "danger" {
  if (status === "Concluído") return "success";
  if (status === "Atrasado") return "danger";
  if (status === "Em execução") return "default";
  return "warning";
}

async function compartilharVistoria(vistoria: VistoriaObra) {
  const doc = gerarPDFVistoria(vistoria);
  const fileName = nomeArquivoVistoria(vistoria);
  const blob = doc.output("blob");
  const file = new File([blob], fileName, { type: "application/pdf" });

  const resumo = vistoria.itens
    .map(
      (it, i) =>
        `${i + 1}. ${it.local} - ${it.descricao} (prazo: ${it.prazo ? it.prazo.split("-").reverse().join("/") : "a definir"})`
    )
    .join("\n");
  const texto = `Vistoria de obra - ${vistoria.obraNome}\n${vistoria.itens.length} pendência(s):\n${resumo}`;

  const nav = navigator as Navigator & {
    canShare?: (data?: ShareData) => boolean;
    share?: (data: ShareData) => Promise<void>;
  };

  if (nav.canShare && nav.share && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: "Vistoria de Obra", text: texto });
      return;
    } catch {
      // usuário cancelou o compartilhamento — cai no fallback abaixo
    }
  }

  doc.save(fileName);
  window.open(
    `https://wa.me/?text=${encodeURIComponent(texto + "\n\n(anexe o PDF baixado)")}`,
    "_blank"
  );
}

export default function VistoriaPage() {
  const { obraId, obraMeta } = useObra();
  const [aba, setAba] = useState<"nova" | "historico">("nova");

  // ---- formulário de nova vistoria ----
  const [responsavelVistoria, setResponsavelVistoria] = useState("");
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [itens, setItens] = useState<PendenciaVistoria[]>([novaPendenciaDraft()]);
  const [salvando, setSalvando] = useState(false);

  // ---- histórico ----
  const [vistorias, setVistorias] = useState<VistoriaObra[]>(() => getVistorias(obraId));
  const [abertoId, setAbertoId] = useState<string | null>(null);

  function abrirHistorico() {
    setVistorias(getVistorias(obraId));
    setAba("historico");
  }

  const contadores = useMemo(() => contarPendencias(vistorias), [vistorias]);

  function atualizarItem(id: string, patch: Partial<PendenciaVistoria>) {
    setItens((lista) => lista.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  function removerItem(id: string) {
    setItens((lista) => lista.filter((it) => it.id !== id));
  }

  async function onFoto(id: string, file: File | undefined) {
    if (!file) return;
    const dataUrl = await lerArquivoComoDataUrl(file);
    atualizarItem(id, { foto: dataUrl });
  }

  function validar(): string | null {
    if (itens.length === 0) return "Adicione ao menos uma pendência.";
    for (const it of itens) {
      if (!it.local.trim() || !it.descricao.trim()) {
        return "Preencha local e descrição de cada pendência.";
      }
    }
    return null;
  }

  function montarVistoria(): VistoriaObra {
    return {
      id: novoId(),
      obraId,
      obraNome: obraMeta.nome,
      responsavelVistoria,
      data,
      criadoEm: new Date().toISOString(),
      itens,
    };
  }

  function limparFormulario() {
    setItens([novaPendenciaDraft()]);
    setResponsavelVistoria("");
    setData(new Date().toISOString().slice(0, 10));
  }

  async function handleGerarPdf() {
    const erro = validar();
    if (erro) return alert(erro);
    setSalvando(true);
    try {
      const vistoria = montarVistoria();
      const doc = gerarPDFVistoria(vistoria);
      doc.save(nomeArquivoVistoria(vistoria));
      salvarNovaVistoria(obraId, vistoria);
      limparFormulario();
      setVistorias(getVistorias(obraId));
      setAba("historico");
    } finally {
      setSalvando(false);
    }
  }

  async function handleEnviarWhatsApp() {
    const erro = validar();
    if (erro) return alert(erro);
    setSalvando(true);
    try {
      const vistoria = montarVistoria();
      salvarNovaVistoria(obraId, vistoria);
      await compartilharVistoria(vistoria);
      limparFormulario();
      setVistorias(getVistorias(obraId));
      setAba("historico");
    } finally {
      setSalvando(false);
    }
  }

  function handleUpdateStatus(vistoriaId: string, itemId: string, status: StatusPendencia) {
    const vistoria = vistorias.find((v) => v.id === vistoriaId);
    if (!vistoria) return;
    const atualizada: VistoriaObra = {
      ...vistoria,
      itens: vistoria.itens.map((it) =>
        it.id === itemId
          ? {
              ...it,
              status,
              concluidoEm: status === "Concluído" ? new Date().toISOString() : null,
            }
          : it
      ),
    };
    atualizarVistoria(obraId, atualizada);
    setVistorias((lista) => lista.map((v) => (v.id === vistoriaId ? atualizada : v)));
  }

  async function handleFotoConclusao(vistoriaId: string, itemId: string, file: File | undefined) {
    if (!file) return;
    const dataUrl = await lerArquivoComoDataUrl(file);
    const vistoria = vistorias.find((v) => v.id === vistoriaId);
    if (!vistoria) return;
    const atualizada: VistoriaObra = {
      ...vistoria,
      itens: vistoria.itens.map((it) =>
        it.id === itemId
          ? {
              ...it,
              fotoDepois: dataUrl,
              status: "Concluído",
              concluidoEm: new Date().toISOString(),
            }
          : it
      ),
    };
    atualizarVistoria(obraId, atualizada);
    setVistorias((lista) => lista.map((v) => (v.id === vistoriaId ? atualizada : v)));
  }

  return (
    <AppShell>
      <PageHeader
        title="Vistoria de Obra"
        description="Registre pendências com foto, prazo e responsável — e envie o PDF por WhatsApp para quem vai executar."
      />

      <HorizontalScrollTabs className="mb-5">
        <HorizontalTab active={aba === "nova"} onClick={() => setAba("nova")}
          className={aba === "nova" ? "bg-blue-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}>
          Nova vistoria
        </HorizontalTab>
        <HorizontalTab active={aba === "historico"} onClick={abrirHistorico}
          className={aba === "historico" ? "bg-blue-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}>
          Histórico
        </HorizontalTab>
      </HorizontalScrollTabs>

      {aba === "nova" && (
        <>
          <Card className="mb-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-medium text-slate-500">Responsável pela vistoria</span>
                <input
                  type="text"
                  value={responsavelVistoria}
                  onChange={(e) => setResponsavelVistoria(e.target.value)}
                  placeholder="Seu nome"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-slate-500">Data</span>
                <input
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
            </div>
            <p className="mt-3 text-xs text-slate-400">Obra: {obraMeta.nome}</p>
          </Card>

          <div className="space-y-4">
            {itens.map((item, idx) => (
              <Card key={item.id}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Pendência {idx + 1}</h3>
                  {itens.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removerItem(item.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 ring-1 ring-slate-200 hover:bg-slate-100"
                      aria-label="Remover pendência"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-medium text-slate-500">Local / Ambiente</span>
                    <input
                      type="text"
                      value={item.local}
                      onChange={(e) => atualizarItem(item.id, { local: e.target.value })}
                      placeholder="Ex: Banheiro suíte"
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-slate-500">Responsável</span>
                    <input
                      type="text"
                      value={item.responsavel}
                      onChange={(e) => atualizarItem(item.id, { responsavel: e.target.value })}
                      placeholder="Quem resolve"
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </label>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-medium text-slate-500">Prioridade</span>
                    <select
                      value={item.prioridade}
                      onChange={(e) =>
                        atualizarItem(item.id, {
                          prioridade: e.target.value as PendenciaVistoria["prioridade"],
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="Baixa">Baixa</option>
                      <option value="Média">Média</option>
                      <option value="Alta">Alta</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-slate-500">Prazo</span>
                    <input
                      type="date"
                      value={item.prazo}
                      onChange={(e) => atualizarItem(item.id, { prazo: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </label>
                </div>

                <label className="mt-3 block">
                  <span className="text-xs font-medium text-slate-500">O que está errado</span>
                  <textarea
                    value={item.descricao}
                    onChange={(e) => atualizarItem(item.id, { descricao: e.target.value })}
                    placeholder="Descreva a pendência"
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </label>

                <div className="mt-3">
                  <span className="text-xs font-medium text-slate-500">Foto</span>
                  {item.foto && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.foto}
                      alt="Foto da pendência"
                      className="mt-2 max-h-40 w-full rounded-lg object-cover"
                    />
                  )}
                  <label className="mt-2 flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
                    <Camera size={16} />
                    {item.foto ? "Trocar foto" : "Tirar / escolher foto"}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => onFoto(item.id, e.target.files?.[0])}
                    />
                  </label>
                </div>
              </Card>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setItens((lista) => [...lista, novaPendenciaDraft()])}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-300 py-3 text-sm font-bold text-blue-600 hover:bg-blue-50"
          >
            <Plus size={16} /> Adicionar pendência
          </button>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={salvando}
              onClick={handleGerarPdf}
              className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Gerar PDF
            </button>
            <button
              type="button"
              disabled={salvando}
              onClick={handleEnviarWhatsApp}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Send size={16} /> Enviar WhatsApp
            </button>
          </div>
        </>
      )}

      {aba === "historico" && (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card className="py-3 text-center">
              <div className="text-xl font-black text-amber-600">{contadores.pendente}</div>
              <div className="text-[11px] uppercase tracking-wide text-slate-500">Pendentes</div>
            </Card>
            <Card className="py-3 text-center">
              <div className="text-xl font-black text-blue-600">{contadores.execucao}</div>
              <div className="text-[11px] uppercase tracking-wide text-slate-500">Em execução</div>
            </Card>
            <Card className="py-3 text-center">
              <div className="text-xl font-black text-emerald-600">{contadores.concluido}</div>
              <div className="text-[11px] uppercase tracking-wide text-slate-500">Concluídas</div>
            </Card>
            <Card className="py-3 text-center">
              <div className="text-xl font-black text-red-600">{contadores.atrasado}</div>
              <div className="text-[11px] uppercase tracking-wide text-slate-500">Atrasadas</div>
            </Card>
          </div>

          {vistorias.length === 0 ? (
            <Card className="py-10 text-center text-sm text-slate-500">
              Nenhuma vistoria registrada ainda para esta obra.
            </Card>
          ) : (
            <div className="space-y-3">
              {vistorias.map((v) => {
                const concluidas = v.itens.filter((it) => it.status === "Concluído").length;
                const aberto = abertoId === v.id;
                return (
                  <Card key={v.id} className="p-0">
                    <button
                      type="button"
                      onClick={() => setAbertoId(aberto ? null : v.id)}
                      className="flex w-full items-start justify-between gap-3 p-4 text-left"
                    >
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          {v.data.split("-").reverse().join("/")} · {v.responsavelVistoria || "-"}
                        </h3>
                        <p className="mt-0.5 text-xs text-slate-500">
                          <span className="font-semibold text-blue-600">
                            {concluidas}/{v.itens.length}
                          </span>{" "}
                          pendência(s) concluída(s)
                        </p>
                      </div>
                    </button>

                    <div className="flex gap-2 px-4 pb-4">
                      <button
                        type="button"
                        onClick={() => {
                          const doc = gerarPDFVistoria(v);
                          doc.save(nomeArquivoVistoria(v));
                        }}
                        className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        Gerar PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => compartilharVistoria(v)}
                        className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700"
                      >
                        Enviar WhatsApp
                      </button>
                    </div>

                    {aberto && (
                      <div className="space-y-2 border-t border-slate-100 p-4">
                        {v.itens.map((item) => {
                          const hoje = new Date().toISOString().slice(0, 10);
                          const status = statusEfetivo(item, hoje);
                          return (
                            <div key={item.id} className="rounded-lg bg-slate-50 p-3">
                              <div className="flex items-center justify-between gap-2">
                                <strong className="text-sm text-slate-900">{item.local || "Pendência"}</strong>
                                <Badge variant={badgeVariant(status)}>{status}</Badge>
                              </div>
                              <p className="mt-1 text-xs text-slate-500">{item.descricao}</p>
                              <p className="mt-1 text-xs text-slate-400">
                                Prazo: {item.prazo ? item.prazo.split("-").reverse().join("/") : "-"} · Responsável:{" "}
                                {item.responsavel || "-"}
                              </p>
                              {(item.foto || item.fotoDepois) && (
                                <div className="mt-2 flex gap-2">
                                  {item.foto && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={item.foto} alt="Antes" className="h-16 w-16 rounded-lg object-cover" />
                                  )}
                                  {item.fotoDepois && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={item.fotoDepois}
                                      alt="Depois"
                                      className="h-16 w-16 rounded-lg object-cover"
                                    />
                                  )}
                                </div>
                              )}
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <select
                                  value={item.status}
                                  onChange={(e) =>
                                    handleUpdateStatus(v.id, item.id, e.target.value as StatusPendencia)
                                  }
                                  className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
                                >
                                  <option value="Pendente">Pendente</option>
                                  <option value="Em execução">Em execução</option>
                                  <option value="Concluído">Concluído</option>
                                </select>
                                <label className="cursor-pointer rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100">
                                  Foto de conclusão
                                  <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    className="hidden"
                                    onChange={(e) => handleFotoConclusao(v.id, item.id, e.target.files?.[0])}
                                  />
                                </label>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
