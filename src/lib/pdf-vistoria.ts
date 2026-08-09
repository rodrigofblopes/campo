import jsPDF from "jspdf";
import type { PendenciaVistoria, VistoriaObra } from "./vistoria-types";
import { statusEfetivo } from "./vistoria-types";

function formatarData(iso: string): string {
  if (!iso) return "-";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

const DIAS_SEMANA = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

// Formata o prazo como "dd/mm/aaaa (Dia da semana)" — mesmo padrão usado no
// app, pra quem recebe o PDF já saber de cabeça em que dia da semana vence.
function formatarDataComDia(iso: string): string {
  if (!iso) return "-";
  const [y, m, d] = iso.split("-").map(Number);
  const dataBr = `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
  const data = new Date(y, m - 1, d);
  return `${dataBr} (${DIAS_SEMANA[data.getDay()]})`;
}

function checkPageBreak(doc: jsPDF, y: number, needed: number, pageH: number): number {
  if (y + needed > pageH - 15) {
    doc.addPage();
    return 20;
  }
  return y;
}

function ajustarAoBox(
  doc: jsPDF,
  dataUrl: string,
  maxW: number,
  maxH: number
): { w: number; h: number } {
  const props = doc.getImageProperties(dataUrl);
  let w = maxW;
  let h = (props.height / props.width) * w;
  if (h > maxH) {
    h = maxH;
    w = (props.width / props.height) * h;
  }
  return { w, h };
}

function responsavelComEquipe(item: PendenciaVistoria): string {
  return item.equipe ? `${item.responsavel || "-"} (${item.equipe})` : item.responsavel || "-";
}

function textoFallback(doc: jsPDF, item: PendenciaVistoria, y: number, pageW: number, margem: number): number {
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Local:", margem, y + 5);
  doc.setFont("helvetica", "normal");
  doc.text(item.local || "-", margem + 15, y + 5);
  doc.setFont("helvetica", "bold");
  doc.text("Responsável:", margem, y + 12);
  doc.setFont("helvetica", "normal");
  doc.text(responsavelComEquipe(item), margem + 27, y + 12);
  doc.setFont("helvetica", "bold");
  doc.text("Prazo:", margem, y + 19);
  doc.setFont("helvetica", "normal");
  doc.text(item.prazo ? formatarDataComDia(item.prazo) : "-", margem + 15, y + 19);
  doc.setFont("helvetica", "bold");
  doc.text("Descrição:", margem, y + 26);
  doc.setFont("helvetica", "normal");
  const linhas = doc.splitTextToSize(item.descricao || "-", pageW - margem * 2);
  doc.text(linhas, margem, y + 32);
  return y + 32 + linhas.length * 5;
}

export function gerarPDFVistoria(vistoria: VistoriaObra): jsPDF {
  const doc = new jsPDF();
  const margem = 14;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const hoje = new Date().toISOString().slice(0, 10);
  let y = 20;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Vistoria de Obra", margem, y);
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
  doc.text(vistoria.obraNome || "-", margem + 15, y);
  y += 6.5;
  doc.setFont("helvetica", "bold");
  doc.text("Responsável pela vistoria:", margem, y);
  doc.setFont("helvetica", "normal");
  doc.text(vistoria.responsavelVistoria || "-", margem + 55, y);
  y += 6.5;
  doc.setFont("helvetica", "bold");
  doc.text("Data:", margem, y);
  doc.setFont("helvetica", "normal");
  doc.text(vistoria.data ? formatarData(vistoria.data) : "-", margem + 15, y);
  y += 10;

  vistoria.itens.forEach((item, i) => {
    const estimativaAltura = item.foto ? 85 : 45;
    y = checkPageBreak(doc, y, estimativaAltura, pageH);
    doc.setFillColor(240, 240, 240);
    doc.rect(margem, y - 5, pageW - margem * 2, 8, "F");
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(
      `Pendência ${i + 1} — ${statusEfetivo(item, hoje)}${item.equipe ? ` — ${item.equipe}` : ""}`,
      margem + 2,
      y
    );
    y += 9;

    if (item.foto) {
      try {
        const maxW = 72;
        const maxH = 65;
        const { w, h } = ajustarAoBox(doc, item.foto, maxW, maxH);
        doc.setDrawColor(215);
        doc.rect(margem - 0.5, y - 0.5, w + 1, h + 1);
        doc.addImage(item.foto, "JPEG", margem, y, w, h);
        const textX = margem + maxW + 6;
        const textW = pageW - margem * 2 - maxW - 6;
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Local:", textX, y + 5);
        doc.setFont("helvetica", "normal");
        doc.text(doc.splitTextToSize(item.local || "-", textW - 15), textX + 15, y + 5);
        doc.setFont("helvetica", "bold");
        doc.text("Responsável:", textX, y + 12);
        doc.setFont("helvetica", "normal");
        doc.text(doc.splitTextToSize(responsavelComEquipe(item), textW - 28), textX + 28, y + 12);
        doc.setFont("helvetica", "bold");
        doc.text("Prazo:", textX, y + 19);
        doc.setFont("helvetica", "normal");
        doc.text(item.prazo ? formatarDataComDia(item.prazo) : "-", textX + 15, y + 19);
        doc.setFont("helvetica", "bold");
        doc.text("Descrição:", textX, y + 26);
        doc.setFont("helvetica", "normal");
        doc.text(doc.splitTextToSize(item.descricao || "-", textW), textX, y + 32);
        y += Math.max(maxH, 32) + 8;
      } catch {
        y = textoFallback(doc, item, y, pageW, margem);
      }
    } else {
      y = textoFallback(doc, item, y, pageW, margem);
    }

    if (item.status === "Concluído") {
      y = checkPageBreak(doc, y, 15, pageH);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 118, 78);
      doc.text(
        `Concluído em ${item.concluidoEm ? new Date(item.concluidoEm).toLocaleDateString("pt-BR") : "-"}`,
        margem,
        y
      );
      doc.setTextColor(0);
      y += 6;
      if (item.fotoDepois) {
        y = checkPageBreak(doc, y, 68, pageH);
        try {
          doc.setFont("helvetica", "normal");
          doc.text("Foto de conclusão:", margem, y);
          y += 4;
          const maxW2 = 65;
          const maxH2 = 58;
          const { w: w2, h: h2 } = ajustarAoBox(doc, item.fotoDepois, maxW2, maxH2);
          doc.setDrawColor(215);
          doc.rect(margem - 0.5, y - 0.5, w2 + 1, h2 + 1);
          doc.addImage(item.fotoDepois, "JPEG", margem, y, w2, h2);
          y += h2 + 4;
        } catch {
          // ignora falha ao anexar a foto de conclusão
        }
      }
    }
    y += 6;
  });

  return doc;
}

export function nomeArquivoVistoria(vistoria: VistoriaObra): string {
  const slug = (vistoria.obraNome || "vistoria")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `vistoria-${slug}-${vistoria.data || "sem-data"}.pdf`;
}
