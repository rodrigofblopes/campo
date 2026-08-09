import { NextRequest, NextResponse } from "next/server";
import { listarProfissionaisDb, criarProfissionalDb } from "@/lib/rdo-db";
import type { Profissional } from "@/lib/rdo-types";

export async function GET(req: NextRequest) {
  const obraId = req.nextUrl.searchParams.get("obraId");
  if (!obraId) {
    return NextResponse.json({ error: "obraId é obrigatório" }, { status: 400 });
  }
  try {
    const profissionais = await listarProfissionaisDb(obraId);
    return NextResponse.json({ profissionais });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao buscar profissionais" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const profissional = (await req.json()) as Profissional;
  try {
    await criarProfissionalDb(profissional);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao salvar profissional" }, { status: 500 });
  }
}
