"use client";

import { Download, FileText } from "lucide-react";
import { AppShell, Card, PageHeader } from "@/components/ui";
import { useObra } from "@/context/ObraContext";
import { gerarRelatorioPDF } from "@/lib/pdf-report";

export default function RelatoriosPage() {
  const { obra } = useObra();

  const resumosCount =
    obra.resumos.length > 0
      ? obra.resumos.length
      : new Set(obra.registros.map((r) => `${r.localizacao}::${r.servico}`)).size;

  return (
    <AppShell>
      <PageHeader
        title="Relatório PDF"
        description="Exportação do painel de produtividade — dados atualizados pela planilha"
      />

      <Card className="max-w-2xl">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
            <FileText size={28} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900">
              Relatório de Produtividade
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Inclui progresso por serviço, resumo por localização, registro
              diário e produtividade — pronto para enviar à equipe.
            </p>

            <ul className="mt-4 space-y-1.5 text-sm text-slate-500">
              <li>• Progresso por localização (total × produzido)</li>
              <li>• Resumo por localização ({resumosCount} itens)</li>
              <li>• Registro diário ({obra.registros.length} apontamentos)</li>
              <li>• Produtividade por serviço (m²/dia, m²/h, RUP)</li>
            </ul>

            <button
              onClick={() => gerarRelatorioPDF(obra)}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Download size={18} />
              Baixar relatório PDF
            </button>
          </div>
        </div>
      </Card>

      <Card className="mt-6 max-w-2xl border-dashed border-slate-300 bg-slate-50/80">
        <h3 className="mb-2 font-semibold text-slate-900">Atualização dos dados</h3>
        <p className="text-sm text-slate-600">
          Os números do site vêm da planilha <strong>Produtividade Sicredi.xlsx</strong>.
          Para alterar produção, escopo ou apontamentos, atualize a planilha e
          solicite a publicação — o site não permite cadastro manual.
        </p>
      </Card>

      <Card className="mt-6 max-w-2xl">
        <h3 className="mb-2 font-semibold text-slate-900">Obra atual</h3>
        <p className="text-sm text-slate-600">
          <strong>{obra.nome}</strong>
          {obra.cliente && ` · Cliente: ${obra.cliente}`}
        </p>
        {obra.quantitativos?.length ? (
          <p className="mt-2 text-xs text-emerald-700">
            {obra.quantitativos.length} linhas de quantitativo carregadas
          </p>
        ) : (
          <p className="mt-2 text-xs text-slate-400">
            Escopo do plaqueamento externo (Glasroc-x, juntas, basecoat)
          </p>
        )}
      </Card>
    </AppShell>
  );
}
