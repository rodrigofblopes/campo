"use client";

import { Card } from "@/components/ui";
import { useObra } from "@/context/ObraContext";
import { formatarNumero } from "@/lib/calculations";
import {
  areaTotalParedes,
  areaExecutadaParedes,
  formatarDataExecucao,
  labelParede,
  produzidoParede,
} from "@/lib/paredes-drywall";
import type { StatusParedeDrywall } from "@/lib/types";

const STATUS_LABEL: Record<StatusParedeDrywall, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluida: "Concluída",
};

export function ParedesDrywallPanel() {
  const { obra } = useObra();
  const paredes = obra.paredesDrywall ?? [];

  const areaCadastrada = areaTotalParedes(paredes);
  const areaExecutada = areaExecutadaParedes(paredes);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
            <h3 className="font-semibold text-slate-900">Planta baixa — Painéis Internos</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Painéis numerados conforme o projeto
            </p>
          </div>
          <div className="relative aspect-[4/3] min-h-[280px] bg-slate-100">
            <iframe
              src="/planta-drywall.pdf"
              title="Planta baixa painéis de drywall"
              className="absolute inset-0 h-full w-full border-0"
            />
          </div>
          <div className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
            <a
              href="/planta-drywall.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-600 hover:text-blue-800"
            >
              Abrir PDF em tela cheia
            </a>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-slate-900">Resumo dos painéis</h3>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-center">
              <div className="text-2xl font-black text-slate-900">{paredes.length}</div>
              <div className="text-xs text-slate-500">Painéis</div>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-center">
              <div className="text-2xl font-black text-emerald-700">
                {paredes.filter((p) => p.status === "concluida").length}
              </div>
              <div className="text-xs text-slate-500">Concluídas</div>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-center">
              <div className="text-2xl font-black text-amber-700">
                {paredes.filter((p) => p.status === "em_andamento").length}
              </div>
              <div className="text-xs text-slate-500">Em andamento</div>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-center">
              <div className="text-2xl font-black text-blue-700">
                {formatarNumero(areaExecutada, 0)}
              </div>
              <div className="text-xs text-slate-500">m² executados</div>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-center">
              <div className="text-2xl font-black text-slate-700">
                {formatarNumero(areaCadastrada, 0)}
              </div>
              <div className="text-xs text-slate-500">m² total obra</div>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-600">
            Dados importados da planilha — somente consulta. Nos apontamentos de
            produção, cada painel aparece como{" "}
            <strong>Painel 01</strong>, <strong>Painel 02</strong>, etc.
          </p>
        </Card>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
          <h3 className="font-semibold text-slate-900">Propriedades por painel</h3>
          <p className="text-xs text-slate-500">Cadastro da planilha — somente consulta</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-white text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2">Nº</th>
                <th className="px-3 py-2">Pavimento</th>
                <th className="px-3 py-2">Ambiente</th>
                <th className="px-3 py-2 text-right">Comp. (m)</th>
                <th className="px-3 py-2 text-right">Alt. (m)</th>
                <th className="px-3 py-2 text-right">Área (m²)</th>
                <th className="px-3 py-2 text-right">Esp. (mm)</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Execução</th>
                <th className="px-3 py-2 text-right">Produzido</th>
              </tr>
            </thead>
            <tbody>
              {paredes.map((p) => {
                const produzido = produzidoParede(p.codigo, obra.registros);
                return (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-3 py-2.5 font-bold text-slate-900">
                      {labelParede(p.codigo)}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">{p.pavimento || "—"}</td>
                    <td className="px-3 py-2.5 text-slate-600">{p.ambiente || "—"}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {p.comprimentoM != null ? formatarNumero(p.comprimentoM, 2) : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {p.alturaM != null ? formatarNumero(p.alturaM, 2) : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums">
                      {p.areaM2 != null ? formatarNumero(p.areaM2, 2) : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {p.espessuraMm ?? "—"}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">{p.tipo || "—"}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          p.status === "concluida"
                            ? "bg-emerald-100 text-emerald-800"
                            : p.status === "em_andamento"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {STATUS_LABEL[p.status]}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-sm font-medium text-slate-800">
                      {p.dataExecucao ? (
                        <span className="text-emerald-700">
                          {formatarDataExecucao(p.dataExecucao)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium tabular-nums text-blue-700">
                      {produzido > 0 ? `${formatarNumero(produzido, 1)} m²` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
