import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Camera } from "lucide-react";
import { OBRAS } from "@/lib/obras";
import { ObraCard } from "@/components/ObraCard";
import { Card } from "@/components/ui";

export default function ObrasHomePage() {
  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-10 sm:py-16">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900">
          <Image src="/campo-mark.svg" alt="Campo" width={30} height={30} priority />
        </div>
        <h1 className="text-3xl font-black text-slate-900">Campo</h1>
        <p className="mt-2 text-sm text-slate-500">
          Medição de produtividade e gestão de obras em Steel Frame
        </p>
      </div>

      <Link href="/vistoria" className="mb-8 block">
        <Card className="border-blue-200 bg-blue-50/60 transition-all hover:border-blue-300 hover:shadow-md">
          <div className="flex w-full items-center gap-4 text-left">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Camera size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-slate-900">Vistoria de Obra</h2>
              <p className="mt-0.5 text-sm text-slate-600">
                Registre pendências com foto e envie a Atividade por WhatsApp.
                Acesso livre, sem senha.
              </p>
            </div>
            <ArrowRight className="shrink-0 text-blue-400" size={20} />
          </div>
        </Card>
      </Link>

      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
        Dashboards de produtividade · acesso restrito
      </p>
      <div className="space-y-4">
        {OBRAS.map((o) => (
          <ObraCard key={o.id} obra={o} />
        ))}
      </div>

      <p className="mt-10 text-center text-xs text-slate-400">
        Cada obra tem seu próprio dashboard, planilha e cronograma — o mesmo
        método, replicado obra a obra.
      </p>
    </div>
  );
}
