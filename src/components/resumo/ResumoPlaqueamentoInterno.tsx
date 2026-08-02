"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Card,
  PercentualDestaque,
  ProgressBar,
} from "@/components/ui";
import { useObra } from "@/context/ObraContext";
import {
  calcularProgressoServico,
  formatarNumero,
  percentualGeralObra,
} from "@/lib/calculations";
import { hrefGrupo } from "@/lib/grupos-nav";
import { totalEscopoServico } from "@/lib/escopo";
import { ordemInterno } from "@/lib/paredes-interno";
import { SERVICOS_INTERNO, labelServico } from "@/lib/servicos";
import type { Servico } from "@/lib/types";

export function ResumoPlaqueamentoInterno() {
  const { obra, obraId } = useObra();
  const [servicoAtivo, setServicoAtivo] = useState<Servico>("Plaqueamento Performa");

  const linhas = useMemo(() => {
    return calcularProgressoServico(obra, servicoAtivo).sort(
      (a, b) => ordemInterno(a.localizacao) - ordemInterno(b.localizacao)
    );
  }, [obra, servicoAtivo]);

  const totais = useMemo(() => {
    const escopo = totalEscopoServico(obra, servicoAtivo);
    const executado = linhas.reduce((s, l) => s + l.areaProduzida, 0);
    const restante = Math.max(0, escopo - executado);
    const pct =
      escopo > 0 ? Math.min(100, Math.round((executado / escopo) * 1000) / 10) : 0;
    return { escopo, executado, restante, pct };
  }, [linhas, obra, servicoAtivo]);

  const temProducao = obra.registros.some((r) =>
    SERVICOS_INTERNO.includes(r.servico)
  );

  return (
    <div>
      {!temProducao && totais.escopo > 0 && (
        <Card className="mb-6 border-dashed border-slate-300 bg-slate-50/80">
          <p className="text-sm text-slate-600">
            Escopo Performa e RU carregado da planilha. Quando houver apontamentos
            com data na aba Plaqueamento Interno, o progresso aparecerá aqui e em{" "}
            <Link
              href={hrefGrupo(obraId, "Plaqueamento Interno")}
              className="font-medium text-blue-600 hover:underline"
            >
              Frentes → Plaqueamento interno
            </Link>
            .
          </p>
        </Card>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        {SERVICOS_INTERNO.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setServicoAtivo(s)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              servicoAtivo === s
                ? "bg-slate-800 text-white shadow-sm"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {labelServico(s)}
          </button>
        ))}
      </div>

      <Card className="mb-6 p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-500">
              {labelServico(servicoAtivo)}
            </h3>
            <PercentualDestaque percentual={totais.pct} size="lg" />
          </div>
          <div className="text-right text-sm text-slate-600">
            <div>
              {formatarNumero(totais.executado, 0)} / {formatarNumero(totais.escopo, 0)} m²
            </div>
            {totais.restante > 0 && (
              <div className="font-medium text-amber-700">
                Faltam {formatarNumero(totais.restante, 0)} m²
              </div>
            )}
          </div>
        </div>
        <div className="mt-4">
          <ProgressBar percentual={totais.pct} size="large" />
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase text-slate-500">
          Por parede — {labelServico(servicoAtivo)}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                <th className="px-4 py-2">Local</th>
                <th className="px-4 py-2 text-center">Escopo (m²)</th>
                <th className="px-4 py-2 text-center">Executado (m²)</th>
                <th className="px-4 py-2 text-center">%</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((row) => (
                <tr key={row.localizacao} className="border-b border-slate-50">
                  <td className="px-4 py-2.5 font-medium">{row.localizacao}</td>
                  <td className="px-4 py-2.5 text-center tabular-nums">
                    {formatarNumero(row.totalM2, 1)}
                  </td>
                  <td className="px-4 py-2.5 text-center font-semibold tabular-nums">
                    {formatarNumero(row.areaProduzida, 1)}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {formatarNumero(row.percentual, 0)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
