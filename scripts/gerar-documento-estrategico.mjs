/**
 * Gera PDF: conversa estratégica sobre apresentação à empresa e planejamento futuro.
 * Uso: node scripts/gerar-documento-estrategico.mjs
 * Saída: ../Documento-Estrategico-Produtividade-Sicredi.pdf
 */

import { jsPDF } from "jspdf";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputPath = join(
  __dirname,
  "..",
  "..",
  "Sicredi",
  "Documento-Estrategico-Produtividade-Sicredi.pdf"
);

const MARGEM = 18;
const LARGURA = 174;
const RODAPE_Y = 285;

const doc = new jsPDF({ unit: "mm", format: "a4" });
let y = 0;
let pagina = 1;

function novaPagina() {
  doc.addPage();
  pagina += 1;
  y = MARGEM;
  rodape();
}

function rodape() {
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text(
    `Produtividade Sicredi · Documento estratégico · Página ${pagina}`,
    MARGEM,
    RODAPE_Y
  );
  doc.setTextColor(0, 0, 0);
}

function espaco(mm) {
  y += mm;
  if (y > RODAPE_Y - 10) novaPagina();
}

function titulo(texto, tamanho = 16) {
  if (y > RODAPE_Y - 25) novaPagina();
  doc.setFontSize(tamanho);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(texto, MARGEM, y);
  doc.setTextColor(0, 0, 0);
  espaco(tamanho === 16 ? 10 : 8);
}

function subtitulo(texto) {
  if (y > RODAPE_Y - 20) novaPagina();
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 64, 175);
  doc.text(texto, MARGEM, y);
  doc.setTextColor(0, 0, 0);
  espaco(7);
}

function paragrafo(texto, indent = 0) {
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const linhas = doc.splitTextToSize(texto, LARGURA - indent);
  for (const linha of linhas) {
    if (y > RODAPE_Y - 8) novaPagina();
    doc.text(linha, MARGEM + indent, y);
    y += 5;
  }
  espaco(3);
}

function bullet(texto) {
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const linhas = doc.splitTextToSize(texto, LARGURA - 8);
  if (y > RODAPE_Y - 8) novaPagina();
  doc.text("•", MARGEM + 2, y);
  for (let i = 0; i < linhas.length; i++) {
    if (y > RODAPE_Y - 8) novaPagina();
    doc.text(linhas[i], MARGEM + 8, y);
    y += 5;
  }
  espaco(1);
}

function destaque(texto) {
  if (y > RODAPE_Y - 25) novaPagina();
  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(191, 219, 254);
  const linhas = doc.splitTextToSize(texto, LARGURA - 12);
  const altura = linhas.length * 5 + 8;
  doc.roundedRect(MARGEM, y - 4, LARGURA, altura, 2, 2, "FD");
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  let yy = y + 2;
  for (const linha of linhas) {
    doc.text(linha, MARGEM + 6, yy);
    yy += 5;
  }
  y = y - 4 + altura + 4;
}

function linhaSeparadora() {
  doc.setDrawColor(226, 232, 240);
  doc.line(MARGEM, y, MARGEM + LARGURA, y);
  espaco(6);
}

// --- Capa ---
y = 55;
doc.setFontSize(22);
doc.setFont("helvetica", "bold");
doc.text("Produtividade Sicredi", MARGEM, y);
y += 12;
doc.setFontSize(14);
doc.setFont("helvetica", "normal");
doc.setTextColor(71, 85, 105);
doc.text("Conversa estratégica", MARGEM, y);
y += 8;
doc.text("Apresentação à empresa e planejamento para futuras obras", MARGEM, y);
doc.setTextColor(0, 0, 0);
y += 20;
doc.setFontSize(10);
doc.text(`Obra: Sicredi · Steel Frame (acabamento)`, MARGEM, y);
y += 6;
doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, MARGEM, y);
y += 6;
doc.text(`Site: produtividade-sicredi.vercel.app`, MARGEM, y);
y += 20;
doc.setFontSize(9);
doc.setTextColor(100, 116, 139);
doc.text(
  "Documento interno · Não altera o sistema · Reflexão honesta sobre uso e evolução",
  MARGEM,
  y
);
doc.setTextColor(0, 0, 0);

novaPagina();

// --- 1. Onde estamos ---
titulo("1. Onde estamos hoje — com sinceridade");
paragrafo(
  "Você construiu algo que a planilha sozinha não entrega: um painel claro, bonito e consultável " +
    "de qualquer celular, com progresso por frente, escopo versus executado, RUP e previsão. " +
    "Isso já é um diferencial real na hora de falar com a empresa."
);
paragrafo(
  "A decisão de manter o site somente leitura — alimentado pela planilha e por publicações " +
    "controladas — foi acertada. Evita divergência entre o que está no Excel e o que aparece " +
    "na reunião. A planilha continua sendo a fonte da verdade; o site é a vitrine confiável."
);
destaque(
  "O que temos hoje: planilha Produtividade Sicredi.xlsx → sincronização → site publicado → " +
    "PDF operacional sob demanda. Funciona. O próximo passo não é complicar o sistema, " +
    "é usar melhor o que já existe e repetir o modelo em obras futuras."
);

linhaSeparadora();

// --- 2. Apresentar à empresa ---
titulo("2. Como apresentar o relatório à empresa");
paragrafo(
  "A empresa — seja Sicredi, fiscalização ou direção da construtora — não precisa ver abas, " +
    "fórmulas nem telas de cadastro. Precisa de três respostas: onde estamos, o que falta e " +
    "quando tende a terminar, com honestidade sobre incertezas."
);

subtitulo("2.1 Antes da reunião (30 minutos de preparo)");
bullet(
  "Defina o público: técnico (engenharia) ou executivo (prazo/custo)? Ajuste o vocabulário — " +
    "executivo quer % e dias; técnico quer RUP e m² por face."
);
bullet(
  "Abra o site no Resumo e anote 3 números: % geral do plaqueamento externo, m² restantes " +
    "nas faces em andamento e previsão em dias (área restante ÷ RUP)."
);
bullet(
  "Gere o PDF do site (Relatório PDF) e tenha-o salvo — serve como anexo formal após a reunião."
);
bullet(
  "Prepare uma foto ou vista da obra (a imagem do dashboard já ajuda) para contextualizar números frios."
);
bullet(
  "Liste 2–3 fatores que explicam desvio de produtividade (andaime, aberturas, equipe nova, clima) — " +
    "transparência gera confiança."
);

subtitulo("2.2 Roteiro sugerido para a reunião (15–20 min)");
bullet("Abertura (2 min): objetivo da obra nesta fase e frentes ativas (externo, porcelanato, drywall).");
bullet(
  "Visão geral (5 min): mostrar o banner do Resumo — executado / escopo / restante por frente. " +
    "Não entre em detalhe de cada apontamento."
);
bullet(
  "Destaques (5 min): 1 face com bom RUP (ex.: Fundos) e 1 face mais lenta (ex.: Frontal) — " +
    "explique o porquê, não apenas o número."
);
bullet(
  "Previsão (3 min): dias estimados para concluir faces abertas, deixando claro que depende de " +
    "RUP se manter e de condições de acesso."
);
bullet(
  "Encerramento (2 min): próximos marcos (ex.: concluir Glasroc-x na Frontal, avançar porcelanato) " +
    "e data da próxima atualização."
);

subtitulo("2.3 O que evitar na apresentação");
bullet("Mostrar a planilha crua ou pedir para a empresa interpretar células.");
bullet("Prometer data de término sem base no RUP histórico da própria obra.");
bullet("Misturar produção de serviços diferentes sem separar por frente.");
bullet("Omitir faces com 0% quando já há escopo definido — melhor antecipar o que ainda não começou.");

subtitulo("2.4 Cadência recomendada com a empresa");
bullet("Semanal: PDF + reunião curta (15 min) ou mensagem com print do Resumo e 3 bullets.");
bullet("Quinzenal: revisão de escopo com engenharia (alguma face mudou de área?).");
bullet("Por marco: comunicar quando uma face ou serviço atingir 100% — celebra e libera foco.");

destaque(
  "Regra de ouro: leve sempre escopo + executado + restante na mesma tela. " +
    "Foi exatamente isso que você pediu no site — use como argumento central."
);

linhaSeparadora();

// --- 3. Longo prazo ---
titulo("3. Planejamento de longo prazo — futuras obras");

subtitulo("3.1 Padronizar o pacote de dados (template de obra)");
paragrafo(
  "Cada obra nova deve nascer com a mesma estrutura da Sicredi, adaptando nomes e quantitativos:"
);
bullet("Aba Histórico / Produção por frente (apontamentos diários).");
bullet("Aba Escopo ou Quantitativos (m² por localização e serviço).");
bullet("Aba Parede Drywall (número, dimensões, área, data execução).");
bullet("Aba Porcelanato (tipos, área total, apontamentos por data).");
bullet(
  "Convenção de nomes fixa: ex. sempre Frontal, nunca Fachada Frontal — evita % zerado no resumo."
);
bullet("Arquivo modelo: Produtividade [NomeObra].xlsx versionado (data ou v1, v2).");

subtitulo("3.2 Processo ao iniciar uma obra nova");
bullet("Kickoff (1h): definir frentes, escopo inicial, responsável pela planilha.");
bullet("Importação inicial: rodar sync-from-excel → publicar site com URL própria (ex.: produtividade-[obra].vercel.app).");
bullet("Treinamento canteiro (30 min): onde consultar no celular; quem alimenta a planilha; site não recebe cadastro manual.");
bullet("Primeira reunião com empresa na semana 2 — já com site no ar, mesmo com poucos dados.");

subtitulo("3.3 Evolução técnica (backlog honesto, sem urgência)");
paragrafo("Ordem sugerida de prioridade quando houver tempo:");
bullet(
  "Fase A — Repetibilidade: GitHub + deploy automático ao atualizar planilha; uma pessoa dona do processo."
);
bullet(
  "Fase B — Relatório executivo: PDF de 1 página (só KPIs) além do PDF técnico completo — ideal para diretoria."
);
bullet(
  "Fase C — Memória de obras: guardar RUP final por face/serviço de cada obra para estimar obras similares."
);
bullet(
  "Fase D — PWA/offline: consulta no canteiro sem depender de sinal (opcional; site já funciona bem no mobile)."
);
bullet(
  "Fase E — Comparativo multi-obra: dashboard interno Neto Lara com 3–5 obras lado a lado (médio prazo)."
);

subtitulo("3.4 Governança de dados");
bullet("Um responsável único por atualizar a planilha (evita versões conflitantes).");
bullet("Publicação do site só após conferência rápida (Conferência no app espelha a planilha).");
bullet("Incrementar OBRA_DATA_VERSION a cada sync relevante — força dados frescos nos navegadores.");
bullet("Backup semanal da planilha na nuvem (OneDrive/Google Drive já usado pela equipe).");

subtitulo("3.5 KPIs que a empresa passa a esperar (padronize desde já)");
bullet("% executado por frente (externo, porcelanato, drywall, interno).");
bullet("m² produzidos no período (semana) versus meta implícita no cronograma.");
bullet("RUP médio (m²/dia) por face ou por equipe — comparável entre períodos.");
bullet("Previsão de conclusão da face (restante ÷ RUP) — sempre com ressalva.");
bullet("Desvios explicados em uma linha cada (não precisa ser novela).");

linhaSeparadora();

// --- 4. Conversa franca ---
titulo("4. Conversa franca — pontos fortes e gaps");
paragrafo(
  "Pontos fortes: visual profissional; mobile usable; separação clara por frente; escopo visível; " +
    "modo consulta evita bagunça; PDF exportável; alinhado à realidade da planilha da Sicredi."
);
paragrafo(
  "Gaps atuais (normais neste estágio): atualização ainda manual (planilha → sync → deploy); " +
    "sem relatório executivo de 1 página; sem histórico entre obras; nomes de localização exigem " +
    "disciplina na planilha; empresa ainda não viu o ritual semanal de apresentação — isso se constrói " +
    "com constância, não com mais funcionalidades."
);
destaque(
  "Sinceramente: o site já está bom o suficiente para apresentar. O gargalo agora é processo " +
    "e comunicação, não código. Invista energia na cadência semanal com a empresa e no template " +
    "replicável para a próxima obra."
);

linhaSeparadora();

// --- 5. Próximos passos ---
titulo("5. Próximos passos práticos (checklist)");
bullet("[ ] Agendar primeira apresentação formal com roteiro da seção 2.");
bullet("[ ] Gerar PDF do site e enviar como anexo pós-reunião.");
bullet("[ ] Documentar convenção de nomes na planilha (1 página no Excel).");
bullet("[ ] Criar cópia Produtividade TEMPLATE.xlsx para próxima obra.");
bullet("[ ] Configurar GitHub + gh auth quando conveniente (deploy mais previsível).");
bullet("[ ] Após 4 semanas de reuniões: avaliar se falta PDF executivo de 1 página.");

espaco(8);
paragrafo(
  "Este documento foi gerado automaticamente a partir da conversa sobre melhoria da apresentação " +
    "à empresa e planejamento de longo prazo. O site produtividade-sicredi.vercel.app permanece " +
    "inalterado — use-o como ferramenta principal de consulta e demonstração."
);

rodape();

const buffer = doc.output("arraybuffer");
writeFileSync(outputPath, Buffer.from(buffer));
console.log(`PDF gerado: ${outputPath}`);
