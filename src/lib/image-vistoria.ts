import type { PendenciaVistoria, VistoriaObra } from "./vistoria-types";
import { statusEfetivo, EQUIPES } from "./vistoria-types";

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
  return `pendencia-${slugify(item.local || "pendencia")}.jpg`;
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

/**
 * Gera uma única imagem-resumo com todas as pendências da vistoria,
 * organizadas em seções por Equipe (Elétrica, Civil, Pintura...) — assim
 * cada equipe consegue achar rápido só a parte que é dela — pensada para
 * ser compartilhada no WhatsApp com quem vai executar o serviço, sem
 * precisar abrir um PDF.
 */
export async function gerarImagemVistoria(vistoria: VistoriaObra): Promise<Blob> {
  const W = 1080;
  const PAD = 48;
  const headerH = 220;
  const itemH = 300;
  const itemGap = 28;
  const sectionHeaderH = 64;
  const sectionGap = 16;
  const footerH = 70;
  const itens = vistoria.itens;

  // Agrupa as pendências por equipe (respeitando a ordem de EQUIPES),
  // deixando as sem equipe definida por último.
  const grupos = new Map<string, PendenciaVistoria[]>();
  for (const item of itens) {
    const chave = item.equipe && item.equipe.trim() ? item.equipe : "Sem equipe definida";
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave)!.push(item);
  }
  const chaves = Array.from(grupos.keys()).sort((a, b) => {
    if (a === "Sem equipe definida") return 1;
    if (b === "Sem equipe definida") return -1;
    const ia = (EQUIPES as readonly string[]).indexOf(a);
    const ib = (EQUIPES as readonly string[]).indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  const H =
    headerH +
    24 +
    chaves.reduce(
      (acc, chave) => acc + sectionHeaderH + sectionGap + grupos.get(chave)!.length * (itemH + itemGap),
      0
    ) +
    footerH;

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
  ctx.font = "400 24px sans-serif";
  ctx.fillText(
    `${formatarDataBr(vistoria.data)} · Responsável: ${vistoria.responsavelVistoria || "-"} · ${itens.length} pendência(s)`,
    PAD,
    200
  );

  const hoje = new Date().toISOString().slice(0, 10);
  let y = headerH + 24;

  for (const chave of chaves) {
    const itensDoGrupo = grupos.get(chave)!;

    // Cabeçalho da seção — nome da equipe e quantas pendências ela tem.
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.roundRect(PAD, y, W - PAD * 2, sectionHeaderH, 14);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 30px sans-serif";
    ctx.fillText(`${chave} · ${itensDoGrupo.length} pendência(s)`, PAD + 24, y + 42);
    y += sectionHeaderH + sectionGap;

    for (const item of itensDoGrupo) {
      const cardTop = y;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(PAD, cardTop, W - PAD * 2, itemH, 20);
      ctx.fill();
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 2;
      ctx.stroke();

      const thumbSize = 220;
      const thumbX = PAD + 20;
      const thumbY = cardTop + 20;
      if (item.foto) {
        try {
          const img = await carregarImagem(item.foto);
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(thumbX, thumbY, thumbSize, thumbSize, 16);
          ctx.clip();
          desenharImagemCover(ctx, img, thumbX, thumbY, thumbSize, thumbSize);
          ctx.restore();
        } catch {
          ctx.fillStyle = "#e2e8f0";
          ctx.beginPath();
          ctx.roundRect(thumbX, thumbY, thumbSize, thumbSize, 16);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = "#e2e8f0";
        ctx.beginPath();
        ctx.roundRect(thumbX, thumbY, thumbSize, thumbSize, 16);
        ctx.fill();
        ctx.fillStyle = "#94a3b8";
        ctx.font = "600 22px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Sem foto", thumbX + thumbSize / 2, thumbY + thumbSize / 2);
        ctx.textAlign = "left";
      }

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
      ctx.fillText(`Prazo: ${item.prazo ? formatarDataBr(item.prazo) : "a definir"}`, textX, ty);
      ty += 32;
      ctx.font = "400 24px sans-serif";
      ctx.fillStyle = "#475569";
      ctx.fillText(`Responsável: ${item.responsavel || "-"}`, textX, ty);

      y += itemH + itemGap;
    }
  }

  ctx.fillStyle = "#94a3b8";
  ctx.font = "400 22px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Gerado pelo app Campo · Steel Frame", W / 2, canvas.height - 30);
  ctx.textAlign = "left";

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("falha ao gerar imagem"))),
      "image/jpeg",
      0.9
    );
  });
}

export function nomeArquivoImagemVistoria(vistoria: VistoriaObra): string {
  return `vistoria-${slugify(vistoria.obraNome || "vistoria")}-${vistoria.data || ""}.jpg`;
}

/**
 * Compartilha a imagem-resumo da vistoria inteira via Web Share API
 * (abre direto o seletor de apps do celular, incluindo WhatsApp). Se o
 * navegador não suportar compartilhar arquivos, baixa a imagem e abre o
 * WhatsApp Web com um texto avisando para anexar a imagem baixada.
 */
export async function compartilharImagemVistoria(vistoria: VistoriaObra): Promise<void> {
  const blob = await gerarImagemVistoria(vistoria);
  const fileName = nomeArquivoImagemVistoria(vistoria);
  const file = new File([blob], fileName, { type: "image/jpeg" });

  const nav = navigator as Navigator & {
    canShare?: (data?: ShareData) => boolean;
    share?: (data: ShareData) => Promise<void>;
  };

  if (nav.canShare && nav.share && nav.canShare({ files: [file] })) {
    try {
      await nav.share({
        files: [file],
        title: "Vistoria de Obra",
        text: `Vistoria - ${vistoria.obraNome}`,
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
      `Vistoria - ${vistoria.obraNome}. Confira a imagem baixada.`
    )}`,
    "_blank"
  );
}
