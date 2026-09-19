import type { Obra } from "./types";

// Obra nova — ainda sem planilha de produtividade alimentada. Segue o mesmo
// padrão do que foi feito para a Amaggi antes de fechar: cadastro vazio,
// só para a obra aparecer no app (card, Vistoria, RDO, PCP). Quando a
// planilha "Produtividade Loja Espaço Smart" existir, gerar o escopo e os
// registros a partir dela (ver scripts/sync-from-excel.mjs) e preencher
// aqui.

export const OBRA_LOJA_ESPACO_SMART: Obra = {
  id: "loja-espaco-smart-pvh-001",
  nome: "Loja Espaço Smart - PVH",
  cliente: "Espaço Smart",
  escopo: [],
  registros: [],
  resumos: [],
  observacoesGerais:
    "Obra cadastrada sem planilha de produtividade ainda — escopo e apontamentos entram assim que a planilha for alimentada.",
};
