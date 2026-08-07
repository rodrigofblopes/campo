import jsPDF from "jspdf";
import type { PendenciaVistoria, VistoriaObra } from "./vistoria-types";
import { statusEfetivo } from "./vistoria-types";

function formatarData(iso: string): string {
  if (!iso) return "-";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function checkPageBreak(doc: jsPDF, y: number, needed: number, pageH: number): number {
  if (y + needed > pageH - 15) {
    doc.addPage();
    return 20;
  }
  return y;
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
  doc.text(item.responsavel || "-", margem + 27, y + 12);
  doc.setFont("helvetica", "bold");
  doc.text("Prazo:", margem, y + 19);
  doc.setFont("helvetica", "normal");
  doc.text(item.prazo ? formatarData(item.prazo) : "-", margem + 15, y + 19);
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
  y = checkPageBreak(doc, y, 20, pageH);
  doc.setFillColor(240, 240, 240);
  doc.rect(margem, y - 5, pageW - margem * 2, 8, "F");
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(
    `Pendência ${i + 1} — ${statusEfetivo(item, hoje)} — Prioridade ${item.prioridade}`,
    margem + 2,
    y
    );
  y += 9;

                       const textX0 = margem;
  let usedImg = false;
  if (item.foto) {
    try {
      const imgW = 60;
      const imgH = 45;
      doc.addImage(item.foto, "JPEG", margem, y, imgW, imgH);
      usedImg = true;
      const textX = margem + imgW + 6;
      const textW = pageW - margem * 2 - imgW - 6;
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Local:", textX, y + 5);
      doc.setFont("helvetica", "normal");
      doc.text(doc.splitTextToSize(item.local || "-", textW - 15), textX + 15, y + 5);
      doc.setFont("helvetica", "bold");
      doc.text("Responsável:", textX, y + 12);
      doc.setFont("helvetica", "normal");
      doc.text(doc.splitTextToSize(item.responsavel || "-", textW - 28), textX + 28, y + 12);
      doc.setFont("helvetica", "bold");
      doc.text("Prazo:", textX, y + 19);
      doc.setFont("helvetica", "normal");
      doc.text(item.prazo ? formatarData(item.prazo) : "-", textX + 15, y + 19);
      doc.setFont("helvetica", "bold");
      doc.text("Descrição:", textX, y + 26);
      doc.setFont("helvetica", "normal");
      doc.text(doc.splitTextToSize(item.descricao || "-", textW), textX, y + 32);
      y += imgH + 8;
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
                           y = checkPageBreak(doc, y, 50, pageH);
                           try {
                             doc.setFont("helvetica", "normal");
                             doc.text("Foto de conclusão:", margem, y);
                             y += 4;
                             doc.addImage(item.fotoDepois, "JPEG", margem, y, 55, 40);
                             y += 44;
                           } catch {
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
