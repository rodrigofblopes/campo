"use client";

import { AppShell } from "@/components/ui";
import { AbaIndisponivel } from "@/components/AbaIndisponivel";
import { VistoriaContent } from "@/components/VistoriaContent";
import { useObra } from "@/context/ObraContext";
import { melhorDestinoDisponivel, obraTemAba } from "@/lib/obras";

export default function ObraPcpPage() {
  const { obraId, obraMeta } = useObra();

  if (!obraTemAba(obraMeta, "pcp")) {
    const destino = melhorDestinoDisponivel(obraId, obraMeta);
    return (
      <AppShell>
        <AbaIndisponivel
          obraId={obraId}
          titulo="PCP Semanal"
          mensagem={`Essa obra (${obraMeta.nome}) não tem PCP semanal.`}
          destinoHref={destino.href}
          destinoLabel={destino.label}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <VistoriaContent obraId={obraId} obraMeta={obraMeta} abaFixa="pcp" />
    </AppShell>
  );
}
 
