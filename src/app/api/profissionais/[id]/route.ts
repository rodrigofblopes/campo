import { NextRequest, NextResponse } from "next/server";
import { excluirProfissionalDb } from "@/lib/rdo-db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await excluirProfissionalDb(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao excluir profissional" }, { status: 500 });
  }
}
