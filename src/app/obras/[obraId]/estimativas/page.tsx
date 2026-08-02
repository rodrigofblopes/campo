"use client";

import { useMemo, useState } from "react";
import { AppShell, Card, PageHeader } from "@/components/ui";
import { useObra } from "@/context/ObraContext";
import { OBRAS, getObraMeta } from "@/lib/obras";
import { calcularEstimativa } from "@/lib/estimativas";
import { formatarNumero } from "@/lib/calculations";

export default function EstimativasPage() {
  const { obra: obraAlvo, obraMeta: metaAlvo, obraId } = useObra();

  const outrasObras = OBRAS.filter((o) => o.id !== obraId);
  const [refId, setRefId] = useState(outrasObras[0]?.id ?? obraId);
  const [numEquipes, setNumEquipes] = useState(2);

  const metaRef = getObraMeta(refId) ?? metaAlvo;
  const obraRef = metaRef.obra;

  const frentes = useMemo(
    () => calcularEstimativa(obraRef, obraAlvo, numEquipes),
    [obraRef, obraAlvo, numEquipes]
  );

  const comEstimativa = frentes.filter((f) => f.diasNEquipes != null);
  const diasSequenciais = comEstimativa.reduce((s, f) => s + (f.diasNEquipes ?? 0), 0);
  const semDados = frentes.length - comEstimativa.length;

  return (
    <AppShell>
      <PageHeader
        title="Estimativas"
        description={`Projeta o prazo de ${metaAlvo.nome} usando a produtividade real (RUP) de outra obra`}
      />

      <Card className="mb-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium text-slate-500">
              Obra de referência (produtividade real)
            </span>
            <select
              value={refId}
              onChange={(e) => setRefId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {OBRAS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-500">
              Nº de equipes em {metaAlvo.nome}
            </span>
            <input
              type="number"
              min={1}
              max={10}
              value={numEquipes}
              onChange={(e) => setNumEquipes(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          RUP calculado a partir dos apontamentos reais de {metaRef.nome} (m² por dia, por
          equipe). Plaqueamento Externo considera só equipe-dias de equipes com 2 pessoas
          (modelo 1 montador + 1 ajudante); as demais frentes não têm o campo &quot;equipe&quot;
          na planilha, então herdam o tamanho de equipe usado historicamente.
        </p>
      </Card>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Card className="py-4 text-center">
          <div className="text-2xl font-black text-slate-900">
            {diasSequenciais > 0 ? formatarNumero(diasSequenciais, 1) : "—"}
          </div>
          <div className="text-xs text-slate-500">dias úteis (frentes em sequência)</div>
        </Card>
        <Card className="py-4 text-center">
          <div className="text-2xl font-black text-slate-900">
            {diasSequenciais > 0 ? formatarNumero(diasSequenciais / 5, 1) : "—"}
          </div>
          <div className="text-xs text-slate-500">semanas úteis (5 dias/semana)</div>
        </Card>
        <Card className="py-4 text-center">
          <div className="text-2xl font-black text-slate-900">{numEquipes}</div>
          <div className="text-xs text-slate-500">
            equipe{numEquipes > 1 ? "s" : ""} considerada{numEquipes > 1 ? "s" : ""}
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Frente</th>
                <th className="px-4 py-3 text-right">Escopo (m²)</th>
                <th className="px-4 py-3 text-right">RUP · 1 equipe (m²/dia)</th>
                <th className="px-4 py-3 text-right">Dias · 1 equipe</th>
                <th className="px-4 py-3 text-right">
                  Dias · {numEquipes} equipe{numEquipes > 1 ? "s" : ""}
                </th>
              </tr>
            </thead>
            <tbody>
              {frentes.map((f) => (
                <tr key={f.id} className="border-b border-slate-100">
                  <td className="px-4 py-2.5 font-medium">{f.label}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {formatarNumero(f.escopoM2, 1)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-500">
                    {f.rupM2DiaEquipe != null
                      ? `${formatarNumero(f.rupM2DiaEquipe, 1)} (${f.amostraDias}d)`
                      : "sem dados"}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {f.diasUmaEquipe != null ? formatarNumero(f.diasUmaEquipe, 1) : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold tabular-nums">
                    {f.diasNEquipes != null ? formatarNumero(f.diasNEquipes, 1) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {semDados > 0 && (
        <p className="mt-3 text-xs font-medium text-amber-600">
          {semDados} frente(s) sem RUP calculável — {metaRef.nome} ainda não tem apontamento de
          produção com data para essa frente.
        </p>
      )}

      <p className="mt-4 text-xs text-slate-400">
        Estimativa aproximada, para planejamento. Soma assume frentes em sequência; na prática
        Forro pode rodar em paralelo com Plaqueamento Interno em ambientes diferentes, o que
        encurta o total. Não considera instalações elétricas/hidráulicas (sem m² rastreado) nem
        curva de aprendizado de uma equipe nova em obra nova.
      </p>
    </AppShell>
  );
}
