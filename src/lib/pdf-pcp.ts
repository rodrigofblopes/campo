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

function corSituacao(situacao: string): [number, number, number] {
  if (situacao === "Atrasado") return [185, 28, 28];
  if (situacao === "Concluído") return [5, 118, 78];
  if (situacao === "Em execução") return [37, 99, 235];
  return [180, 130, 10];
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
 *
 * Com `detalhado: true`, acrescenta ao final uma listagem completa —
 * pendência a pendência, com local, equipe, responsável, início, prazo,
 * situação e descrição — pra quem quiser entender o PCP com mais
 * profundidade do que a grade dá pra mostrar.
 */
export function gerarPDFPcp({ obraNome, dias, itens }: DadosPcp, detalhado = false): jsPDF {
  const doc = new jsPDF();
  const margem = 14;
  const pageW = doc.internal.pageSize.getWidth();
  const hoje = new Date().toISOString().slice(0, 10);
  let y = 20;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(detalhado ? "PCP Semanal — Detalhado" : "PCP Semanal", margem, y);
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
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  if (detalhado) {
    // União de tudo que tem início ou prazo na semana, sem repetir a mesma
    // pendência (ex.: início e prazo caindo na mesma semana) — ordenada
    // pelo prazo (conclusão) pra ler na mesma ordem da grade.
    const vistosIds = new Set<string>();
    const itensDaSemana = [...comPrazoNaSemana, ...previstosSemana]
      .filter((it) => {
        if (vistosIds.has(it.id)) return false;
        vistosIds.add(it.id);
        return true;
      })
      .sort((a, b) => (a.prazo || a.inicioPrevisto || "").localeCompare(b.prazo || b.inicioPrevisto || ""));

    if (itensDaSemana.length > 0) {
      const pageH = doc.internal.pageSize.getHeight();
      if (y > 240) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("Detalhamento — todas as pendências da semana", margem, y);
      y += 3;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(110);
      doc.text("Uma pendência por bloco, com foto, local, equipe e datas — pra entender de longe sem precisar abrir o app.", margem, y + 4);
      doc.setTextColor(0);
      y += 12;

      itensDaSemana.forEach((it, i) => {
        const temFoto = Boolean(it.foto);
        const temFotoDepois = Boolean(it.fotoDepois);
        const estimativaAltura = temFoto ? (temFotoDepois ? 140 : 78) : 40;
        y = checkPageBreak(doc, y, estimativaAltura, pageH);

        const situacao = statusEfetivo(it, hoje);
        const [rC, gC, bC] = corSituacao(situacao);

        doc.setFillColor(240, 240, 240);
        doc.rect(margem, y - 5, pageW - margem * 2, 8, "F");
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(`${i + 1}. ${it.local || it.descricao || "Pendência"}`, margem + 2, y);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(rC, gC, bC);
        const larguraSituacao = doc.getTextWidth(situacao);
        doc.text(situacao, pageW - margem - 2 - larguraSituacao, y);
        doc.setTextColor(0);
        y += 9;

        if (temFoto && it.foto) {
          try {
            const maxW = 60;
            const maxH = 55;
            const { w, h } = ajustarAoBox(doc, it.foto, maxW, maxH);
            doc.setDrawColor(215);
            doc.rect(margem - 0.5, y - 0.5, w + 1, h + 1);
            doc.addImage(it.foto, "JPEG", margem, y, w, h);

            const textX = margem + maxW + 6;
            const textW = pageW - margem * 2 - maxW - 6;
            let ty = y + 5;
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.text("Equipe:", textX, ty);
            doc.setFont("helvetica", "normal");
            doc.text(it.equipe || "-", textX + 18, ty);
            ty += 6;
            doc.setFont("helvetica", "bold");
            doc.text("Responsável:", textX, ty);
            doc.setFont("helvetica", "normal");
            doc.text(doc.splitTextToSize(it.responsavel || "-", textW - 27), textX + 27, ty);
            ty += 6;
            doc.setFont("helvetica", "bold");
            doc.text("Início:", textX, ty);
            doc.setFont("helvetica", "normal");
            doc.text(it.inicioPrevisto ? formatarDataCompleta(it.inicioPrevisto) : "a definir", textX + 15, ty);
            ty += 6;
            doc.setFont("helvetica", "bold");
            doc.text("Prazo:", textX, ty);
            doc.setFont("helvetica", "normal");
            doc.text(it.prazo ? formatarDataCompleta(it.prazo) : "a definir", textX + 15, ty);
            ty += 6;
            doc.setFont("helvetica", "bold");
            doc.text("Descrição:", textX, ty);
            doc.setFont("helvetica", "normal");
            doc.text(doc.splitTextToSize(it.descricao || "-", textW), textX, ty + 5);

            y += Math.max(maxH, 32) + 6;
          } catch {
            y = camposTexto(doc, it, y, pageW, margem, situacao);
          }
        } else {
          y = camposTexto(doc, it, y, pageW, margem, situacao);
        }

        if (temFotoDepois && it.fotoDepois) {
          y = checkPageBreak(doc, y, 68, pageH);
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(5, 118, 78);
          doc.text(
            `Concluído em ${it.concluidoEm ? new Date(it.concluidoEm).toLocaleDateString("pt-BR") : "-"} — foto de conclusão:`,
            margem,
            y
          );
          doc.setTextColor(0);
          y += 4;
          try {
            const maxW2 = 65;
            const maxH2 = 58;
            const { w: w2, h: h2 } = ajustarAoBox(doc, it.fotoDepois, maxW2, maxH2);
            doc.setDrawColor(215);
            doc.rect(margem - 0.5, y - 0.5, w2 + 1, h2 + 1);
            doc.addImage(it.fotoDepois, "JPEG", margem, y, w2, h2);
            y += h2 + 4;
          } catch {
            // ignora falha ao anexar a foto de conclusão
          }
        }

        y += 6;
      });
    }
  }

  return doc;
}

/** Bloco de texto (sem foto) com os campos principais de uma pendência —
 * usado quando não há foto anexada ou quando a imagem falha ao carregar. */
function camposTexto(
  doc: jsPDF,
  it: PendenciaVistoria,
  y: number,
  pageW: number,
  margem: number,
  situacao: string
): number {
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Equipe:", margem, y + 5);
  doc.setFont("helvetica", "normal");
  doc.text(it.equipe || "-", margem + 18, y + 5);
  doc.setFont("helvetica", "bold");
  doc.text("Responsável:", margem, y + 11);
  doc.setFont("helvetica", "normal");
  doc.text(it.responsavel || "-", margem + 27, y + 11);
  doc.setFont("helvetica", "bold");
  doc.text("Início:", margem, y + 17);
  doc.setFont("helvetica", "normal");
  doc.text(it.inicioPrevisto ? formatarDataCompleta(it.inicioPrevisto) : "a definir", margem + 15, y + 17);
  doc.setFont("helvetica", "bold");
  doc.text("Prazo:", margem + 60, y + 17);
  doc.setFont("helvetica", "normal");
  doc.text(it.prazo ? formatarDataCompleta(it.prazo) : "a definir", margem + 75, y + 17);
  doc.setFont("helvetica", "bold");
  doc.text("Situação:", margem + 120, y + 17);
  doc.setFont("helvetica", "normal");
  doc.text(situacao, margem + 138, y + 17);
  doc.setFont("helvetica", "bold");
  doc.text("Descrição:", margem, y + 23);
  doc.setFont("helvetica", "normal");
  const linhas = doc.splitTextToSize(it.descricao || "-", pageW - margem * 2);
  doc.text(linhas, margem, y + 29);
  return y + 29 + linhas.length * 5;
}

export function nomeArquivoPcp(obraNome: string, dias: DiaSemanaPcp[], detalhado = false): string {
  const slugObra = slugify(obraNome || "obra");
  const primeiraData = dias[0]?.iso ?? "sem-data";
  const sufixo = detalhado ? "-detalhado" : "";
  return `pcp-semanal-${slugObra}-${primeiraData}${sufixo}.pdf`;
}

/**
 * Compartilha o PDF do PCP Semanal via Web Share API (abre direto o
 * seletor de apps do celular, incluindo WhatsApp, pronto para mandar pra
 * diretoria). Se o navegador não suportar compartilhar arquivos, baixa o
 * PDF e abre o WhatsApp Web com um texto avisando para anexar o PDF
 * baixado.
 *
 * `detalhado: true` gera a versão com a listagem completa de pendências
 * ao final, além do resumo executivo — pra quando a diretoria quiser
 * entender o PCP com mais profundidade do que a grade da semana.
 */
export async function compartilharPcp(dados: DadosPcp, detalhado = false): Promise<void> {
  const doc = gerarPDFPcp(dados, detalhado);
  const fileName = nomeArquivoPcp(dados.obraNome, dados.dias, detalhado);
  const blob = doc.output("blob");
  const file = new File([blob], fileName, { type: "application/pdf" });

  const titulo = detalhado ? "PCP Semanal — Detalhado" : "PCP Semanal";
  const texto = `${titulo} — ${dados.obraNome}\nSemana de ${periodoSemanaPcp(dados.dias)}\n${URL_BASE}/obras/${dados.obraId}/pcp`;

  const nav = navigator as Navigator & {
    canShare?: (data?: ShareData) => boolean;
    share?: (data: ShareData) => Promise<void>;
  };

  if (nav.canShare && nav.share && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: titulo, text: texto });
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
