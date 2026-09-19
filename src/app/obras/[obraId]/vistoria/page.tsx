"use client";

import { AppShell } from "@/components/ui";
import { AbaIndisponivel } from "@/components/AbaIndisponivel";
import { VistoriaContent } from "@/components/VistoriaContent";
import { useObra } from "@/context/ObraContext";
import { melhorDestinoDisponivel, obraTemAba } from "@/lib/obras";

export default function ObraVistoriaPage() {
  const { obraId, obraMeta } = useObra();

  if (!obraTemAba(obraMeta, "vistoria")) {
    const destino = melhorDestinoDisponivel(obraId, obraMeta);
    return (
      <AppShell>
        <AbaIndisponivel
          obraId={obraId}
          titulo="Nova Vistoria"
          mensagem={`Essa obra (${obraMeta.nome}) não tem vistoria.`}
          destinoHref={destino.href}
          destinoLabel={destino.label}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <VistoriaContent obraId={obraId} obraMeta={obraMeta} abaFixa="nova" />
    </AppShell>
  );
}
 
