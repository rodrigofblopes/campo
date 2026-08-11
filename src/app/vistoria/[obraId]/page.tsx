import { redirect } from "next/navigation";

// Rota antiga (ainda usada em links já compartilhados no WhatsApp) —
// redireciona para o novo endereço dentro do menu unificado da obra.
export default async function VistoriaObraRedirect({
  params,
}: {
  params: Promise<{ obraId: string }>;
}) {
  const { obraId } = await params;
  redirect(`/obras/${obraId}/vistoria`);
}
