import type { PendenciaVistoria, VistoriaObra } from "./vistoria-types";
import { statusEfetivo } from "./vistoria-types";

function formatarDataBr(iso: string): string {
  if (!iso) return "-";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
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
  if (item.foto) {
    try {
      const img = await carregarImagem(item.foto);
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(48, fotoY, fotoW, fotoH, 24);
      ctx.clip();
      desenharImagemCover(ctx, img, 48, fotoY, fotoW, fotoH);
      ctx.restore();
    } catch {
      ctx.fillStyle = "#e2e8f0";
      ctx.fillRect(48, fotoY, fotoW, fotoH);
    }
  } else {
    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(48, fotoY, fotoW, fotoH);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "600 36px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Sem foto", 48 + fotoW / 2, fotoY + fotoH / 2);
    ctx.textAlign = "left";
  }

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
  ctx.fillText(`Prazo: ${item.prazo ? formatarDataBr(item.prazo) : "a definir"}`, 48, y);
  y += 50;
  ctx.font = "500 32px sans-serif";
  ctx.fillStyle = "#334155";
  ctx.fillText(`Responsável: ${item.responsavel || "-"}`, 48, y);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "400 24px sans-serif";
  ctx.fillText("Gerado pelo app Campo · Steel Frame", 48, H - 40);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("falha ao gerar imagem"))),
      "image/jpeg",
      0.9
    );
  });
}

export function nomeArquivoImagemPendencia(item: PendenciaVistoria): string {
  const slug = (item.local || "pendencia")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `pendencia-${slug}.jpg`;
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
  const fileName = nomeArquivoImagemPendencia(item);
  const file = new File([blob], fileName, { type: "image/jpeg" });

  const nav = navigator as Navigator & {
    canShare?: (data?: ShareData) => boolean;
    share?: (data: ShareData) => Promise<void>;
  };

  if (nav.canShare && nav.share && nav.canShare({ files: [file] })) {
    try {
      await nav.share({
        files: [file],
        title: "Pendência de Vistoria",
        text: `${item.local || "Pendência"} — ${vistoria.obraNome}`,
      });
      return;
    } catch {
      // usuário cancelou o compartilhamento — cai no fallback abaixo
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  window.open(
    `https://wa.me/?text=${encodeURIComponent(
      `${item.local || "Pendência"} — ${vistoria.obraNome}. Confira a imagem baixada.`
    )}`,
    "_blank"
  );
}
