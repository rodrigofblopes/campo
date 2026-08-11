import { NextRequest, NextResponse } from "next/server";

interface DadosComentario {
  equipe: string;
  servico: string;
  areaM2: number;
  diariasAjudante: number;
  diariasProfissional: number;
  profissionaisNomes: string[];
  data: string;
}

// Exemplos reais de RDO já escritos pelo usuário — usados como referência de
// estilo/formato pro comentário gerado por IA. Tom técnico e narrativo,
// sempre "A equipe de X, composta por N colaboradores, executou/concluiu/
// deu continuidade a Y" (ou citando nomes direto quando é 1-3 pessoas),
// nunca menciona custo, diária ou RUP.
const EXEMPLOS_ESTILO = `A equipe de paver, composta por 3 colaboradores, deu continuidade ao assentamento de paver na calçada, preparando o solo na fachada frontal e iniciando a colocação do piso tátil na lateral direita.

A equipe de pintura, composta por 4 colaboradores, executou o lixamento e o emassamento do teto e da parede do salão principal.

William executou os recortes das luminárias no teto.

Kaun e Rafael executaram a impermeabilização da caixa d'água, enquanto Venâncio realizava impermeabilizações e ajustes nas placas.

A equipe de piso vinílico, composta por 3 colaboradores, executou a passagem do Primer RU antiumidade (bicomponente), que serve como barreira de vapor e evita que a umidade do solo suba, destrua a cola e solte ou mofe o piso, nos ambientes AT.01 até AT.08 e Assistentes, para no dia seguinte serem aplicados o Primer Flex e o autonivelante. Nos ambientes Coworking 01 e 02, AT.09 até AT.13, Sala de Negócios, Gerência e Reunião, foi realizado o assentamento do piso vinílico, restando apenas a recepção e a área de espera.

A equipe de construção a seco, composta por 2 colaboradores, concluiu a impermeabilização da caixa d'água e a limpeza da obra.`;

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
  const { equipe, servico, areaM2, diariasAjudante, diariasProfissional, profissionaisNomes, data } = dados;

  if (!equipe || !servico) {
    return NextResponse.json({ error: "equipe e servico são obrigatórios" }, { status: 400 });
  }

  const qtdPessoas = profissionaisNomes?.length || 0;
  const listaProfissionais = qtdPessoas > 0 ? profissionaisNomes.join(", ") : null;

  const composicao: string[] = [];
  if (diariasAjudante > 0) composicao.push(`${diariasAjudante} diária(s) de ajudante`);
  if (diariasProfissional > 0) composicao.push(`${diariasProfissional} diária(s) de profissional`);

  const prompt = `Você escreve o RDO (Relatório Diário de Obra) de uma construção em Steel Frame, no lugar do engenheiro responsável. Abaixo estão trechos reais que ele já escreveu em RDOs anteriores — use-os SOMENTE como referência de estilo, tom e formato (não repita o conteúdo deles):

"""
${EXEMPLOS_ESTILO}
"""

Características desse estilo, que você deve seguir à risca:
- Frases diretas, no passado ("executou", "concluiu", "deu continuidade a", "iniciou"), tom técnico e descritivo, sem enrolação.
- Quando há poucas pessoas (1 a 3) e os nomes são conhecidos, cite os nomes diretamente como sujeito da frase (ex.: "William executou...", "Kaun e Rafael executaram... enquanto Venâncio..."). Quando é uma equipe maior ou sem nomes, use "A equipe de [nome da equipe], composta por N colaborador(es), executou...".
- Pode detalhar local/ambiente e, quando fizer sentido técnico, o motivo ou próximo passo (ex.: "para preparo do contrapiso").
- NUNCA mencione valores em reais, preço de diária, RUP, produtividade ou qualquer número financeiro — o RDO documental descreve apenas o que foi executado fisicamente.
- 1 a 3 frases, português do Brasil, sem título, sem markdown, sem aspas.

Agora escreva o comentário para este serviço:
- Data: ${data}
- Equipe: ${equipe}
- Serviço executado: ${servico}
${listaProfissionais ? `- Nome(s) de quem executou (${qtdPessoas} pessoa(s)): ${listaProfissionais}` : `- Quantidade de pessoas: não informado`}
- Área executada: ${areaM2} m²
${composicao.length > 0 ? `- Mão de obra empregada: ${composicao.join(" + ")} (não cite esses números na resposta, é só contexto)` : ""}

Responda apenas com o texto do comentário.`;

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
