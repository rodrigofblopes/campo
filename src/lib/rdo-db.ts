import { neon } from "@neondatabase/serverless";
import type { Profissional, RegistroRdo } from "./rdo-types";

function getSql() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) {
    throw new Error(
      "Banco de dados não configurado. Adicione um banco Postgres (Neon) ao projeto na Vercel."
    );
  }
  return neon(url);
}

let tablesReady: Promise<void> | null = null;

function ensureTables(): Promise<void> {
  if (!tablesReady) {
    const sql = getSql();
    tablesReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS profissionais (
          id TEXT PRIMARY KEY,
          obra_id TEXT NOT NULL,
          nome TEXT NOT NULL,
          funcao TEXT,
          equipe TEXT NOT NULL
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS registros_rdo (
          id TEXT PRIMARY KEY,
          obra_id TEXT NOT NULL,
          data TEXT NOT NULL,
          equipe TEXT NOT NULL,
          servico TEXT NOT NULL,
          profissionais_ids JSONB NOT NULL,
          area_m2 DOUBLE PRECISION NOT NULL,
          diarias DOUBLE PRECISION NOT NULL,
          preco_diaria DOUBLE PRECISION NOT NULL,
          comentario TEXT NOT NULL,
          criado_em TEXT NOT NULL
        )
      `;
    })();
  }
  return tablesReady;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToProfissional(row: any): Profissional {
  return {
    id: row.id,
    obraId: row.obra_id,
    nome: row.nome,
    funcao: row.funcao ?? undefined,
    equipe: row.equipe,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToRegistro(row: any): RegistroRdo {
  return {
    id: row.id,
    obraId: row.obra_id,
    data: row.data,
    equipe: row.equipe,
    servico: row.servico,
    profissionaisIds:
      typeof row.profissionais_ids === "string"
        ? JSON.parse(row.profissionais_ids)
        : row.profissionais_ids,
    areaM2: Number(row.area_m2),
    diarias: Number(row.diarias),
    precoDiaria: Number(row.preco_diaria),
    comentario: row.comentario,
    criadoEm: row.criado_em,
  };
}

export async function listarProfissionaisDb(obraId: string): Promise<Profissional[]> {
  await ensureTables();
  const sql = getSql();
  const rows = await sql`
    SELECT id, obra_id, nome, funcao, equipe
    FROM profissionais
    WHERE obra_id = ${obraId}
    ORDER BY equipe, nome
  `;
  return rows.map(rowToProfissional);
}

export async function criarProfissionalDb(p: Profissional): Promise<void> {
  await ensureTables();
  const sql = getSql();
  await sql`
    INSERT INTO profissionais (id, obra_id, nome, funcao, equipe)
    VALUES (${p.id}, ${p.obraId}, ${p.nome}, ${p.funcao ?? null}, ${p.equipe})
    ON CONFLICT (id) DO NOTHING
  `;
}

export async function excluirProfissionalDb(id: string): Promise<void> {
  await ensureTables();
  const sql = getSql();
  await sql`
    DELETE FROM profissionais
    WHERE id = ${id}
  `;
}

export async function listarRegistrosRdoDb(obraId: string): Promise<RegistroRdo[]> {
  await ensureTables();
  const sql = getSql();
  const rows = await sql`
    SELECT id, obra_id, data, equipe, servico, profissionais_ids, area_m2, diarias, preco_diaria, comentario, criado_em
    FROM registros_rdo
    WHERE obra_id = ${obraId}
    ORDER BY data DESC, criado_em DESC
  `;
  return rows.map(rowToRegistro);
}

export async function criarRegistroRdoDb(r: RegistroRdo): Promise<void> {
  await ensureTables();
  const sql = getSql();
  await sql`
    INSERT INTO registros_rdo (
      id, obra_id, data, equipe, servico, profissionais_ids, area_m2, diarias, preco_diaria, comentario, criado_em
    )
    VALUES (
      ${r.id}, ${r.obraId}, ${r.data}, ${r.equipe}, ${r.servico},
      ${JSON.stringify(r.profissionaisIds)}, ${r.areaM2}, ${r.diarias}, ${r.precoDiaria},
      ${r.comentario}, ${r.criadoEm}
    )
    ON CONFLICT (id) DO NOTHING
  `;
}

export async function excluirRegistroRdoDb(id: string): Promise<void> {
  await ensureTables();
  const sql = getSql();
  await sql`
    DELETE FROM registros_rdo
    WHERE id = ${id}
  `;
}
