import { NextRequest, NextResponse } from "next/server";
import { atualizarVistoriaDb, excluirVistoriaDb } from "@/lib/vistoria-db";
import type { VistoriaObra } from "@/lib/vistoria-types";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const vistoria = (await req.json()) as VistoriaObra;
  if (vistoria.id !== id) {
    return NextResponse.json({ error: "ID inconsistente" }, { status: 400 });
  }
  try {
    await atualizarVistoriaDb(vistoria);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao atualizar vistoria" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await excluirVistoriaDb(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao excluir vistoria" }, { status: 500 });
  }
}
