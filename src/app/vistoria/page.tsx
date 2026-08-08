import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Camera } from "lucide-react";
import { OBRAS } from "@/lib/obras";
import { Card, Badge } from "@/components/ui";
import type { StatusObra } from "@/lib/obras";

const STATUS_LABEL: Record<StatusObra, string> = {
  em_andamento: "Em andamento",
  planejamento: "Planejamento",
  concluida: "Concluída",
};

const STATUS_VARIANT: Record<StatusObra, "success" | "warning" | "default"> = {
  em_andamento: "success",
  planejamento: "warning",
  concluida: "default",
};

export default function VistoriaIndexPage() {
  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-10 sm:py-16">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600">
          <Camera className="text-white" size={26} />
        </div>
        <h1 className="text-3xl font-black text-slate-900">Vistoria de Obra</h1>
        <p className="mt-2 text-sm text-slate-500">
          Escolha a obra para registrar pendências, foto, prazo e enviar o PDF
          por WhatsApp. Acesso livre — sem senha.
        </p>
      </div>

      <div className="space-y-4">
        {OBRAS.map((o) => (
          <Link key={o.id} href={`/vistoria/${o.id}`}>
            <Card className="transition-all hover:border-blue-300 hover:shadow-md">
              <div className="flex w-full items-center gap-4 text-left">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Camera size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">{o.nome}</h2>
                    <Badge variant={STATUS_VARIANT[o.status]}>
                      {STATUS_LABEL[o.status]}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500">{o.descricao}</p>
                </div>
                <ArrowRight className="shrink-0 text-slate-300" size={20} />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-10 flex items-center justify-center gap-2 text-center text-xs text-slate-400">
        <Image src="/campo-mark.svg" alt="Campo" width={14} height={14} />
        Aplicativo Campo · os dashboards de produtividade ficam em acesso
        restrito na home.
      </div>
    </div>
  );
}
