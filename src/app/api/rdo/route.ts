import { NextRequest, NextResponse } from "next/server";
import { listarRegistrosRdoDb, criarRegistroRdoDb } from "@/lib/rdo-db";
import type { RegistroRdo } from "@/lib/rdo-types";

export async function GET(req: NextRequest) {
  const obraId = req.nextUrl.searchParams.get("obraId");
  if (!obraId) {
    return NextResponse.json({ error: "obraId é obrigatório" }, { status: 400 });
  }
  try {
    const registros = await listarRegistrosRdoDb(obraId);
    return NextResponse.json({ registros });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao buscar registros" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const registro = (await req.json()) as RegistroRdo;
  try {
    await criarRegistroRdoDb(registro);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao salvar registro" }, { status: 500 });
  }
}
