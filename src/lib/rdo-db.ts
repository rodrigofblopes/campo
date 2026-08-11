import { neon } from "@neondatabase/serverless";
import type { PrecoEquipe, Profissional, RegistroRdo } from "./rdo-types";

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
      // Migração: ajudante e profissional têm diária com valor diferente,
      // então passamos a lançar as duas categorias separadas. As colunas
      // legadas "diarias"/"preco_diaria" continuam existindo (e sendo
      // preenchidas com o total/média) só pra não quebrar registros antigos
      // que ainda não tinham essa divisão.
      await sql`ALTER TABLE registros_rdo ADD COLUMN IF NOT EXISTS diarias_ajudante DOUBLE PRECISION NOT NULL DEFAULT 0`;
      await sql`ALTER TABLE registros_rdo ADD COLUMN IF NOT EXISTS preco_diaria_ajudante DOUBLE PRECISION NOT NULL DEFAULT 0`;
      await sql`ALTER TABLE registros_rdo ADD COLUMN IF NOT EXISTS diarias_profissional DOUBLE PRECISION NOT NULL DEFAULT 0`;
      await sql`ALTER TABLE registros_rdo ADD COLUMN IF NOT EXISTS preco_diaria_profissional DOUBLE PRECISION NOT NULL DEFAULT 0`;
      // Preço de diária de ajudante/profissional varia por equipe (ajudante
      // de pedreiro difere de ajudante de pintor, por exemplo) — não é um
      // valor geral. Uma linha por obra+equipe guarda o preço configurado.
      await sql`
        CREATE TABLE IF NOT EXISTS precos_equipe (
          obra_id TEXT NOT NULL,
          equipe TEXT NOT NULL,
          preco_diaria_ajudante DOUBLE PRECISION NOT NULL DEFAULT 0,
          preco_diaria_profissional DOUBLE PRECISION NOT NULL DEFAULT 0,
          PRIMARY KEY (obra_id, equipe)
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
  const diariasAjudante = Number(row.diarias_ajudante ?? 0);
  const diariasProfissional = Number(row.diarias_profissional ?? 0);
  // Registros criados antes da divisão ajudante/profissional só têm as
  // colunas legadas preenchidas — nesse caso, joga tudo como "profissional"
  // (categoria mais comum nos apontamentos antigos) pra não perder o
  // histórico de diárias/custo já lançado.
  const semDivisao = diariasAjudante === 0 && diariasProfissional === 0 && Number(row.diarias ?? 0) > 0;
  if (semDivisao) {
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
      diariasAjudante: 0,
      precoDiariaAjudante: 0,
      diariasProfissional: Number(row.diarias),
      precoDiariaProfissional: Number(row.preco_diaria),
      comentario: row.comentario,
      criadoEm: row.criado_em,
    };
  }
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
    diariasAjudante,
    precoDiariaAjudante: Number(row.preco_diaria_ajudante ?? 0),
    diariasProfissional,
    precoDiariaProfissional: Number(row.preco_diaria_profissional ?? 0),
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
    SELECT id, obra_id, data, equipe, servico, profissionais_ids, area_m2,
           diarias, preco_diaria,
           diarias_ajudante, preco_diaria_ajudante, diarias_profissional, preco_diaria_profissional,
           comentario, criado_em
    FROM registros_rdo
    WHERE obra_id = ${obraId}
    ORDER BY data DESC, criado_em DESC
  `;
  return rows.map(rowToRegistro);
}

export async function criarRegistroRdoDb(r: RegistroRdo): Promise<void> {
  await ensureTables();
  const sql = getSql();
  const diarias = r.diariasAjudante + r.diariasProfissional;
  const custoTotal = r.diariasAjudante * r.precoDiariaAjudante + r.diariasProfissional * r.precoDiariaProfissional;
  const precoDiariaMedio = diarias > 0 ? custoTotal / diarias : 0;
  await sql`
    INSERT INTO registros_rdo (
      id, obra_id, data, equipe, servico, profissionais_ids, area_m2,
      diarias, preco_diaria,
      diarias_ajudante, preco_diaria_ajudante, diarias_profissional, preco_diaria_profissional,
      comentario, criado_em
    )
    VALUES (
      ${r.id}, ${r.obraId}, ${r.data}, ${r.equipe}, ${r.servico},
      ${JSON.stringify(r.profissionaisIds)}, ${r.areaM2},
      ${diarias}, ${precoDiariaMedio},
      ${r.diariasAjudante}, ${r.precoDiariaAjudante}, ${r.diariasProfissional}, ${r.precoDiariaProfissional},
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToPrecoEquipe(row: any): PrecoEquipe {
  return {
    obraId: row.obra_id,
    equipe: row.equipe,
    precoDiariaAjudante: Number(row.preco_diaria_ajudante ?? 0),
    precoDiariaProfissional: Number(row.preco_diaria_profissional ?? 0),
  };
}

export async function listarPrecosEquipeDb(obraId: string): Promise<PrecoEquipe[]> {
  await ensureTables();
  const sql = getSql();
  const rows = await sql`
    SELECT obra_id, equipe, preco_diaria_ajudante, preco_diaria_profissional
    FROM precos_equipe
    WHERE obra_id = ${obraId}
  `;
  return rows.map(rowToPrecoEquipe);
}

export async function salvarPrecoEquipeDb(p: PrecoEquipe): Promise<void> {
  await ensureTables();
  const sql = getSql();
  await sql`
    INSERT INTO precos_equipe (obra_id, equipe, preco_diaria_ajudante, preco_diaria_profissional)
    VALUES (${p.obraId}, ${p.equipe}, ${p.precoDiariaAjudante}, ${p.precoDiariaProfissional})
    ON CONFLICT (obra_id, equipe) DO UPDATE SET
      preco_diaria_ajudante = EXCLUDED.preco_diaria_ajudante,
      preco_diaria_profissional = EXCLUDED.preco_diaria_profissional
  `;
}
