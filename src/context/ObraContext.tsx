"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import type { Obra, ProgressoLocal, ResumoLocalizacao } from "@/lib/types";
import { agruparProducao, calcularProgressoObra } from "@/lib/calculations";
import { labelParede } from "@/lib/paredes-drywall";
import { labelPorcelanatoCurto } from "@/lib/porcelanato";
import { localizacoesQuantitativo } from "@/lib/escopo";
import { getObraMeta, type ObraMeta } from "@/lib/obras";

interface ObraContextValue {
  obraId: string;
  obraMeta: ObraMeta;
  obra: Obra;
  resumosCalculados: ResumoLocalizacao[];
  progresso: ProgressoLocal[];
  localizacoesEscopo: string[];
  localizacoesProducao: string[];
  localizacoes: string[];
  equipes: string[];
}

const ObraContext = createContext<ObraContextValue | null>(null);

export function ObraProvider({
  obraId,
  children,
}: {
  obraId: string;
  children: ReactNode;
}) {
  const obraMeta = getObraMeta(obraId);
  if (!obraMeta) {
    throw new Error(`Obra "${obraId}" não encontrada em src/lib/obras.ts`);
  }
  const obra = obraMeta.obra;

  const resumosCalculados = useMemo(
    () => agruparProducao(obra.registros),
    [obra.registros]
  );

  const progresso = useMemo(() => calcularProgressoObra(obra), [obra]);

  const localizacoesEscopo = useMemo(
    () => obra.escopo.map((e) => e.localizacao),
    [obra.escopo]
  );

  const localizacoesProducao = useMemo(() => {
    const set = new Set<string>();
    for (const loc of localizacoesEscopo) set.add(loc);
    for (const loc of localizacoesQuantitativo(obra)) set.add(loc);
    for (const p of obra.paredesDrywall ?? []) set.add(labelParede(p.codigo));
    for (const t of obra.tiposPorcelanato ?? [])
      set.add(labelPorcelanatoCurto(t.descricao));
    for (const r of obra.registros) set.add(r.localizacao);
    return [...set].sort();
  }, [obra, localizacoesEscopo]);

  const equipes = useMemo(
    () => [...new Set(obra.registros.map((r) => r.equipe))].sort(),
    [obra.registros]
  );

  return (
    <ObraContext.Provider
      value={{
        obraId,
        obraMeta,
        obra,
        resumosCalculados,
        progresso,
        localizacoesEscopo,
        localizacoesProducao,
        localizacoes: localizacoesProducao,
        equipes,
      }}
    >
      {children}
    </ObraContext.Provider>
  );
}

export function useObra() {
  const ctx = useContext(ObraContext);
  if (!ctx) throw new Error("useObra deve ser usado dentro de ObraProvider");
  return ctx;
}
