import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { PendenciaVistoria } from "./vistoria-types";
import { statusEfetivo } from "./vistoria-types";

const URL_BASE = "https://campo-one.vercel.app";

export interface DiaSemanaPcp {
  nome: string;
  iso: string;
  diaMes: string;
}

export interface DadosPcp {
  obraId: string;
  obraNome: string;
  /** Segunda a domingo da semana em exibição, já calculados pela tela de PCP. */
  dias: DiaSemanaPcp[];
  /** Todas as pendências de todas as vistorias da obra (o filtro por semana é feito aqui dentro). */
  itens: PendenciaVistoria[];
}

function formatarDataCompleta(iso: string): string {
  if (!iso) return "-";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function slugify(texto: string): string {
  return (texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Rótulo da semana pro cabeçalho e nome do arquivo, ex.: "10/08 a 16/08/2026". */
export function periodoSemanaPcp(dias: DiaSemanaPcp[]): string {
  if (dias.length === 0) return "-";
  const primeiro = dias[0];
  const ultimo = dias[dias.length - 1];
  const ano = ultimo.iso.slice(0, 4);
  return `${primeiro.diaMes} a ${ultimo.diaMes}/${ano}`;
}

// "Previsto" é posicionado pela data de início — pendências antigas sem
// início preenchido caem pelo prazo, pra não sumir da grade.
function itensPrevistosNoDia(itens: PendenciaVistoria[], dia: DiaSemanaPcp): PendenciaVistoria[] {
  return itens.filter((it) => (it.inicioPrevisto || it.prazo) === dia.iso);
}

// "Conclusão" é posicionado pelo prazo (data planejada de entrega) — não
// pela data real em que foi marcado Concluído, então também aparece o que
// ainda está em aberto com entrega prevista para o dia.
function itensConclusaoNoDia(itens: PendenciaVistoria[], dia: DiaSemanaPcp): PendenciaVistoria[] {
  return itens.filter((it) => it.prazo === dia.iso);
}

function descricaoItem(it: PendenciaVistoria): string {
  const base = it.local || it.descricao || "Pendência";
  return it.equipe ? `${base} (${it.equipe})` : base;
}

function descricaoItemConclusao(it: PendenciaVistoria): string {
  const sufixo = it.status === "Concluído" ? " — Concluído" : " — em aberto";
  return `${descricaoItem(it)}${sufixo}`;
}

/**
 * Gera o PDF executivo do PCP Semanal — pensado para a diretoria: um
 * resumo com os números da semana (previsto x realizado x atrasado) logo
 * no topo, seguido da grade dia a dia e de um fechamento por equipe.
 */
export function gerarPDFPcp({ obraNome, dias, itens }: DadosPcp): jsPDF {
  const doc = new jsPDF();
  const margem = 14;
  const pageW = doc.internal.pageSize.getWidth();
  const hoje = new Date().toISOString().slice(0, 10);
  let y = 20;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("PCP Semanal", margem, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(110);
  doc.text(`Campo · Steel Frame · Gerado em ${new Date().toLocaleDateString("pt-BR")}`, margem, y);
  doc.setTextColor(0);
  y += 8;
  doc.setDrawColor(200);
  doc.line(margem, y, pageW - margem, y);
  y += 9;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Obra:", margem, y);
  doc.setFont("helvetica", "normal");
  doc.text(obraNome || "-", margem + 15, y);
  y += 6.5;
  doc.setFont("helvetica", "bold");
  doc.text("Semana:", margem, y);
  doc.setFont("helvetica", "normal");
  doc.text(periodoSemanaPcp(dias), margem + 20, y);
  y += 10;

  const previstosSemana = dias.flatMap((d) => itensPrevistosNoDia(itens, d));
  const comPrazoNaSemana = dias.flatMap((d) => itensConclusaoNoDia(itens, d));
  const concluidosNaSemana = comPrazoNaSemana.filter((it) => it.status === "Concluído");
  const atrasadosSemana = comPrazoNaSemana.filter((it) => statusEfetivo(it, hoje) === "Atrasado");
  const totalComPrazo = comPrazoNaSemana.length;
  const pctConclusao = totalComPrazo > 0 ? Math.round((concluidosNaSemana.length / totalComPrazo) * 100) : 0;

  const kpis: [string, string][] = [
    ["Início previsto na semana", String(previstosSemana.length)],
    ["Conclusão prevista na semana", String(totalComPrazo)],
    ["Concluídas no prazo", String(concluidosNaSemana.length)],
    ["Atrasadas", String(atrasadosSemana.length)],
    ["Conclusão da semana", `${pctConclusao}%`],
  ];

  autoTable(doc, {
    startY: y,
    body: [kpis.map(([, v]) => v)],
    head: [kpis.map(([k]) => k)],
    styles: { fontSize: 10, cellPadding: 4, halign: "center" },
    headStyles: { fillColor: [30, 64, 120], halign: "center" },
    margin: { left: margem, right: margem },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Grade da semana", margem, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [["Dia", "Data", "Previsto (início)", "Conclusão (prazo)"]],
    body: dias.map((dia) => [
      dia.nome,
      dia.diaMes,
      itensPrevistosNoDia(itens, dia).map(descricaoItem).join("\n") || "-",
      itensConclusaoNoDia(itens, dia).map(descricaoItemConclusao).join("\n") || "-",
    ]),
    styles: { fontSize: 8, cellPadding: 2.5, valign: "top" },
    headStyles: { fillColor: [30, 64, 120] },
    columnStyles: { 0: { cellWidth: 22 }, 1: { cellWidth: 20 } },
    margin: { left: margem, right: margem },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  const mapaEquipes = new Map<string, { previstas: number; concluidas: number }>();
  for (const it of comPrazoNaSemana) {
    const equipe = it.equipe && it.equipe.trim() ? it.equipe : "Sem equipe definida";
    const atual = mapaEquipes.get(equipe) ?? { previstas: 0, concluidas: 0 };
    atual.previstas += 1;
    if (it.status === "Concluído") atual.concluidas += 1;
    mapaEquipes.set(equipe, atual);
  }
  const equipesOrdenadas = Array.from(mapaEquipes.entries()).sort((a, b) => b[1].previstas - a[1].previstas);

  if (equipesOrdenadas.length > 0) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Fechamento por equipe (conclusão prevista na semana)", margem, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [["Equipe", "Com prazo na semana", "Concluídas", "Em aberto"]],
      body: equipesOrdenadas.map(([equipe, { previstas, concluidas }]) => [
        equipe,
        String(previstas),
        String(concluidas),
        String(previstas - concluidas),
      ]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [30, 64, 120] },
      margin: { left: margem, right: margem },
    });

    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  if (atrasadosSemana.length > 0) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(185, 28, 28);
    doc.text("Atenção — pendências atrasadas", margem, y);
    doc.setTextColor(0);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [["Local", "Equipe", "Responsável", "Prazo"]],
      body: atrasadosSemana.map((it) => [
        it.local || it.descricao || "-",
        it.equipe || "-",
        it.responsavel || "-",
        formatarDataCompleta(it.prazo),
      ]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [185, 28, 28] },
      margin: { left: margem, right: margem },
    });
  }

  return doc;
}

export function nomeArquivoPcp(obraNome: string, dias: DiaSemanaPcp[]): string {
  const slugObra = slugify(obraNome || "obra");
  const primeiraData = dias[0]?.iso ?? "sem-data";
  return `pcp-semanal-${slugObra}-${primeiraData}.pdf`;
}

/**
 * Compartilha o PDF do PCP Semanal via Web Share API (abre direto o
 * seletor de apps do celular, incluindo WhatsApp, pronto para mandar pra
 * diretoria). Se o navegador não suportar compartilhar arquivos, baixa o
 * PDF e abre o WhatsApp Web com um texto avisando para anexar o PDF
 * baixado.
 */
export async function compartilharPcp(dados: DadosPcp): Promise<void> {
  const doc = gerarPDFPcp(dados);
  const fileName = nomeArquivoPcp(dados.obraNome, dados.dias);
  const blob = doc.output("blob");
  const file = new File([blob], fileName, { type: "application/pdf" });

  const texto = `PCP Semanal — ${dados.obraNome}\nSemana de ${periodoSemanaPcp(dados.dias)}\n${URL_BASE}/obras/${dados.obraId}/pcp`;

  const nav = navigator as Navigator & {
    canShare?: (data?: ShareData) => boolean;
    share?: (data: ShareData) => Promise<void>;
  };

  if (nav.canShare && nav.share && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: "PCP Semanal", text: texto });
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
