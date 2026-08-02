# Campo

Sistema web para apropriação de dados e gestão de produtividade em obras Steel Frame. A produção diária alimenta automaticamente a análise comparativa (previsto × realizado) e o resumo por localização. Hoje acompanha a obra Sicredi; a estrutura de dados foi pensada para, no futuro, acomodar outras obras (ex.: Ariquemes, São Miguel do Guaporé) como referência de produtividade.

## O que faz

| Planilha tradicional | Este sistema |
|----------------------|--------------|
| Abas desconectadas | Dados fluem automaticamente |
| Cálculos manuais | Análise gerada a partir da produção |
| Sem relatórios prontos | PDFs para orçamento, cronograma e engenharia |
| Só desktop | Funciona no navegador (celular no canteiro) |
| Um serviço por vez | Filtro por serviço, localização e equipe |

## Como rodar

```bash
cd app
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000)

## Páginas

- **Dashboard** — visão geral da obra
- **Produção** — registro diário (equipe, local, serviço, m²)
- **Resumo** — RUP (m²/dia) por localização
- **Frentes** — detalhamento por frente de serviço (Plaqueamento, Porcelanato, Drywall, Interno, Forro)
- **Relatório PDF** — relatório completo para download

## Próximos passos

- Tela de obras (cards) para alternar entre Sicredi, Ariquemes, São Miguel do Guaporé etc.
- Banco de dados na nuvem (múltiplas obras)
- Login por usuário
- Gráficos de tendência por equipe
- Previsão de cronograma com IA
- App mobile nativo
