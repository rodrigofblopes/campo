import { NextRequest, NextResponse } from "next/server";
import { listarPrecosEquipeDb, salvarPrecoEquipeDb } from "@/lib/rdo-db";
import type { PrecoEquipe } from "@/lib/rdo-types";

export async function GET(req: NextRequest) {
  const obraId = req.nextUrl.searchParams.get("obraId");
  if (!obraId) {
    return NextResponse.json({ error: "obraId é obrigatório" }, { status: 400 });
  }
  try {
    const precos = await listarPrecosEquipeDb(obraId);
    return NextResponse.json({ precos });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao buscar preços por equipe" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const preco = (await req.json()) as PrecoEquipe;
  if (!preco.obraId || !preco.equipe) {
    return NextResponse.json({ error: "obraId e equipe são obrigatórios" }, { status: 400 });
  }
  try {
    await salvarPrecoEquipeDb(preco);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao salvar preço da equipe" }, { status: 500 });
  }
}
