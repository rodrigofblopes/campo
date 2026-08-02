import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Obra } from "./types";
import {
  agruparProducao,
  areaProduzidaPorServico,
  calcularAnalise,
  calcularProgressoObra,
  formatarNumero,
  inferirConfigDeProducao,
  percentualGeralObra,
} from "./calculations";
import { SERVICOS_CONFIG } from "./servicos";
import { servicoTemEscopo, totalEscopoServico } from "./escopo";

export function gerarRelatorioPDF(obra: Obra): void {
  const doc = new jsPDF();
  const margem = 14;
  let y = 20;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Relatório de Produtividade", margem, y);
  y += 8;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Obra: ${obra.nome}`, margem, y);
  y += 6;
  if (obra.cliente) {
    doc.text(`Cliente: ${obra.cliente}`, margem, y);
    y += 6;
  }
  doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, margem, y);
  y += 10;

  const progresso = calcularProgressoObra(obra);

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("1. Plaqueamento externo (escopo × produção)", margem, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [
      [
        "Localização",
        "Escopo (m²)",
        "Glasroc-x",
        "Tratamento de Juntas",
        "Basecoat",
      ],
    ],
    body: progresso.map((item) => [
      item.localizacao,
      formatarNumero(item.areaTotalM2, 0),
      `${formatarNumero(item.servicos["Plaqueamento Glasroc-x"]?.percentual ?? 0, 0)}%`,
      `${formatarNumero(item.servicos["Tratamento de Juntas"]?.percentual ?? 0, 0)}%`,
      `${formatarNumero(item.servicos["Basecoat"]?.percentual ?? 0, 0)}%`,
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 64, 120] },
    margin: { left: margem, right: margem },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  const areaPorServico = areaProduzidaPorServico(obra.registros);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Área produzida por serviço (não somar entre si — cada etapa é contada separadamente):", margem, y);
  y += 6;

  for (const cfg of SERVICOS_CONFIG) {
    const area = areaPorServico[cfg.id];
    const temEscopo = servicoTemEscopo(obra, cfg.id);

    if (temEscopo) {
      const escopo = totalEscopoServico(obra, cfg.id);
      const pct = percentualGeralObra(obra, cfg.id);
      const sufixo =
        area === 0 && cfg.status === "futuro" ? " — não iniciado" : "";
      doc.text(
        `• ${cfg.label}: ${formatarNumero(area, 0)} m² (${formatarNumero(pct, 0)}% de ${formatarNumero(escopo, 0)} m²)${sufixo}`,
        margem + 2,
        y
      );
    } else if (cfg.status === "futuro") {
      doc.text(`• ${cfg.label}: previsão futura`, margem + 2, y);
    } else {
      doc.text(`• ${cfg.label}: ${formatarNumero(area, 0)} m² produzidos`, margem + 2, y);
    }
    y += 5;
  }
  y += 3;

  const resumos =
    obra.resumos.length > 0 ? obra.resumos : agruparProducao(obra.registros);

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("2. Resumo por Localização", margem, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [["Localização", "Serviço", "Área (m²)", "Dias", "RUP (m²/dia)", "Observação"]],
    body: resumos.map((r) => [
      r.localizacao,
      r.servico,
      formatarNumero(r.areaM2, 1),
      String(r.dias),
      formatarNumero(r.rupDiario, 1),
      r.observacao ?? "",
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 64, 120] },
    margin: { left: margem, right: margem },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("3. Registro Diário de Produção", margem, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [["Data", "Equipe", "Localização", "Serviço", "Área (m²)"]],
    body: [...obra.registros]
      .sort((a, b) => a.data.localeCompare(b.data))
      .map((r) => [
        new Date(r.data + "T12:00:00").toLocaleDateString("pt-BR"),
        r.equipe,
        r.localizacao,
        r.servico,
        formatarNumero(r.areaM2, 2),
      ]),
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [30, 64, 120] },
    margin: { left: margem, right: margem },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  const servicos = [...new Set(obra.registros.map((r) => r.servico))] as const;

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  if (y > 250) {
    doc.addPage();
    y = 20;
  }
  doc.text("4. Produtividade por Serviço", margem, y);
  y += 8;

  for (const servico of servicos) {
    if (y > 230) {
      doc.addPage();
      y = 20;
    }

    const { config, areaTotal } = inferirConfigDeProducao(obra.registros, {
      servico,
    });

    const resultado = calcularAnalise({
      config,
      areaRealizada: areaTotal,
    });

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(servico, margem, y);
    y += 6;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const linhas = [
      `Área produzida: ${formatarNumero(areaTotal, 2)} m²`,
      `Dias: ${config.dias} | Jornada: ${config.jornadaHoras}h | Equipe: ${config.montadores} mont. + ${config.ajudantes} ajud.`,
      `Produtividade diária: ${formatarNumero(resultado.produtividadeDiaria, 1)} m²/dia`,
      `Produtividade profissional: ${formatarNumero(resultado.produtividadeM2HProf, 2)} m²/h`,
      `Produtividade servente: ${formatarNumero(resultado.produtividadeM2HServ, 2)} m²/h`,
      `RUP profissional: ${formatarNumero(resultado.rupHorasProf, 2)} h/m²`,
      `RUP servente: ${formatarNumero(resultado.rupHorasServ, 2)} h/m²`,
    ];

    for (const linha of linhas) {
      doc.text(linha, margem, y);
      y += 5;
    }

    y += 6;
  }

  if (obra.observacoesGerais) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("5. Observações Gerais", margem, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(obra.observacoesGerais, 180);
    doc.text(lines, margem, y);
  }

  doc.save(
    `${obra.nome.replace(/\s+/g, "_")}_produtividade_${new Date().toISOString().slice(0, 10)}.pdf`
  );
}
