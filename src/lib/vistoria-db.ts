import { neon } from "@neondatabase/serverless";
import type { VistoriaObra } from "./vistoria-types";

function getSql() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) {
    throw new Error(
      "Banco de dados não configurado. Adicione um banco Postgres (Neon) ao projeto na Vercel."
    );
  }
  return neon(url);
}

let tableReady: Promise<void> | null = null;

function ensureTable(): Promise<void> {
  if (!tableReady) {
    const sql = getSql();
    tableReady = sql`
      CREATE TABLE IF NOT EXISTS vistorias (
        id TEXT PRIMARY KEY,
        obra_id TEXT NOT NULL,
        obra_nome TEXT NOT NULL,
        responsavel_vistoria TEXT NOT NULL,
        data TEXT NOT NULL,
        criado_em TEXT NOT NULL,
        itens JSONB NOT NULL
      )
    `.then(() => undefined);
  }
  return tableReady;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToVistoria(row: any): VistoriaObra {
  return {
    id: row.id,
    obraId: row.obra_id,
    obraNome: row.obra_nome,
    responsavelVistoria: row.responsavel_vistoria,
    data: row.data,
    criadoEm: row.criado_em,
    itens: typeof row.itens === "string" ? JSON.parse(row.itens) : row.itens,
  };
}

export async function listarVistorias(obraId: string): Promise<VistoriaObra[]> {
  await ensureTable();
  const sql = getSql();
  const rows = await sql`
    SELECT id, obra_id, obra_nome, responsavel_vistoria, data, criado_em, itens
    FROM vistorias
    WHERE obra_id = ${obraId}
    ORDER BY criado_em DESC
  `;
  return rows.map(rowToVistoria);
}

export async function criarVistoria(v: VistoriaObra): Promise<void> {
  await ensureTable();
  const sql = getSql();
  await sql`
    INSERT INTO vistorias (id, obra_id, obra_nome, responsavel_vistoria, data, criado_em, itens)
    VALUES (${v.id}, ${v.obraId}, ${v.obraNome}, ${v.responsavelVistoria}, ${v.data}, ${v.criadoEm}, ${JSON.stringify(v.itens)})
    ON CONFLICT (id) DO NOTHING
  `;
}

export async function atualizarVistoriaDb(v: VistoriaObra): Promise<void> {
  await ensureTable();
  const sql = getSql();
  await sql`
    UPDATE vistorias
    SET itens = ${JSON.stringify(v.itens)}
    WHERE id = ${v.id}
  `;
}
