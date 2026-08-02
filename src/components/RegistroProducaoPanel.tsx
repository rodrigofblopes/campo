"use client";

import { Card } from "@/components/ui";
import { useObra } from "@/context/ObraContext";
import { formatarNumero } from "@/lib/calculations";
import { labelServico } from "@/lib/servicos";
import type { Servico } from "@/lib/types";

interface RegistroProducaoPanelProps {
  titulo?: string;
  descricao?: string;
  servicosFiltro?: Servico[];
}

export function RegistroProducaoPanel({
  titulo = "Produção diária",
  descricao = "Apontamentos importados da planilha — somente consulta.",
  servicosFiltro,
}: RegistroProducaoPanelProps) {
  const { obra } = useObra();

  const registros = obra.registros
    .filter((r) => !servicosFiltro?.length || servicosFiltro.includes(r.servico))
    .sort((a, b) => b.data.localeCompare(a.data));

  return (
    <div className="mt-8">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">{titulo}</h3>
        <p className="mt-0.5 text-sm text-slate-500">{descricao}</p>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Equipe</th>
                <th className="px-4 py-3">Localização</th>
                <th className="px-4 py-3">Serviço</th>
                <th className="px-4 py-3 text-right">Área (m²)</th>
                <th className="px-4 py-3">Obs.</th>
              </tr>
            </thead>
            <tbody>
              {registros.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Nenhum apontamento registrado.
                  </td>
                </tr>
              ) : (
                registros.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-4 py-2.5">
                      {new Date(r.data + "T12:00:00").toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-2.5">{r.equipe}</td>
                    <td className="px-4 py-2.5">{r.localizacao}</td>
                    <td className="px-4 py-2.5 text-slate-600">
                      {labelServico(r.servico)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium">
                      {formatarNumero(r.areaM2, 2)}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-2.5 text-xs text-slate-400">
                      {r.observacao}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
