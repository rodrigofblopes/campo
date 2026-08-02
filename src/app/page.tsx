import Image from "next/image";
import { OBRAS } from "@/lib/obras";
import { ObraCard } from "@/components/ObraCard";

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
