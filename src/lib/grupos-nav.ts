import type { GrupoServico } from "./servicos";

export const GRUPO_SLUGS: Record<GrupoServico, string> = {
  "Plaqueamento Externo": "plaqueamento-externo",
  Porcelanato: "porcelanato",
  Drywall: "drywall",
  "Plaqueamento Interno": "plaqueamento-interno",
  Forro: "forro",
};

export const SLUG_TO_GRUPO: Record<string, GrupoServico> = Object.fromEntries(
  Object.entries(GRUPO_SLUGS).map(([grupo, slug]) => [slug, grupo as GrupoServico])
);

export function hrefGrupo(obraId: string, grupo: GrupoServico): string {
  return `/obras/${obraId}/frentes/${GRUPO_SLUGS[grupo]}`;
}

export function hrefObra(obraId: string, path: string = ""): string {
  return `/obras/${obraId}${path}`;
}

export function grupoFromSlug(slug: string): GrupoServico | null {
  return SLUG_TO_GRUPO[slug] ?? null;
}
