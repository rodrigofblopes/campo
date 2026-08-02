"use client";

import { usePathname } from "next/navigation";
import { AppShell, PageHeader } from "@/components/ui";
import { GrupoTabs } from "@/components/GrupoTabs";

export default function FrentesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isHub = pathname === "/frentes";

  return (
    <AppShell>
      {!isHub && (
        <PageHeader
          title="Frentes de serviço"
          description="Cada aba reúne progresso, produção e documentos da frente"
        />
      )}
      {isHub && (
        <PageHeader
          title="Frentes de serviço"
          description="Escolha a frente para consultar progresso e apontamentos"
          compact
        />
      )}
      <GrupoTabs />
      {children}
    </AppShell>
  );
}
