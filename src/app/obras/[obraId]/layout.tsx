import { notFound } from "next/navigation";
import { ObraProvider } from "@/context/ObraContext";
import { obraExiste } from "@/lib/obras";

export default async function ObraLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ obraId: string }>;
}) {
  const { obraId } = await params;

  if (!obraExiste(obraId)) {
    notFound();
  }

  return <ObraProvider obraId={obraId}>{children}</ObraProvider>;
}
