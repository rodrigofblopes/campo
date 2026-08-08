import { NextRequest, NextResponse } from "next/server";
import { listarVistorias, criarVistoria } from "@/lib/vistoria-db";
import type { VistoriaObra } from "@/lib/vistoria-types";

export async function GET(req: NextRequest) {
  const obraId = req.nextUrl.searchParams.get("obraId");
  if (!obraId) {
    return NextResponse.json({ error: "obraId é obrigatório" }, { status: 400 });
  }
  try {
    const vistorias = await listarVistorias(obraId);
    return NextResponse.json({ vistorias });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao buscar vistorias" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const vistoria = (await req.json()) as VistoriaObra;
  try {
    await criarVistoria(vistoria);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao salvar vistoria" }, { status: 500 });
  }
}
