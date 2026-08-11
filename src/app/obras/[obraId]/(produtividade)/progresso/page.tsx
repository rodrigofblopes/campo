import { redirect } from "next/navigation";
import { hrefGrupo } from "@/lib/grupos-nav";

export default async function ProgressoRedirectPage({
  params,
}: {
  params: Promise<{ obraId: string }>;
}) {
  const { obraId } = await params;
  redirect(hrefGrupo(obraId, "Plaqueamento Externo"));
}
