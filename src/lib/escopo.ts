import type { EscopoLocalizacao, Obra, QuantitativoServico, RegistroProducao, Servico } from "./types";
import { normalizarLocalizacao } from "./localizacoes";
import { SERVICOS_PLAQUEAMENTO } from "./servicos";
import { labelParede, quantitativosDrywall } from "./paredes-drywall";
import { quantitativosInterno } from "./paredes-interno";
import { quantitativosPorcelanato } from "./porcelanato";
import { quantitativosForro } from "./forro";

/** Converte escopo legado (1 m² por local × 3 serviços de plaqueamento) em quantitativos. */
export function derivarQuantitativosDeEscopo(
  escopo: EscopoLocalizacao[]
): QuantitativoServico[] {
  const items: QuantitativoServico[] = [];
  for (const item of escopo) {
    for (const servico of SERVICOS_PLAQUEAMENTO) {
      items.push({
        localizacao: item.localizacao,
        servico,
        totalM2: item.areaTotalM2,
      });
    }
  }
  return items;
}

export function quantitativosObra(obra: Obra): QuantitativoServico[] {
  const base = obra.quantitativos?.length
    ? obra.quantitativos
    : derivarQuantitativosDeEscopo(obra.escopo);

  const extras: QuantitativoServico[] = [];

  if (obra.tiposPorcelanato?.length) {
    extras.push(...quantitativosPorcelanato(obra.tiposPorcelanato));
  }
  if (obra.paredesDrywall?.length) {
    extras.push(...quantitativosDrywall(obra.paredesDrywall));
  }
  if (obra.paredesInterno?.length) {
    extras.push(...quantitativosInterno(obra.paredesInterno));
  }
  if (obra.forro?.length) {
    extras.push(...quantitativosForro(obra.forro));
  }

  if (!extras.length) return base;

  const servicosExtras = new Set(extras.map((q) => q.servico));
  const baseFiltrado = base.filter((q) => !servicosExtras.has(q.servico));
  return [...baseFiltrado, ...extras];
}

export function servicoTemEscopo(obra: Obra, servico: Servico): boolean {
  return quantitativosObra(obra).some((q) => q.servico === servico);
}

export function totalEscopoServico(obra: Obra, servico: Servico): number {
  return quantitativosObra(obra)
    .filter((q) => q.servico === servico)
    .reduce((s, q) => s + q.totalM2, 0);
}

export function escopoLocalServico(
  obra: Obra,
  localizacao: string,
  servico: Servico
): number {
  const alvo = normalizarLocalizacao(localizacao);
  const item = quantitativosObra(obra).find(
    (q) =>
      q.servico === servico &&
      normalizarLocalizacao(q.localizacao) === alvo
  );
  return item?.totalM2 ?? 0;
}

export function localizacoesPorServico(obra: Obra, servico: Servico): string[] {
  return [
    ...new Set(
      quantitativosObra(obra)
        .filter((q) => q.servico === servico)
        .map((q) => q.localizacao)
    ),
  ];
}

/** Escopo + apontamentos (e paredes, para drywall) válidos para um serviço. */
export function localizacoesDisponiveisServico(
  obra: Obra,
  servico: Servico,
  registros: RegistroProducao[] = obra.registros
): string[] {
  // Chave normalizada -> nome de exibição, para não listar a mesma localização
  // duas vezes quando a grafia difere entre a aba de escopo e o histórico
  // (ex.: "Frontal" vs "Fachada Frontal").
  const porChave = new Map<string, string>();
  const add = (loc: string) => {
    const chave = normalizarLocalizacao(loc);
    if (!porChave.has(chave)) porChave.set(chave, chave);
  };

  for (const loc of localizacoesPorServico(obra, servico)) add(loc);
  for (const r of registros) {
    if (r.servico === servico) add(r.localizacao);
  }
  if (servico === "Paredes de Drywall") {
    for (const p of obra.paredesDrywall ?? []) add(labelParede(p.codigo));
  }

  return [...porChave.values()].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export function localizacoesQuantitativo(obra: Obra): string[] {
  return [...new Set(quantitativosObra(obra).map((q) => q.localizacao))].sort();
}
