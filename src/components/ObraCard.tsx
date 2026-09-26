import Link from "next/link";
import { ArrowRight, Building2, MapPin } from "lucide-react";
import { Card, Badge } from "@/components/ui";
import { melhorDestinoDisponivel, type ObraMeta, type StatusObra } from "@/lib/obras";

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

/**
 * Card de obra na home. Entrada livre — sem senha: cai direto no app da
 * obra (Nova Vistoria). A área de Produtividade continua protegida, mas a
 * senha só é pedida lá dentro, ao clicar em "Produtividade" no menu.
 */
export function ObraCard({ obra }: { obra: ObraMeta }) {
  const destino = melhorDestinoDisponivel(obra.id, obra);
  return (
    <Link href={destino.href} className="block">
      <Card className="transition-all hover:border-slate-300 hover:shadow-md">
        <div className="flex w-full items-center gap-4 text-left">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <Building2 size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{obra.nome}</h2>
              <Badge variant={STATUS_VARIANT[obra.status]}>
                {STATUS_LABEL[obra.status]}
              </Badge>
            </div>
            <p className="mt-0.5 text-sm text-slate-500">{obra.descricao}</p>
            {obra.localizacao && (
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                <MapPin size={12} /> {obra.localizacao}
              </p>
            )}
          </div>
          <ArrowRight className="shrink-0 text-slate-300" size={20} />
        </div>
      </Card>
    </Link>
  );
}
 
