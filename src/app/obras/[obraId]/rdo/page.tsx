"use client";

import { AppShell } from "@/components/ui";
import { VistoriaContent } from "@/components/VistoriaContent";
import { useObra } from "@/context/ObraContext";

export default function ObraRdoPage() {
  const { obraId, obraMeta } = useObra();

  return (
    <AppShell>
      <VistoriaContent obraId={obraId} obraMeta={obraMeta} abaFixa="rdo" />
    </AppShell>
  );
}
