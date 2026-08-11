import type { PrecoEquipe, Profissional, RegistroRdo } from "./rdo-types";

export async function listarProfissionais(obraId: string): Promise<Profissional[]> {
  try {
    const res = await fetch(`/api/profissionais?obraId=${encodeURIComponent(obraId)}`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { profissionais?: Profissional[] };
    return data.profissionais ?? [];
  } catch {
    return [];
  }
}

export async function criarProfissional(p: Profissional): Promise<boolean> {
  try {
    const res = await fetch("/api/profissionais", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function excluirProfissional(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/profissionais/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function listarRegistrosRdo(obraId: string): Promise<RegistroRdo[]> {
  try {
    const res = await fetch(`/api/rdo?obraId=${encodeURIComponent(obraId)}`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { registros?: RegistroRdo[] };
    return data.registros ?? [];
  } catch {
    return [];
  }
}

export async function criarRegistroRdo(r: RegistroRdo): Promise<boolean> {
  try {
    const res = await fetch("/api/rdo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(r),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function excluirRegistroRdo(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/rdo/${encodeURIComponent(id)}`, { method: "DELETE" });
    return res.ok;
  } catch {
    return false;
  }
}

// Preço da diária de ajudante/profissional é configurado por equipe (o
// ajudante de pedreiro tem um valor, o pedreiro outro; o ajudante de pintor
// tem um valor diferente do ajudante de pedreiro, e assim por diante) — não
// existe um preço único geral.
export async function listarPrecosEquipe(obraId: string): Promise<PrecoEquipe[]> {
  try {
    const res = await fetch(`/api/precos-equipe?obraId=${encodeURIComponent(obraId)}`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { precos?: PrecoEquipe[] };
    return data.precos ?? [];
  } catch {
    return [];
  }
}

export async function salvarPrecoEquipe(p: PrecoEquipe): Promise<boolean> {
  try {
    const res = await fetch("/api/precos-equipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Pede à IA um comentário curto (estilo RDO documental) pra esse serviço —
// se a chamada falhar (sem chave configurada, sem internet etc.), devolve
// null e quem chamou decide se deixa o campo em branco pro usuário escrever.
export async function gerarComentarioIA(dados: {
  equipe: string;
  servico: string;
  areaM2: number;
  diariasAjudante: number;
  diariasProfissional: number;
  profissionaisNomes: string[];
  data: string;
}): Promise<string | null> {
  try {
    const res = await fetch("/api/rdo/comentario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { comentario?: string };
    return json.comentario ?? null;
  } catch {
    return null;
  }
}

export interface RupProfissional {
  profissional: Profissional;
  totalDiarias: number;
  totalAreaM2: number;
  rup: number;
  custoTotal: number;
}

// RUP por profissional: cada registro de serviço é dividido igualmente
// entre quem participou (diárias e área apuradas por pessoa), somando ao
// longo de todos os registros em que o profissional aparece. O RUP de cada
// um (diárias pessoais ÷ área pessoal) acaba batendo com o RUP da equipe
// no registro — é só uma forma de repartir o total entre quem executou.
export function calcularRupPorProfissional(
  registros: RegistroRdo[],
  profissionais: Profissional[]
): RupProfissional[] {
  const porId = new Map<string, RupProfissional>();

  for (const p of profissionais) {
    porId.set(p.id, {
      profissional: p,
      totalDiarias: 0,
      totalAreaM2: 0,
      rup: 0,
      custoTotal: 0,
    });
  }

  for (const r of registros) {
    const participantes = r.profissionaisIds.filter((id) => porId.has(id));
    if (participantes.length === 0) continue;
    const diariasTotaisRegistro = r.diariasAjudante + r.diariasProfissional;
    const custoTotalRegistro =
      r.diariasAjudante * r.precoDiariaAjudante + r.diariasProfissional * r.precoDiariaProfissional;
    const diariasPorPessoa = diariasTotaisRegistro / participantes.length;
    const areaPorPessoa = r.areaM2 / participantes.length;
    const custoPorPessoa = custoTotalRegistro / participantes.length;
    for (const id of participantes) {
      const acc = porId.get(id)!;
      acc.totalDiarias += diariasPorPessoa;
      acc.totalAreaM2 += areaPorPessoa;
      acc.custoTotal += custoPorPessoa;
    }
  }

  const resultado = Array.from(porId.values());
  for (const item of resultado) {
    item.rup = item.totalAreaM2 > 0 ? item.totalDiarias / item.totalAreaM2 : 0;
  }
  return resultado.sort((a, b) => b.totalDiarias - a.totalDiarias);
}
