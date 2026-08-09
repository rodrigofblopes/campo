import { NextRequest, NextResponse } from "next/server";
import { excluirRegistroRdoDb } from "@/lib/rdo-db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await excluirRegistroRdoDb(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao excluir registro" }, { status: 500 });
  }
}
