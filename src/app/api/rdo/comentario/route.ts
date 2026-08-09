import { NextRequest, NextResponse } from "next/server";

interface DadosComentario {
  equipe: string;
  servico: string;
  areaM2: number;
  diarias: number;
  precoDiaria: number;
  profissionaisNomes: string[];
  data: string;
}

// Gera, com IA, um comentário curto (estilo RDO documental) descrevendo o
// serviço executado — usa a Anthropic API diretamente por fetch, sem SDK
// extra, lendo a chave de ANTHROPIC_API_KEY (configurada na Vercel).
export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY não configurada no servidor." },
      { status: 500 }
    );
  }

  const dados = (await req.json()) as DadosComentario;
  const { equipe, servico, areaM2, diarias, precoDiaria, profissionaisNomes, data } = dados;

  if (!equipe || !servico) {
    return NextResponse.json({ error: "equipe e servico são obrigatórios" }, { status: 400 });
  }

  const rup = areaM2 > 0 ? diarias / areaM2 : 0;
  const custoTotal = diarias * precoDiaria;
  const listaProfissionais =
    profissionaisNomes && profissionaisNomes.length > 0
      ? profissionaisNomes.join(", ")
      : "não informados";

  const prompt = `Você está redigindo um trecho para o Relatório Diário de Obra (RDO) de uma construção em Steel Frame. Escreva um comentário curto (1 a 3 frases, tom técnico e objetivo, em português do Brasil) descrevendo o serviço executado abaixo, adequado para constar no RDO documental da obra.

Dados do serviço:
- Data: ${data}
- Equipe: ${equipe}
- Serviço: ${servico}
- Profissionais executando: ${listaProfissionais}
- Área executada: ${areaM2} m²
- Diárias empregadas: ${diarias}
- RUP (diárias por m²): ${rup.toFixed(3)}
- Custo total (diárias × preço médio): R$ ${custoTotal.toFixed(2)}

Responda apenas com o texto do comentário, sem título, sem markdown e sem aspas.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const texto = await res.text();
      console.error("Erro na API da Anthropic:", res.status, texto);
      return NextResponse.json({ error: "Falha ao gerar comentário com IA" }, { status: 502 });
    }

    const json = (await res.json()) as {
      content?: { type: string; text?: string }[];
    };
    const comentario =
      json.content
        ?.filter((bloco) => bloco.type === "text" && bloco.text)
        .map((bloco) => bloco.text)
        .join(" ")
        .trim() || "";

    if (!comentario) {
      return NextResponse.json({ error: "IA não retornou comentário" }, { status: 502 });
    }

    return NextResponse.json({ comentario });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao chamar a IA" }, { status: 500 });
  }
}
