import type {
  AmbienteForro,
  ApontamentoPorcelanato,
  EscopoLocalizacao,
  Obra,
  ParedeDrywall,
  ParedePlaqueamentoInterno,
  RegistroProducao,
  TipoPorcelanato,
} from "./types";

// GERADO POR scripts/sync-from-excel-amaggi.mjs — não editar à mão.
// Rodar: node scripts/sync-from-excel-amaggi.mjs (a partir de app/)

export const OBRA_AMAGGI_DATA_VERSION = 5;

/** Aba "Plaqueamento Externo (Escopo)" da planilha Produtividade Amaggi.xlsx. */
const ESCOPO_EXTERNO_AMAGGI: EscopoLocalizacao[] = [
  {
    "localizacao": "Frontal",
    "areaTotalM2": 68.86
  },
  {
    "localizacao": "Lateral Direita",
    "areaTotalM2": 26.08
  },
  {
    "localizacao": "Fundos",
    "areaTotalM2": 86.91
  },
  {
    "localizacao": "Lateral Esquerda",
    "areaTotalM2": 28.34
  }
];

/** Aba "Histórico-Plaqueamento Externo" — apontamentos reais de produção. */
const REGISTROS_AMAGGI: RegistroProducao[] = [];

/** Aba "Paredes Internas Steel" — montagem estrutural (card "Painéis internos"). */
const PAREDES_DRYWALL_AMAGGI: ParedeDrywall[] = [
  {
    "id": "pd-amaggi-01",
    "codigo": "INT-01",
    "tipo": "steel",
    "areaM2": 21.88,
    "status": "pendente"
  },
  {
    "id": "pd-amaggi-02",
    "codigo": "INT-02",
    "tipo": "steel",
    "areaM2": 7.95,
    "status": "pendente"
  },
  {
    "id": "pd-amaggi-03",
    "codigo": "INT-03",
    "tipo": "steel",
    "areaM2": 28.34,
    "status": "pendente"
  },
  {
    "id": "pd-amaggi-04",
    "codigo": "INT-04",
    "tipo": "steel",
    "areaM2": 26.45,
    "status": "pendente"
  },
  {
    "id": "pd-amaggi-05",
    "codigo": "INT-05",
    "tipo": "steel",
    "areaM2": 11.34,
    "status": "pendente"
  },
  {
    "id": "pd-amaggi-06",
    "codigo": "INT-06",
    "tipo": "steel",
    "areaM2": 11.34,
    "status": "pendente"
  },
  {
    "id": "pd-amaggi-07",
    "codigo": "INT-07",
    "tipo": "steel",
    "areaM2": 11.34,
    "status": "pendente"
  },
  {
    "id": "pd-amaggi-08",
    "codigo": "INT-08",
    "tipo": "steel",
    "areaM2": 12.68,
    "status": "pendente"
  },
  {
    "id": "pd-amaggi-09",
    "codigo": "INT-09",
    "tipo": "steel",
    "areaM2": 11.34,
    "status": "pendente"
  },
  {
    "id": "pd-amaggi-10",
    "codigo": "INT-010",
    "tipo": "steel",
    "areaM2": 12.68,
    "status": "pendente"
  },
  {
    "id": "pd-amaggi-11",
    "codigo": "INT-011",
    "tipo": "steel",
    "areaM2": 9.71,
    "status": "pendente"
  },
  {
    "id": "pd-amaggi-12",
    "codigo": "INT-012",
    "tipo": "steel",
    "areaM2": 9.71,
    "status": "pendente"
  },
  {
    "id": "pd-amaggi-13",
    "codigo": "INT-013",
    "tipo": "steel",
    "areaM2": 13.65,
    "status": "pendente"
  },
  {
    "id": "pd-amaggi-14",
    "codigo": "INT-014",
    "tipo": "steel",
    "areaM2": 8.4,
    "status": "pendente"
  },
  {
    "id": "pd-amaggi-15",
    "codigo": "INT-015",
    "tipo": "steel",
    "areaM2": 4.5,
    "status": "pendente"
  },
  {
    "id": "pd-amaggi-16",
    "codigo": "INT-016",
    "tipo": "steel",
    "areaM2": 5.02,
    "status": "pendente"
  },
  {
    "id": "pd-amaggi-17",
    "codigo": "INT-017",
    "tipo": "steel",
    "areaM2": 35.44,
    "status": "pendente"
  },
  {
    "id": "pd-amaggi-18",
    "codigo": "INT-018",
    "tipo": "steel",
    "areaM2": 8.67,
    "status": "pendente"
  },
  {
    "id": "pd-amaggi-19",
    "codigo": "INT-019",
    "tipo": "steel",
    "areaM2": 11.31,
    "status": "pendente"
  },
  {
    "id": "pd-amaggi-20",
    "codigo": "INT-020",
    "tipo": "steel",
    "areaM2": 5.43,
    "status": "pendente"
  }
];

/** Aba "Plaqueamento Interno" — placas Performa/RU, inclui face interna das paredes externas (códigos EXT-*). */
const PAREDES_INTERNO_AMAGGI: ParedePlaqueamentoInterno[] = [
  {
    "id": "pi-amaggi-01",
    "codigo": "INT-01",
    "tipo": "steel",
    "areaM2": 21.88,
    "performaM2": 43.76
  },
  {
    "id": "pi-amaggi-02",
    "codigo": "INT-02",
    "tipo": "steel",
    "areaM2": 7.95,
    "performaM2": 15.9
  },
  {
    "id": "pi-amaggi-03",
    "codigo": "INT-03",
    "tipo": "steel",
    "areaM2": 28.34,
    "performaM2": 56.68
  },
  {
    "id": "pi-amaggi-04",
    "codigo": "INT-04",
    "tipo": "steel",
    "areaM2": 26.45,
    "performaM2": 52.9
  },
  {
    "id": "pi-amaggi-05",
    "codigo": "INT-05",
    "tipo": "steel",
    "areaM2": 11.34,
    "performaM2": 22.68
  },
  {
    "id": "pi-amaggi-06",
    "codigo": "INT-06",
    "tipo": "steel",
    "areaM2": 11.34,
    "performaM2": 22.68
  },
  {
    "id": "pi-amaggi-07",
    "codigo": "INT-07",
    "tipo": "steel",
    "areaM2": 11.34,
    "performaM2": 22.68
  },
  {
    "id": "pi-amaggi-08",
    "codigo": "INT-08",
    "tipo": "steel",
    "areaM2": 12.68,
    "performaM2": 25.36
  },
  {
    "id": "pi-amaggi-09",
    "codigo": "INT-09",
    "tipo": "steel",
    "areaM2": 11.34,
    "performaM2": 22.68
  },
  {
    "id": "pi-amaggi-10",
    "codigo": "INT-010",
    "tipo": "steel",
    "areaM2": 12.68,
    "performaM2": 25.36
  },
  {
    "id": "pi-amaggi-11",
    "codigo": "INT-011",
    "tipo": "steel",
    "areaM2": 9.71,
    "performaM2": 19.42
  },
  {
    "id": "pi-amaggi-12",
    "codigo": "INT-012",
    "tipo": "steel",
    "areaM2": 9.71,
    "performaM2": 19.42
  },
  {
    "id": "pi-amaggi-13",
    "codigo": "INT-013",
    "tipo": "steel",
    "areaM2": 13.65,
    "performaM2": 27.3
  },
  {
    "id": "pi-amaggi-14",
    "codigo": "INT-014",
    "tipo": "steel",
    "areaM2": 8.4,
    "performaM2": 16.8
  },
  {
    "id": "pi-amaggi-15",
    "codigo": "INT-015",
    "tipo": "steel",
    "areaM2": 4.5,
    "performaM2": 9
  },
  {
    "id": "pi-amaggi-16",
    "codigo": "INT-016",
    "tipo": "steel",
    "areaM2": 5.02,
    "performaM2": 10.04
  },
  {
    "id": "pi-amaggi-17",
    "codigo": "INT-017",
    "tipo": "steel",
    "areaM2": 35.44,
    "performaM2": 70.88
  },
  {
    "id": "pi-amaggi-18",
    "codigo": "INT-018",
    "tipo": "steel",
    "areaM2": 8.67,
    "performaM2": 17.34
  },
  {
    "id": "pi-amaggi-19",
    "codigo": "INT-019",
    "tipo": "steel",
    "areaM2": 11.31,
    "performaM2": 22.62
  },
  {
    "id": "pi-amaggi-20",
    "codigo": "INT-020",
    "tipo": "steel",
    "areaM2": 5.43,
    "performaM2": 10.86
  },
  {
    "id": "pi-amaggi-21",
    "codigo": "EXT-Frontal",
    "tipo": "steel",
    "areaM2": 68.86,
    "performaM2": 68.86
  },
  {
    "id": "pi-amaggi-22",
    "codigo": "EXT-Fundos",
    "tipo": "steel",
    "areaM2": 86.91,
    "performaM2": 86.91
  },
  {
    "id": "pi-amaggi-23",
    "codigo": "EXT-Lateral Direita",
    "tipo": "steel",
    "areaM2": 26.08,
    "performaM2": 26.08
  },
  {
    "id": "pi-amaggi-24",
    "codigo": "EXT-Lateral Esquerda",
    "tipo": "steel",
    "areaM2": 28.34,
    "performaM2": 28.34
  }
];

/** Aba "Forro". */
const FORRO_AMAGGI: AmbienteForro[] = [
  {
    "id": "forro-area-de-servico",
    "ambiente": "Área de Serviço",
    "areaM2": 5.58
  },
  {
    "id": "forro-sanitario-feminino",
    "ambiente": "Sanitário Feminino",
    "areaM2": 4.5
  },
  {
    "id": "forro-sanitario-masculino",
    "ambiente": "Sanitário Masculino",
    "areaM2": 19.13
  },
  {
    "id": "forro-apoio-motorista",
    "ambiente": "Apoio Motorista",
    "areaM2": 19.57
  },
  {
    "id": "forro-cadastro",
    "ambiente": "Cadastro",
    "areaM2": 14.7
  },
  {
    "id": "forro-sala-de-apoio",
    "ambiente": "Sala de Apoio",
    "areaM2": 9.94
  },
  {
    "id": "forro-arquivo",
    "ambiente": "Arquivo",
    "areaM2": 9.47
  },
  {
    "id": "forro-ti",
    "ambiente": "T.I.",
    "areaM2": 9.58
  },
  {
    "id": "forro-copa",
    "ambiente": "Copa",
    "areaM2": 7.81
  },
  {
    "id": "forro-wc-feminino",
    "ambiente": "WC Feminino",
    "areaM2": 8.59
  },
  {
    "id": "forro-wc-pcd",
    "ambiente": "WC PCD",
    "areaM2": 4
  },
  {
    "id": "forro-wc-masculino",
    "ambiente": "WC Masculino",
    "areaM2": 13.52
  },
  {
    "id": "forro-as",
    "ambiente": "A.S.",
    "areaM2": 8.1
  },
  {
    "id": "forro-sala-motorista",
    "ambiente": "Sala Motorista",
    "areaM2": 11.46
  },
  {
    "id": "forro-gerencia",
    "ambiente": "Gerência",
    "areaM2": 12.44
  },
  {
    "id": "forro-operacional",
    "ambiente": "Operacional",
    "areaM2": 22.12
  },
  {
    "id": "forro-recepcao",
    "ambiente": "Recepção",
    "areaM2": 13.52
  },
  {
    "id": "forro-reuniao-2",
    "ambiente": "Reunião 2",
    "areaM2": 11.85
  },
  {
    "id": "forro-reuniao-1",
    "ambiente": "Reunião 1",
    "areaM2": 22.59
  }
];

/** Aba "Revestimentos (Escopo)". */
const TIPOS_PORCELANATO_AMAGGI: TipoPorcelanato[] = [
  {
    "id": "porc-area-de-servico",
    "descricao": "Área de Serviço",
    "areaTotalM2": 5.58
  },
  {
    "id": "porc-sanitario-feminino",
    "descricao": "Sanitário Feminino",
    "areaTotalM2": 4.5
  },
  {
    "id": "porc-sanitario-masculino",
    "descricao": "Sanitário Masculino",
    "areaTotalM2": 19.13
  },
  {
    "id": "porc-apoio-motorista",
    "descricao": "Apoio Motorista",
    "areaTotalM2": 19.57
  },
  {
    "id": "porc-cadastro",
    "descricao": "Cadastro",
    "areaTotalM2": 14.7
  },
  {
    "id": "porc-sala-de-apoio",
    "descricao": "Sala de Apoio",
    "areaTotalM2": 9.94
  },
  {
    "id": "porc-arquivo",
    "descricao": "Arquivo",
    "areaTotalM2": 9.47
  },
  {
    "id": "porc-ti",
    "descricao": "T.I.",
    "areaTotalM2": 9.58
  },
  {
    "id": "porc-copa",
    "descricao": "Copa",
    "areaTotalM2": 7.81
  },
  {
    "id": "porc-wc-feminino",
    "descricao": "WC Feminino",
    "areaTotalM2": 8.59
  },
  {
    "id": "porc-wc-pcd",
    "descricao": "WC PCD",
    "areaTotalM2": 4
  },
  {
    "id": "porc-wc-masculino",
    "descricao": "WC Masculino",
    "areaTotalM2": 13.52
  },
  {
    "id": "porc-as",
    "descricao": "A.S.",
    "areaTotalM2": 8.1
  },
  {
    "id": "porc-sala-motorista",
    "descricao": "Sala Motorista",
    "areaTotalM2": 11.46
  },
  {
    "id": "porc-gerencia",
    "descricao": "Gerência",
    "areaTotalM2": 12.44
  },
  {
    "id": "porc-operacional",
    "descricao": "Operacional",
    "areaTotalM2": 22.12
  },
  {
    "id": "porc-recepcao",
    "descricao": "Recepção",
    "areaTotalM2": 13.52
  },
  {
    "id": "porc-reuniao-2",
    "descricao": "Reunião 2",
    "areaTotalM2": 11.85
  },
  {
    "id": "porc-reuniao-1",
    "descricao": "Reunião 1",
    "areaTotalM2": 22.59
  }
];

/** Aba "Revestimentos - Produção" — apontamentos reais. */
const APONTAMENTOS_PORCELANATO_AMAGGI: ApontamentoPorcelanato[] = [];

export const OBRA_AMAGGI: Obra = {
  id: "amaggi-001",
  nome: "Amaggi - Steel Frame",
  cliente: "Amaggi Exportação e Importação Ltda.",
  escopo: ESCOPO_EXTERNO_AMAGGI,
  paredesDrywall: PAREDES_DRYWALL_AMAGGI,
  paredesInterno: PAREDES_INTERNO_AMAGGI,
  forro: FORRO_AMAGGI,
  tiposPorcelanato: TIPOS_PORCELANATO_AMAGGI,
  apontamentosPorcelanato: APONTAMENTOS_PORCELANATO_AMAGGI,
  registros: REGISTROS_AMAGGI,
  resumos: [],
  observacoesGerais:
    "Escopo de Plaqueamento Externo, Painéis Internos, Plaqueamento Interno (Performa/RU), Forro e Revestimentos " +
    "sincronizado automaticamente de Produtividade Amaggi.xlsx (scripts/sync-from-excel-amaggi.mjs). " +
    "Apontamentos de produção entram conforme forem lançados nas abas Histórico-Plaqueamento Externo e Revestimentos - Produção.",
};
