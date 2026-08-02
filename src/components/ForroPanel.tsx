"use client";

import { Card, PercentualDestaque, AreaDestaque } from "@/components/ui";
import { useObra } from "@/context/ObraContext";
import { formatarNumero } from "@/lib/calculations";
import {
  areaEstruturadaForro,
  areaExecutadaForro,
  areaTotalForro,
  formatarDataForro,
  percentualForro,
  statusForro,
} from "@/lib/forro";

const STATUS_LABEL = {
  pendente: "Pendente",
  estruturado: "Estruturado",
  concluido: "Concluído",
} as const;

const STATUS_CLASS = {
  pendente: "bg-slate-100 text-slate-500",
  estruturado: "bg-amber-100 text-amber-800",
  concluido: "bg-emerald-100 text-emerald-800",
} as const;

export function ForroPanel() {
  const { obra } = useObra();
  const forro = obra.forro ?? [];

  const areaTotal = areaTotalForro(forro);
  const areaEstruturada = areaEstruturadaForro(forro);
  const areaExecutada = areaExecutadaForro(forro);
  const pct = percentualForro(forro);

  if (forro.length === 0) {
    return (
      <Card>
        <p className="text-sm text-slate-500">
          Nenhum ambiente de forro na planilha — somente consulta após
          sincronização da aba Forro.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="flex flex-col items-center bg-gradient-to-br from-slate-900 to-slate-800 py-8 text-white">
        <p className="text-sm font-medium uppercase tracking-widest text-slate-400">
          Forro — estruturação e plaqueamento
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-8">
          <PercentualDestaque percentual={pct} size="xl" showLabel={false} variant="dark" />
          <AreaDestaque
            produzida={areaExecutada}
            escopo={areaTotal}
            size="lg"
            variant="dark"
            showLabel={false}
          />
        </div>
        <p className="mt-4 text-center text-sm text-slate-400">
          {formatarNumero(areaExecutada, 1)} m² plaqueados de {formatarNumero(areaTotal, 1)} m²
          · {formatarNumero(areaEstruturada, 1)} m² já estruturados · {forro.length} ambientes
        </p>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
          <h3 className="font-semibold text-slate-900">Ambientes — escopo e execução</h3>
          <p className="text-xs text-slate-500">
            Estruturação (perfis) e plaqueamento (fechamento) por ambiente
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Ambiente</th>
                <th className="px-4 py-3 text-right">Área (m²)</th>
                <th className="px-4 py-3">Estruturação</th>
                <th className="px-4 py-3">Plaqueamento</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {forro.map((f) => {
                const status = statusForro(f);
                return (
                  <tr key={f.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{f.ambiente}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      {formatarNumero(f.areaM2, 2)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatarDataForro(f.dataEstruturacao)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatarDataForro(f.dataPlaqueamento)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_CLASS[status]}`}
                      >
                        {STATUS_LABEL[status]}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-semibold">
                <td className="px-4 py-3">Total</td>
                <td className="px-4 py-3 text-right">{formatarNumero(areaTotal, 2)}</td>
                <td className="px-4 py-3" colSpan={2}>
                  {formatarNumero(areaEstruturada, 2)} m² estruturados
                </td>
                <td className="px-4 py-3 text-center">{formatarNumero(pct, 1)}%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}
