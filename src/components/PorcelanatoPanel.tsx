"use client";

import { Card, PercentualDestaque, AreaDestaque } from "@/components/ui";
import { useObra } from "@/context/ObraContext";
import { formatarNumero } from "@/lib/calculations";
import {
  areaExecutadaPorTipo,
  areaExecutadaPorcelanato,
  areaTotalPorcelanato,
  formatarDataPorcelanato,
  getTipoPorcelanato,
  labelPorcelanatoCurto,
  percentualPorcelanato,
} from "@/lib/porcelanato";

export function PorcelanatoPanel() {
  const { obra } = useObra();
  const tipos = obra.tiposPorcelanato ?? [];
  const apontamentos = obra.apontamentosPorcelanato ?? [];

  const areaTotal = areaTotalPorcelanato(tipos);
  const areaExecutada = areaExecutadaPorcelanato(apontamentos);
  const pct = percentualPorcelanato(tipos, apontamentos);

  if (tipos.length === 0) {
    return (
      <Card>
        <p className="text-sm text-slate-500">
          Nenhum tipo de porcelanato na planilha — somente consulta após
          sincronização da aba Porcelanato.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="flex flex-col items-center bg-gradient-to-br from-slate-900 to-slate-800 py-8 text-white">
        <p className="text-sm font-medium uppercase tracking-widest text-slate-400">
          Assentamento de porcelanato
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
          {formatarNumero(areaExecutada, 1)} m² executados de {formatarNumero(areaTotal, 1)} m²
          · {tipos.length} tipos de material
        </p>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
          <h3 className="font-semibold text-slate-900">Tipos de porcelanato — escopo</h3>
          <p className="text-xs text-slate-500">Área total por material (coluna direita da planilha)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3 text-right">Total (m²)</th>
                <th className="px-4 py-3 text-right">Executado (m²)</th>
                <th className="px-4 py-3 text-center">%</th>
              </tr>
            </thead>
            <tbody>
              {tipos.map((tipo) => {
                const exec = areaExecutadaPorTipo(apontamentos, tipo.id);
                const pctTipo =
                  tipo.areaTotalM2 > 0
                    ? Math.min(100, Math.round((exec / tipo.areaTotalM2) * 1000) / 10)
                    : 0;
                return (
                  <tr key={tipo.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {labelPorcelanatoCurto(tipo.descricao)}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500">{tipo.descricao}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      {formatarNumero(tipo.areaTotalM2, 2)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-blue-700">
                      {exec > 0 ? formatarNumero(exec, 2) : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ${
                          pctTipo >= 100
                            ? "bg-emerald-100 text-emerald-800"
                            : pctTipo > 0
                              ? "bg-blue-100 text-blue-800"
                              : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {formatarNumero(pctTipo, 1)}%
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
                <td className="px-4 py-3 text-right text-blue-700">
                  {formatarNumero(areaExecutada, 2)}
                </td>
                <td className="px-4 py-3 text-center">{formatarNumero(pct, 1)}%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
          <h3 className="font-semibold text-slate-900">Produção executada</h3>
          <p className="text-xs text-slate-500">Apontamentos com data (coluna esquerda da planilha)</p>
        </div>
        {apontamentos.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-500">Nenhum apontamento ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3 text-right">Área (m²)</th>
                </tr>
              </thead>
              <tbody>
                {[...apontamentos]
                  .sort((a, b) => b.dataExecucao.localeCompare(a.dataExecucao))
                  .map((ap) => {
                    const tipo = getTipoPorcelanato(tipos, ap.tipoId);
                    return (
                      <tr key={ap.id} className="border-b border-slate-50">
                        <td className="px-4 py-3 font-medium text-emerald-700">
                          {formatarDataPorcelanato(ap.dataExecucao)}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {tipo ? labelPorcelanatoCurto(tipo.descricao) : ap.tipoId}
                        </td>
                        <td className="px-4 py-3 text-right font-bold tabular-nums">
                          {formatarNumero(ap.areaExecutadaM2, 2)}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
