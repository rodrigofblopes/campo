import type { PendenciaVistoria, VistoriaObra } from "./vistoria-types";
import { statusEfetivo } from "./vistoria-types";

const URL_BASE = "https://campo-one.vercel.app";

/** Máximo de tarefas por imagem — passando disso, gera mais de uma imagem
 * (parte 1/2, 2/2...) em vez de uma imagem só muito comprida. */
const TAREFAS_POR_IMAGEM = 4;

/**
 * Link da vistoria da obra no app — desenhado no rodapé das imagens
 * geradas pra WhatsApp e incluído no texto do compartilhamento, assim
 * quem recebe sabe onde acompanhar a demanda completa de atividades (a
 * imagem sozinha é só um recorte do momento).
 */
function linkVistoria(obraId: string): string {
  return `${URL_BASE}/obras/${obraId}/vistoria`;
}

function formatarDataBr(iso: string): string {
  if (!iso) return "-";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/** Nome do dia da semana por extenso (ex.: "quarta-feira"). */
function nomeDiaSemana(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const data = new Date(y, (m || 1) - 1, d || 1);
  return new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(data);
}

/** Prazo formatado com o dia da semana ao lado, ex.: "12/08/2026 (quarta-feira)". */
function formatarPrazo(iso: string): string {
  if (!iso) return "a definir";
  return `${formatarDataBr(iso)} (${nomeDiaSemana(iso)})`;
}

function dividirEmGrupos<T>(itens: T[], tamanho: number): T[][] {
  if (itens.length <= tamanho) return [itens];
  const grupos: T[][] = [];
  for (let i = 0; i < itens.length; i += tamanho) {
    grupos.push(itens.slice(i, i + tamanho));
  }
  return grupos;
}

function carregarImagem(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("falha ao carregar imagem"));
    img.src = src;
  });
}

function desenharImagemCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const escala = Math.max(w / img.width, h / img.height);
  const sw = w / escala;
  const sh = h / escala;
  const sx = (img.width - sw) / 2;
  const sy = (img.height - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

/** Desenha um selo de texto (com fundo colorido) — usado para marcar
 * "ANTES" / "CONCLUÍDO" no canto da foto quando a tarefa já foi feita. */
function desenharSeloFoto(
  ctx: CanvasRenderingContext2D,
  texto: string,
  cor: string,
  x: number,
  y: number,
  fonte: string
) {
  ctx.font = fonte;
  const largura = ctx.measureText(texto).width + 20;
  const altura = 30;
  ctx.save();
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = cor;
  ctx.beginPath();
  ctx.roundRect(x, y, largura, altura, 8);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = "#ffffff";
  ctx.fillText(texto, x + 10, y + 21);
}

/**
 * Desenha a foto de uma pendência num retângulo (x, y, w, h). Se a
 * pendência já tem foto de conclusão (fotoDepois), divide o espaço em
 * duas colunas — antes e depois — para quem recebe a imagem já ver o
 * resultado do serviço, não só o problema original.
 */
async function desenharFotoPendencia(
  ctx: CanvasRenderingContext2D,
  item: PendenciaVistoria,
  x: number,
  y: number,
  w: number,
  h: number,
  raio: number,
  fonteSemFoto: string,
  fonteSelo: string
) {
  const desenharUma = async (src: string | null, px: number, py: number, pw: number, ph: number) => {
    if (src) {
      try {
        const img = await carregarImagem(src);
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(px, py, pw, ph, raio);
        ctx.clip();
        desenharImagemCover(ctx, img, px, py, pw, ph);
        ctx.restore();
        return;
      } catch {
        // cai no placeholder abaixo
      }
    }
    ctx.fillStyle = "#e2e8f0";
    ctx.beginPath();
    ctx.roundRect(px, py, pw, ph, raio);
    ctx.fill();
    if (!src) {
      ctx.fillStyle = "#94a3b8";
      ctx.font = fonteSemFoto;
      ctx.textAlign = "center";
      ctx.fillText("Sem foto", px + pw / 2, py + ph / 2);
      ctx.textAlign = "left";
    }
  };

  if (item.fotoDepois) {
    const gap = Math.max(12, Math.round(w * 0.03));
    const colW = (w - gap) / 2;
    await desenharUma(item.foto, x, y, colW, h);
    await desenharUma(item.fotoDepois, x + colW + gap, y, colW, h);
    desenharSeloFoto(ctx, "ANTES", "#64748b", x + 12, y + 12, fonteSelo);
    desenharSeloFoto(ctx, "CONCLUÍDO", "#059669", x + colW + gap + 12, y + 12, fonteSelo);
  } else {
    await desenharUma(item.foto, x, y, w, h);
  }
}

function quebrarTexto(ctx: CanvasRenderingContext2D, texto: string, maxWidth: number): string[] {
  const palavras = texto.split(/\s+/).filter(Boolean);
  const linhas: string[] = [];
  let linha = "";
  for (const palavra of palavras) {
    const tentativa = linha ? `${linha} ${palavra}` : palavra;
    if (ctx.measureText(tentativa).width > maxWidth && linha) {
      linhas.push(linha);
      linha = palavra;
    } else {
      linha = tentativa;
    }
  }
  if (linha) linhas.push(linha);
  return linhas;
}

function corPrioridade(prioridade: string): string {
  if (prioridade === "Alta") return "#dc2626";
  if (prioridade === "Média") return "#d97706";
  return "#64748b";
}

function corStatus(status: string): string {
  if (status === "Concluído") return "#059669";
  if (status === "Atrasado") return "#dc2626";
  if (status === "Em execução") return "#2563eb";
  return "#d97706";
}

function slugify(texto: string): string {
  return (texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Gera um cartão-imagem simples e visual de uma pendência (foto grande,
 * local em destaque, prazo e responsável) — pensado para ser aberto no
 * WhatsApp por quem executa o serviço, sem precisar abrir um PDF.
 */
export async function gerarImagemPendencia(
  vistoria: VistoriaObra,
  item: PendenciaVistoria
): Promise<Blob> {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("sem contexto 2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#2563eb";
  ctx.fillRect(0, 0, W, 150);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 52px sans-serif";
  ctx.fillText("CAMPO", 48, 78);
  ctx.font = "bold 30px sans-serif";
  ctx.fillText("VISTORIA DE OBRA", 48, 118);

  ctx.fillStyle = "#475569";
  ctx.font = "500 32px sans-serif";
  ctx.fillText(vistoria.obraNome || "-", 48, 196);

  const fotoY = 226;
  const fotoH = 560;
  const fotoW = W - 96;
  await desenharFotoPendencia(
    ctx,
    item,
    48,
    fotoY,
    fotoW,
    fotoH,
    24,
    "600 36px sans-serif",
    "bold 24px sans-serif"
  );

  let y = fotoY + fotoH + 70;

  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 54px sans-serif";
  const linhasLocal = quebrarTexto(ctx, item.local || "Pendência", W - 96);
  for (const linha of linhasLocal.slice(0, 2)) {
    ctx.fillText(linha, 48, y);
    y += 60;
  }
  y += 10;

  const hoje = new Date().toISOString().slice(0, 10);
  const status = statusEfetivo(item, hoje);
  const badges = [
    ...(item.equipe ? [{ texto: item.equipe, cor: "#0891b2" }] : []),
    { texto: `Prioridade ${item.prioridade}`, cor: corPrioridade(item.prioridade) },
    { texto: status, cor: corStatus(status) },
  ];
  let bx = 48;
  ctx.font = "bold 28px sans-serif";
  for (const b of badges) {
    const largura = ctx.measureText(b.texto).width + 48;
    ctx.fillStyle = b.cor;
    ctx.beginPath();
    ctx.roundRect(bx, y, largura, 56, 28);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillText(b.texto, bx + 24, y + 38);
    bx += largura + 16;
  }
  y += 90;

  ctx.fillStyle = "#1e293b";
  ctx.font = "400 34px sans-serif";
  const linhasDesc = quebrarTexto(ctx, item.descricao || "-", W - 96);
  for (const linha of linhasDesc.slice(0, 3)) {
    ctx.fillText(linha, 48, y);
    y += 44;
  }
  y += 20;

  ctx.font = "bold 38px sans-serif";
  ctx.fillStyle = status === "Atrasado" ? "#dc2626" : "#0f172a";
  ctx.fillText(`Prazo: ${formatarPrazo(item.prazo)}`, 48, y);
  y += 50;
  ctx.font = "500 32px sans-serif";
  ctx.fillStyle = "#334155";
  ctx.fillText(`Responsável: ${item.responsavel || "-"}`, 48, y);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "400 24px sans-serif";
  ctx.fillText("Gerado pelo app Campo · Steel Frame", 48, H - 62);
  ctx.fillStyle = "#2563eb";
  ctx.font = "600 24px sans-serif";
  ctx.fillText(`Acompanhe em ${linkVistoria(vistoria.obraId)}`, 48, H - 32);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("falha ao gerar imagem"))),
      "image/jpeg",
      0.9
    );
  });
}

export function nomeArquivoImagemPendencia(item: PendenciaVistoria): string {
  return `pendencia-${slugify(item.local || "pendencia")}.jpg`;
}

/**
 * Compartilha um ou mais arquivos de uma vez só — a Web Share API já
 * suporta vários arquivos num único compartilhamento, então o app manda
 * tudo junto e quem recebe escolhe enviar todas as imagens de uma vez no
 * WhatsApp. Se o navegador não suportar compartilhar arquivos, baixa cada
 * imagem separadamente e abre o WhatsApp Web com o texto (já com o link)
 * para anexar.
 */
async function compartilharImagens(
  blobs: Blob[],
  nomeArquivo: (indice: number, total: number) => string,
  titulo: string,
  texto: string
): Promise<void> {
  const files = blobs.map(
    (blob, i) => new File([blob], nomeArquivo(i, blobs.length), { type: "image/jpeg" })
  );

  const nav = navigator as Navigator & {
    canShare?: (data?: ShareData) => boolean;
    share?: (data: ShareData) => Promise<void>;
  };

  if (nav.canShare && nav.share && nav.canShare({ files })) {
    try {
      await nav.share({ files, title: titulo, text: texto });
      return;
    } catch {
      // usuário cancelou o compartilhamento — cai no fallback abaixo
    }
  }

  for (const file of files) {
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
}

/**
 * Compartilha a imagem da pendência via Web Share API (abre direto o
 * seletor de apps do celular, incluindo WhatsApp). Se o navegador não
 * suportar compartilhar arquivos, baixa a imagem e abre o WhatsApp Web
 * com um texto avisando para anexar a imagem baixada.
 */
export async function compartilharImagemPendencia(
  vistoria: VistoriaObra,
  item: PendenciaVistoria
): Promise<void> {
  const blob = await gerarImagemPendencia(vistoria, item);
  const texto = `${item.local || "Pendência"} — ${vistoria.obraNome}\n${linkVistoria(vistoria.obraId)}`;
  await compartilharImagens(
    [blob],
    () => nomeArquivoImagemPendencia(item),
    "Pendência de Vistoria",
    texto
  );
}

interface OpcoesImagemBase {
  /** Texto do selo no cabeçalho (ex: "Equipe: Elétrica" ou "Filtro: Pendente"). */
  subtitulo?: string;
  /** Esconde o badge de equipe em cada card — usado quando o subtítulo já deixa a equipe clara. */
  ocultarBadgeEquipe?: boolean;
}

/**
 * Desenha a imagem-resumo (cabeçalho + cards das pendências) num canvas.
 * Usada pela imagem completa da vistoria, pela imagem de uma única
 * equipe e pela imagem de tarefas filtradas — a diferença é só a lista
 * de itens e o subtítulo opcional exibido no cabeçalho. Recebe no máximo
 * TAREFAS_POR_IMAGEM itens (quem chama já dividiu em grupos).
 */
async function gerarImagemBase(
  vistoria: VistoriaObra,
  itens: PendenciaVistoria[],
  opcoes: OpcoesImagemBase = {}
): Promise<Blob> {
  const { subtitulo, ocultarBadgeEquipe } = opcoes;
  const W = 1080;
  const PAD = 48;
  const headerH = subtitulo ? 260 : 220;
  // Foto do serviço maior nos cards — facilita entender de longe qual é
  // a atividade só olhando a miniatura no WhatsApp.
  const thumbSize = 320;
  const itemH = 380;
  const itemGap = 28;
  const footerH = 92;
  const H = headerH + itens.length * (itemH + itemGap) + footerH;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = Math.max(H, 460);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("sem contexto 2d");

  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, W, canvas.height);

  ctx.fillStyle = "#2563eb";
  ctx.fillRect(0, 0, W, headerH);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 52px sans-serif";
  ctx.fillText("CAMPO", PAD, 78);
  ctx.font = "bold 28px sans-serif";
  ctx.fillText("VISTORIA DE OBRA", PAD, 116);
  ctx.font = "600 32px sans-serif";
  ctx.fillText(vistoria.obraNome || "-", PAD, 164);

  if (subtitulo) {
    // Selo com o filtro em destaque — deixa claro pra quem abrir a
    // imagem quais tarefas estão ali (equipe, situação, ou os dois).
    ctx.font = "bold 26px sans-serif";
    const larguraSelo = ctx.measureText(subtitulo).width + 40;
    ctx.fillStyle = "#0891b2";
    ctx.beginPath();
    ctx.roundRect(PAD, 178, larguraSelo, 44, 22);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillText(subtitulo, PAD + 20, 208);
    ctx.font = "400 22px sans-serif";
    ctx.fillText(
      `${formatarDataBr(vistoria.data)} · Responsável: ${vistoria.responsavelVistoria || "-"} · ${itens.length} pendência(s)`,
      PAD,
      244
    );
  } else {
    ctx.font = "400 24px sans-serif";
    ctx.fillText(
      `${formatarDataBr(vistoria.data)} · Responsável: ${vistoria.responsavelVistoria || "-"} · ${itens.length} pendência(s)`,
      PAD,
      200
    );
  }

  const hoje = new Date().toISOString().slice(0, 10);
  let y = headerH + 24;

  for (const item of itens) {
    const cardTop = y;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(PAD, cardTop, W - PAD * 2, itemH, 20);
    ctx.fill();
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 2;
    ctx.stroke();

    const thumbX = PAD + 20;
    const thumbY = cardTop + 20;
    await desenharFotoPendencia(
      ctx,
      item,
      thumbX,
      thumbY,
      thumbSize,
      thumbSize,
      16,
      "600 22px sans-serif",
      "bold 18px sans-serif"
    );

    const textX = thumbX + thumbSize + 28;
    const textW = W - PAD - 20 - textX;
    let ty = cardTop + 50;

    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 34px sans-serif";
    const linhasLocal = quebrarTexto(ctx, item.local || "Pendência", textW);
    ctx.fillText(linhasLocal[0] || "Pendência", textX, ty);
    ty += 44;

    const status = statusEfetivo(item, hoje);
    ctx.font = "bold 22px sans-serif";
    let bx = textX;
    const badgesResumo = [
      ...(!ocultarBadgeEquipe && item.equipe ? [{ texto: item.equipe, cor: "#0891b2" }] : []),
      { texto: `Prioridade ${item.prioridade}`, cor: corPrioridade(item.prioridade) },
      { texto: status, cor: corStatus(status) },
    ];
    for (const b of badgesResumo) {
      const largura = ctx.measureText(b.texto).width + 32;
      ctx.fillStyle = b.cor;
      ctx.beginPath();
      ctx.roundRect(bx, ty - 24, largura, 40, 20);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.fillText(b.texto, bx + 16, ty + 3);
      bx += largura + 12;
    }
    ty += 44;

    ctx.fillStyle = "#334155";
    ctx.font = "400 26px sans-serif";
    const linhasDesc = quebrarTexto(ctx, item.descricao || "-", textW);
    for (const linha of linhasDesc.slice(0, 2)) {
      ctx.fillText(linha, textX, ty);
      ty += 32;
    }
    ty += 8;

    ctx.font = "bold 26px sans-serif";
    ctx.fillStyle = status === "Atrasado" ? "#dc2626" : "#0f172a";
    const linhasPrazo = quebrarTexto(ctx, `Prazo: ${formatarPrazo(item.prazo)}`, textW);
    for (const linha of linhasPrazo.slice(0, 2)) {
      ctx.fillText(linha, textX, ty);
      ty += 30;
    }
    ty += 2;
    ctx.font = "400 24px sans-serif";
    ctx.fillStyle = "#475569";
    ctx.fillText(`Responsável: ${item.responsavel || "-"}`, textX, ty);

    y += itemH + itemGap;
  }

  ctx.fillStyle = "#94a3b8";
  ctx.font = "400 22px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Gerado pelo app Campo · Steel Frame", W / 2, canvas.height - 52);
  if (vistoria.obraId) {
    ctx.fillStyle = "#2563eb";
    ctx.font = "600 22px sans-serif";
    ctx.fillText(`Acompanhe em ${linkVistoria(vistoria.obraId)}`, W / 2, canvas.height - 24);
  }
  ctx.textAlign = "left";

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("falha ao gerar imagem"))),
      "image/jpeg",
      0.9
    );
  });
}

/** Gera o subtítulo de cada imagem quando a lista foi dividida em várias
 * partes, deixando claro pra quem recebe que é "Parte 2/3" etc. */
function subtituloComParte(base: string | undefined, indice: number, total: number): string | undefined {
  if (total <= 1) return base;
  const rotuloBase = base ?? "Tarefas";
  return `${rotuloBase} · Parte ${indice + 1}/${total}`;
}

function nomeComParte(base: string, indice: number, total: number): string {
  if (total <= 1) return base;
  return base.replace(/\.jpg$/, `-parte${indice + 1}de${total}.jpg`);
}

/**
 * Gera uma única imagem-resumo com todas as pendências da vistoria —
 * pensada para ser compartilhada no WhatsApp com quem vai executar o
 * serviço, sem precisar abrir um PDF. Mais rápida de abrir e olhar no
 * celular do que um PDF.
 */
export async function gerarImagemVistoria(vistoria: VistoriaObra): Promise<Blob> {
  return gerarImagemBase(vistoria, vistoria.itens);
}

export function nomeArquivoImagemVistoria(vistoria: VistoriaObra): string {
  return `vistoria-${slugify(vistoria.obraNome || "vistoria")}-${vistoria.data || ""}.jpg`;
}

/**
 * Compartilha a vistoria inteira via Web Share API — se tiver mais de
 * TAREFAS_POR_IMAGEM pendências, divide em várias imagens (4 tarefas
 * cada) e manda tudo junto num só compartilhamento, em vez de uma imagem
 * gigante. Se o navegador não suportar compartilhar arquivos, baixa cada
 * imagem e abre o WhatsApp Web com um texto (com o link) avisando para
 * anexar as imagens baixadas.
 */
export async function compartilharImagemVistoria(vistoria: VistoriaObra): Promise<void> {
  const grupos = dividirEmGrupos(vistoria.itens, TAREFAS_POR_IMAGEM);
  const blobs = await Promise.all(
    grupos.map((grupo, i) =>
      gerarImagemBase(vistoria, grupo, {
        subtitulo: subtituloComParte(undefined, i, grupos.length),
      })
    )
  );
  const nomeBase = nomeArquivoImagemVistoria(vistoria);
  const texto = `Vistoria - ${vistoria.obraNome}\n${linkVistoria(vistoria.obraId)}`;
  await compartilharImagens(
    blobs,
    (i, total) => nomeComParte(nomeBase, i, total),
    "Vistoria de Obra",
    texto
  );
}

/**
 * Gera uma imagem-resumo só com as pendências de UMA equipe — pensada
 * para enviar direto pro responsável daquela equipe, sem misturar com as
 * tarefas de outras equipes.
 */
export async function gerarImagemEquipe(vistoria: VistoriaObra, equipe: string): Promise<Blob> {
  const itensDaEquipe = vistoria.itens.filter(
    (it) => (it.equipe && it.equipe.trim() ? it.equipe : "Sem equipe definida") === equipe
  );
  return gerarImagemBase(vistoria, itensDaEquipe, {
    subtitulo: `Equipe: ${equipe}`,
    ocultarBadgeEquipe: true,
  });
}

export function nomeArquivoImagemEquipe(vistoria: VistoriaObra, equipe: string): string {
  return `vistoria-${slugify(vistoria.obraNome || "vistoria")}-${slugify(equipe)}-${vistoria.data || ""}.jpg`;
}

/**
 * Compartilha só as pendências de uma equipe via Web Share API — pra
 * mandar direto pro responsável daquela equipe as tarefas que ele
 * precisa executar. Se tiver mais de TAREFAS_POR_IMAGEM pendências,
 * divide em várias imagens e manda todas juntas.
 */
export async function compartilharImagemEquipe(vistoria: VistoriaObra, equipe: string): Promise<void> {
  const itensDaEquipe = vistoria.itens.filter(
    (it) => (it.equipe && it.equipe.trim() ? it.equipe : "Sem equipe definida") === equipe
  );
  const grupos = dividirEmGrupos(itensDaEquipe, TAREFAS_POR_IMAGEM);
  const blobs = await Promise.all(
    grupos.map((grupo, i) =>
      gerarImagemBase(vistoria, grupo, {
        subtitulo: subtituloComParte(`Equipe: ${equipe}`, i, grupos.length),
        ocultarBadgeEquipe: true,
      })
    )
  );
  const nomeBase = nomeArquivoImagemEquipe(vistoria, equipe);
  const texto = `Tarefas da equipe ${equipe} - ${vistoria.obraNome}\n${linkVistoria(vistoria.obraId)}`;
  await compartilharImagens(
    blobs,
    (i, total) => nomeComParte(nomeBase, i, total),
    `Equipe ${equipe}`,
    texto
  );
}

function legendaFiltro(filtroEquipe: string, filtroStatus: string): string {
  const partes = [filtroEquipe, filtroStatus].filter(Boolean);
  return partes.length > 0 ? partes.join(" · ") : "todas as pendências";
}

/**
 * Gera uma imagem-resumo com as pendências já filtradas por equipe e/ou
 * situação no histórico (podem vir de vistorias diferentes) — pensada
 * para mandar de uma vez só o recorte que está sendo visto na tela.
 */
export async function gerarImagemFiltrada(
  obraId: string,
  obraNome: string,
  itens: PendenciaVistoria[],
  filtroEquipe: string,
  filtroStatus: string
): Promise<Blob> {
  const vistoriaSintetica: VistoriaObra = {
    id: "filtro",
    obraId,
    obraNome,
    responsavelVistoria: "",
    data: new Date().toISOString().slice(0, 10),
    criadoEm: new Date().toISOString(),
    itens,
  };
  const partesFiltro = [filtroEquipe, filtroStatus].filter(Boolean);
  const subtitulo = partesFiltro.length > 0 ? `Filtro: ${partesFiltro.join(" · ")}` : undefined;
  return gerarImagemBase(vistoriaSintetica, itens, {
    subtitulo,
    ocultarBadgeEquipe: Boolean(filtroEquipe),
  });
}

export function nomeArquivoImagemFiltrada(obraNome: string): string {
  return `vistoria-${slugify(obraNome || "vistoria")}-filtro-${new Date().toISOString().slice(0, 10)}.jpg`;
}

/**
 * Compartilha via WhatsApp a imagem-resumo das pendências filtradas por
 * equipe e/ou situação — junta tudo que bate com o filtro atual do
 * histórico numa imagem só (ou em várias, de 4 em 4 tarefas, se o
 * filtro trouxer muitas pendências) em vez de precisar abrir vistoria
 * por vistoria.
 */
export async function compartilharImagemFiltrada(
  obraId: string,
  obraNome: string,
  itens: PendenciaVistoria[],
  filtroEquipe: string,
  filtroStatus: string
): Promise<void> {
  const vistoriaSintetica: VistoriaObra = {
    id: "filtro",
    obraId,
    obraNome,
    responsavelVistoria: "",
    data: new Date().toISOString().slice(0, 10),
    criadoEm: new Date().toISOString(),
    itens,
  };
  const partesFiltro = [filtroEquipe, filtroStatus].filter(Boolean);
  const subtituloBase = partesFiltro.length > 0 ? `Filtro: ${partesFiltro.join(" · ")}` : undefined;
  const grupos = dividirEmGrupos(itens, TAREFAS_POR_IMAGEM);
  const blobs = await Promise.all(
    grupos.map((grupo, i) =>
      gerarImagemBase(vistoriaSintetica, grupo, {
        subtitulo: subtituloComParte(subtituloBase, i, grupos.length),
        ocultarBadgeEquipe: Boolean(filtroEquipe),
      })
    )
  );
  const legenda = legendaFiltro(filtroEquipe, filtroStatus);
  const nomeBase = nomeArquivoImagemFiltrada(obraNome);
  const texto = `Tarefas filtradas (${legenda}) - ${obraNome}\n${linkVistoria(obraId)}`;
  await compartilharImagens(
    blobs,
    (i, total) => nomeComParte(nomeBase, i, total),
    "Tarefas filtradas",
    texto
  );
}
