import type { ProgressoLocal } from "./types";

const ALIAS_LOCALIZACAO: Record<string, string> = {
  frontal: "Frontal",
  "fachada frontal": "Frontal",
  "avanço - fachada frontal": "Frontal",
  "avanco - fachada frontal": "Frontal",
  fundos: "Fundos",
  "lateral direita": "Lateral Direita",
  "lateral esquerda": "Lateral Esquerda",
  "coroamento platibanda": "Coroamento da Platibanda",
  "coroamento da platibanda": "Coroamento da Platibanda",
};

export function normalizarLocalizacao(nome: string): string {
  const key = nome.trim().toLowerCase().replace(/\s+/g, " ");
  const paredeMatch = key.match(/^parede (\d+)$/);
  if (paredeMatch) {
    return `Painel ${paredeMatch[1].padStart(2, "0")}`;
  }
  const painelMatch = key.match(/^painel (\d+)$/);
  if (painelMatch) {
    return `Painel ${painelMatch[1].padStart(2, "0")}`;
  }
  return ALIAS_LOCALIZACAO[key] ?? nome.trim();
}

export function localizacoesEquivalentes(a: string, b: string): boolean {
  return normalizarLocalizacao(a) === normalizarLocalizacao(b);
}

export function findProgressoLocal(
  progresso: ProgressoLocal[],
  localizacao: string
): ProgressoLocal | undefined {
  const alvo = normalizarLocalizacao(localizacao);
  return progresso.find(
    (p) => normalizarLocalizacao(p.localizacao) === alvo
  );
}
