"use client";

import { useEffect, useMemo, useState } from "react";
import { Camera, ChevronLeft, ChevronRight, Plus, Send, Trash2, X } from "lucide-react";
import { Badge, Card, PageHeader } from "@/components/ui";
import { HorizontalScrollTabs, HorizontalTab } from "@/components/HorizontalScrollTabs";
import { gerarPDFVistoria, nomeArquivoVistoria } from "@/lib/pdf-vistoria";
import { compartilharImagemVistoria, compartilharImagemFiltrada } from "@/lib/image-vistoria";
import {
  contarPendencias,
  getVistorias,
  salvarNovaVistoria,
  atualizarVistoria,
  excluirVistoria,
} from "@/lib/vistoria-storage";
import type {
  PendenciaVistoria,
  StatusPendencia,
  VistoriaObra,
} from "@/lib/vistoria-types";
import { EQUIPES, statusEfetivo } from "@/lib/vistoria-types";
import type { ObraMeta } from "@/lib/obras";

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
    equipe: "",
    prioridade: "Média",
    prazo: "",
    descricao: "",
    foto: null,
    status: "Pendente",
    fotoDepois: null,
    concluidoEm: null,
  };
}

function lerArquivoComoDataUrlBruto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Corrige a rotação EXIF da foto (comum em celulares) e reduz o tamanho,
// desenhando a imagem já orientada corretamente em um canvas.
async function lerArquivoComoDataUrl(file: File): Promise<string> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const maxDim = 1600;
    let largura = bitmap.width;
    let altura = bitmap.height;
    if (largura > maxDim || altura > maxDim) {
      const escala = maxDim / Math.max(largura, altura);
      largura = Math.round(largura * escala);
      altura = Math.round(altura * escala);
    }
    const canvas = document.createElement("canvas");
    canvas.width = largura;
    canvas.height = altura;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("sem contexto 2d");
    ctx.drawImage(bitmap, 0, 0, largura, altura);
    bitmap.close();
    return canvas.toDataURL("image/jpeg", 0.85);
  } catch {
    return lerArquivoComoDataUrlBruto(file);
  }
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

export function VistoriaContent({
  obraId,
  obraMeta,
}: {
  obraId: string;
  obraMeta: ObraMeta;
}) {
  const [aba, setAba] = useState<"nova" | "historico" | "pcp">("nova");

  // ---- formulário de nova vistoria ----
  const [responsavelVistoria, setResponsavelVistoria] = useState("");
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [itens, setItens] = useState<PendenciaVistoria[]>([novaPendenciaDraft()]);
  const [salvando, setSalvando] = useState(false);

  // ---- histórico ----
  const [vistorias, setVistorias] = useState<VistoriaObra[]>([]);
  const [abertoId, setAbertoId] = useState<string | null>(null);
  const [filtroEquipe, setFiltroEquipe] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");

  // ---- PCP semanal ----
  const [semanaOffset, setSemanaOffset] = useState(0);
  const [itemSelecionado, setItemSelecionado] = useState<PendenciaVistoria | null>(null);

  useEffect(() => {
    let ativo = true;
    getVistorias(obraId).then((lista) => {
      if (ativo) setVistorias(lista);
    });
    return () => {
      ativo = false;
    };
  }, [obraId]);

  async function abrirHistorico() {
    setAba("historico");
    const lista = await getVistorias(obraId);
    setVistorias(lista);
  }

  const contadores = useMemo(() => contarPendencias(vistorias), [vistorias]);

  // Aplica os filtros de equipe/situação por pendência: cada vistoria só
  // aparece se tiver pelo menos uma pendência que bate com os filtros, e
  // o card mostra só as pendências filtradas (não a vistoria inteira).
  const filtroAtivo = Boolean(filtroEquipe || filtroStatus);
  const vistoriasFiltradas = useMemo(() => {
    const hoje = new Date().toISOString().slice(0, 10);
    return vistorias
      .map((v) => {
        const itensExibidos = filtroAtivo
          ? v.itens.filter((it) => {
              const statusEf = statusEfetivo(it, hoje);
              const bateEquipe = !filtroEquipe || it.equipe === filtroEquipe;
              const bateStatus = !filtroStatus || statusEf === filtroStatus;
              return bateEquipe && bateStatus;
            })
          : v.itens;
        return { vistoria: v, itensExibidos };
      })
      .filter(({ itensExibidos }) => !filtroAtivo || itensExibidos.length > 0);
  }, [vistorias, filtroEquipe, filtroStatus, filtroAtivo]);

  // Todas as pendências que batem com o filtro atual, de todas as
  // vistorias juntas — usada para mandar uma única imagem com o recorte
  // que está sendo visto no histórico (equipe e/ou situação).
  const itensFiltradosGlobal = useMemo(
    () => vistoriasFiltradas.flatMap(({ itensExibidos }) => itensExibidos),
    [vistoriasFiltradas]
  );

  // Quantas pendências em aberto (não concluídas) cada equipe tem agora,
  // somando todas as vistorias — ajuda a balancear o time e decidir quem
  // chamar primeiro.
  const cargaEquipes = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const v of vistorias) {
      for (const it of v.itens) {
        if (it.status !== "Concluído" && it.equipe) {
          mapa.set(it.equipe, (mapa.get(it.equipe) || 0) + 1);
        }
      }
    }
    return Array.from(mapa.entries())
      .map(([equipe, total]) => ({ equipe, total }))
      .sort((a, b) => b.total - a.total);
  }, [vistorias]);

  const hojeISO = new Date().toISOString().slice(0, 10);

  // Segunda a domingo da semana selecionada (0 = semana atual).
  const diasSemana = useMemo(() => {
    const hoje = new Date();
    const diaSemanaAtual = hoje.getDay(); // 0 = domingo
    const deltaParaSegunda = diaSemanaAtual === 0 ? -6 : 1 - diaSemanaAtual;
    const segunda = new Date(hoje);
    segunda.setHours(0, 0, 0, 0);
    segunda.setDate(segunda.getDate() + deltaParaSegunda + semanaOffset * 7);
    const nomes = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];
    return nomes.map((nome, i) => {
      const d = new Date(segunda);
      d.setDate(segunda.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      const diaMes = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
      return { nome, iso, diaMes };
    });
  }, [semanaOffset]);

  // Pendências de todas as vistorias, achatadas — cada tarefa cai no dia da
  // semana do seu prazo (Previsto) e, se já concluída, no dia em que foi
  // marcada como Concluído (Realizado).
  const todosItens = useMemo(() => {
    return vistorias.flatMap((v) => v.itens);
  }, [vistorias]);

  const temItemNaSemana = diasSemana.some((dia) =>
    todosItens.some((it) => it.prazo === dia.iso)
  );

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

  async function handleEnviarWhatsApp(formato: "pdf" | "imagem") {
    const erro = validar();
    if (erro) return alert(erro);
    setSalvando(true);
    try {
      const vistoria = montarVistoria();
      const salvo = await salvarNovaVistoria(obraId, vistoria);
      if (!salvo)
        alert(
          "Sem conexão agora — vamos tentar salvar no histórico automaticamente depois. O envio será feito normalmente."
        );
      if (formato === "pdf") {
        await compartilharVistoria(vistoria);
      } else {
        await compartilharImagemVistoria(vistoria);
      }
      limparFormulario();
      setVistorias(await getVistorias(obraId));
      setAba("historico");
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluirVistoria(vistoriaId: string) {
    if (!window.confirm("Excluir esta vistoria? Essa ação não pode ser desfeita.")) return;
    const ok = await excluirVistoria(vistoriaId);
    if (!ok) {
      alert("Não foi possível excluir agora. Verifique a conexão e tente novamente.");
      return;
    }
    setVistorias((lista) => lista.filter((v) => v.id !== vistoriaId));
    setAbertoId((atual) => (atual === vistoriaId ? null : atual));
  }

  async function handleUpdateStatus(vistoriaId: string, itemId: string, status: StatusPendencia) {
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
    setVistorias((lista) => lista.map((v) => (v.id === vistoriaId ? atualizada : v)));
    await atualizarVistoria(obraId, atualizada);
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
    setVistorias((lista) => lista.map((v) => (v.id === vistoriaId ? atualizada : v)));
    await atualizarVistoria(obraId, atualizada);
  }

  return (
    <>
      <PageHeader
        title="Vistoria de Obra"
        description="Registre pendências com foto, prazo e responsável — e envie a Atividade por WhatsApp para quem vai executar."
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
        <HorizontalTab active={aba === "pcp"} onClick={() => setAba("pcp")}
          className={aba === "pcp" ? "bg-blue-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}>
          PCP Semanal
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

                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <label className="block">
                    <span className="text-xs font-medium text-slate-500">Equipe</span>
                    <select
                      value={item.equipe || ""}
                      onChange={(e) => atualizarItem(item.id, { equipe: e.target.value })}
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

          <div className="mt-5">
            <p className="mb-2 text-xs font-medium text-slate-500">Enviar por WhatsApp como:</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                disabled={salvando}
                onClick={() => handleEnviarWhatsApp("pdf")}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <Send size={16} /> PDF
              </button>
              <button
                type="button"
                disabled={salvando}
                onClick={() => handleEnviarWhatsApp("imagem")}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Send size={16} /> Imagem
              </button>
            </div>
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

          {cargaEquipes.length > 0 && (
            <Card className="mb-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Carga por equipe · pendências em aberto
              </p>
              <div className="space-y-2.5">
                {cargaEquipes.map(({ equipe, total }) => (
                  <div key={equipe}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">{equipe}</span>
                      <span className="font-bold text-slate-900">{total}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{ width: `${Math.max(8, (total / cargaEquipes[0].total) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {vistorias.length > 0 && (
            <div className="mb-4 grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-medium text-slate-500">Filtrar por equipe</span>
                <select
                  value={filtroEquipe}
                  onChange={(e) => setFiltroEquipe(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">Todas as equipes</option>
                  {EQUIPES.map((eq) => (
                    <option key={eq} value={eq}>
                      {eq}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-medium text-slate-500">Filtrar por situação</span>
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">Todas as situações</option>
                  <option value="Pendente">Pendente</option>
                  <option value="Em execução">Em execução</option>
                  <option value="Concluído">Concluído</option>
                  <option value="Atrasado">Atrasado</option>
                </select>
              </label>
            </div>
          )}

          {itensFiltradosGlobal.length > 0 && (
            <button
              type="button"
              onClick={() =>
                compartilharImagemFiltrada(obraMeta.nome, itensFiltradosGlobal, filtroEquipe, filtroStatus)
              }
              className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700"
            >
              <Send size={16} />
              WhatsApp (Imagem) · {itensFiltradosGlobal.length} tarefa{itensFiltradosGlobal.length > 1 ? "s" : ""}
              {filtroAtivo ? " filtrada" + (itensFiltradosGlobal.length > 1 ? "s" : "") : ""}
            </button>
          )}

          {vistorias.length === 0 ? (
            <Card className="py-10 text-center text-sm text-slate-500">
              Nenhuma vistoria registrada ainda para esta obra.
            </Card>
          ) : vistoriasFiltradas.length === 0 ? (
            <Card className="py-10 text-center text-sm text-slate-500">
              Nenhuma atividade encontrada com esse filtro.
            </Card>
          ) : (
            <div className="space-y-3">
              {vistoriasFiltradas.map(({ vistoria: v, itensExibidos }) => {
                const concluidas = itensExibidos.filter((it) => it.status === "Concluído").length;
                const aberto = abertoId === v.id;
                const hoje = new Date().toISOString().slice(0, 10);
                const locais = itensExibidos.map((it) => it.local || "Pendência");
                const equipesUnicas = Array.from(
                  new Set(v.itens.map((it) => it.equipe).filter((eq): eq is string => Boolean(eq)))
                );
                const temAtrasado = itensExibidos.some((it) => statusEfetivo(it, hoje) === "Atrasado");
                return (
                  <Card key={v.id} className="p-0">
                    <button
                      type="button"
                      onClick={() => setAbertoId(aberto ? null : v.id)}
                      className="flex w-full items-start justify-between gap-3 p-4 text-left"
                    >
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-900">
                          {v.data.split("-").reverse().join("/")} · {v.responsavelVistoria || "-"}
                        </h3>
                        <p className="mt-0.5 text-xs text-slate-500">
                          <span className="font-semibold text-blue-600">
                            {concluidas}/{itensExibidos.length}
                          </span>{" "}
                          pendência(s) concluída(s)
                        </p>
                        {locais.length > 0 && (
                          <p className="mt-1 truncate text-xs text-slate-600">{locais.join(" · ")}</p>
                        )}
                        {(equipesUnicas.length > 0 || temAtrasado) && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {temAtrasado && <Badge variant="danger">Atrasado</Badge>}
                            {equipesUnicas.map((eq) => (
                              <Badge key={eq} variant="default">
                                {eq}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </button>

                    <div className="flex gap-2 px-4 pb-4">
                      <button
                        type="button"
                        onClick={() => compartilharVistoria(v)}
                        className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        WhatsApp (PDF)
                      </button>
                      <button
                        type="button"
                        onClick={() => compartilharImagemVistoria(v)}
                        className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700"
                      >
                        WhatsApp (Imagem)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExcluirVistoria(v.id)}
                        aria-label="Excluir vistoria"
                        className="rounded-lg border border-red-200 bg-white px-3 py-2 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {aberto && (
                      <div className="space-y-2 border-t border-slate-100 p-4">
                        {itensExibidos.map((item) => {
                          const hoje = new Date().toISOString().slice(0, 10);
                          const status = statusEfetivo(item, hoje);
                          return (
                            <div key={item.id} className="rounded-lg bg-slate-50 p-3">
                              <div className="flex items-center justify-between gap-2">
                                <strong className="text-sm text-slate-900">{item.local || "Pendência"}</strong>
                                <div className="flex gap-1">
                                  {item.equipe && <Badge variant="default">{item.equipe}</Badge>}
                                  <Badge variant={badgeVariant(status)}>{status}</Badge>
                                </div>
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

      {aba === "pcp" && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setSemanaOffset((n) => n - 1)}
              aria-label="Semana anterior"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-900">
                Semana de {diasSemana[0].diaMes} a {diasSemana[6].diaMes}
              </p>
              {semanaOffset !== 0 && (
                <button
                  type="button"
                  onClick={() => setSemanaOffset(0)}
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  Voltar para semana atual
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSemanaOffset((n) => n + 1)}
              aria-label="Próxima semana"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <Card className="overflow-x-auto p-0">
            <table className="w-full min-w-[720px] border-collapse text-xs">
              <thead>
                <tr>
                  <th className="w-24 border-b border-slate-200 p-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400" />
                  {diasSemana.map((dia) => (
                    <th
                      key={dia.iso}
                      className={`border-b border-slate-200 p-2 text-center text-[11px] font-bold uppercase tracking-wide ${
                        dia.iso === hojeISO ? "bg-blue-50 text-blue-700" : "text-slate-500"
                      }`}
                    >
                      {dia.nome}
                      <div className="text-[10px] font-medium normal-case text-slate-400">{dia.diaMes}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border-b border-slate-100 p-2 align-top text-[11px] font-bold uppercase tracking-wide text-amber-600">
                    Previsto
                  </td>
                  {diasSemana.map((dia) => {
                    const itensDia = todosItens.filter((it) => it.prazo === dia.iso);
                    return (
                      <td
                        key={dia.iso}
                        className={`border-b border-l border-slate-100 p-2 align-top ${
                          dia.iso === hojeISO ? "bg-blue-50/40" : ""
                        }`}
                      >
                        <div className="flex flex-col gap-1">
                          {itensDia.map((it) => (
                            <button
                              key={it.id}
                              type="button"
                              onClick={() => setItemSelecionado(it)}
                              title={it.local || it.descricao}
                              className="truncate rounded bg-amber-50 px-1.5 py-1 text-left text-[10px] font-medium text-amber-700 hover:bg-amber-100"
                            >
                              {it.local || it.descricao}
                            </button>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="p-2 align-top text-[11px] font-bold uppercase tracking-wide text-emerald-600">
                    Realizado
                  </td>
                  {diasSemana.map((dia) => {
                    const itensDia = todosItens.filter(
                      (it) =>
                        it.status === "Concluído" &&
                        it.concluidoEm &&
                        it.concluidoEm.slice(0, 10) === dia.iso
                    );
                    return (
                      <td
                        key={dia.iso}
                        className={`border-l border-slate-100 p-2 align-top ${
                          dia.iso === hojeISO ? "bg-blue-50/40" : ""
                        }`}
                      >
                        <div className="flex flex-col gap-1">
                          {itensDia.map((it) => (
                            <button
                              key={it.id}
                              type="button"
                              onClick={() => setItemSelecionado(it)}
                              title={it.local || it.descricao}
                              className="truncate rounded bg-emerald-50 px-1.5 py-1 text-left text-[10px] font-medium text-emerald-700 hover:bg-emerald-100"
                            >
                              {it.local || it.descricao}
                            </button>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </Card>

          {!temItemNaSemana && (
            <p className="mt-3 text-center text-xs text-slate-400">
              Nenhuma pendência com prazo nesta semana.
            </p>
          )}

          {itemSelecionado && (
            <div
              className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
              onClick={() => setItemSelecionado(null)}
            >
              <div
                className="w-full max-w-md rounded-t-2xl bg-white p-5 sm:rounded-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h3 className="text-base font-bold text-slate-900">
                    {itemSelecionado.local || "Pendência"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setItemSelecionado(null)}
                    aria-label="Fechar"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="mb-3 flex flex-wrap gap-1.5">
                  {itemSelecionado.equipe && <Badge variant="default">{itemSelecionado.equipe}</Badge>}
                  <Badge variant="default">Prioridade {itemSelecionado.prioridade}</Badge>
                  <Badge variant={badgeVariant(statusEfetivo(itemSelecionado, hojeISO))}>
                    {statusEfetivo(itemSelecionado, hojeISO)}
                  </Badge>
                </div>

                <p className="mb-3 text-sm text-slate-600">{itemSelecionado.descricao || "-"}</p>

                <div className="mb-3 space-y-1 text-xs text-slate-500">
                  <p>
                    Prazo:{" "}
                    {itemSelecionado.prazo
                      ? itemSelecionado.prazo.split("-").reverse().join("/")
                      : "a definir"}
                  </p>
                  <p>Responsável: {itemSelecionado.responsavel || "-"}</p>
                </div>

                {(itemSelecionado.foto || itemSelecionado.fotoDepois) && (
                  <div className="flex gap-2">
                    {itemSelecionado.foto && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={itemSelecionado.foto}
                        alt="Antes"
                        className="h-24 w-24 rounded-lg object-cover"
                      />
                    )}
                    {itemSelecionado.fotoDepois && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={itemSelecionado.fotoDepois}
                        alt="Depois"
                        className="h-24 w-24 rounded-lg object-cover"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
