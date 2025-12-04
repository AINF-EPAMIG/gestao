import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { DB_ASTI_DATABASE, executeQueryAsti, qualifyTable } from "@/lib/db";
import type {
  TvContent,
  TvContentPayload,
  TvEntryKind,
  TvNews,
  TvNewsPayload
} from "@/lib/types";

const schema = DB_ASTI_DATABASE || "";
const conteudosTable = qualifyTable(schema, "conteudos");
const anexosTable = qualifyTable(schema, "anexo");

type InsertResult = ResultSetHeader | RowDataPacket[] | Record<string, unknown> | Array<Record<string, unknown>>;

const parseNumericId = (value: unknown): number | null => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
  return null;
};

const normalizeDate = (value?: Date | string | null): string | null => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return new Date(value).toISOString();
};

interface ConteudoRow extends RowDataPacket {
  id: number;
  titulo: string;
  descricao: string;
  nome_autor: string | null;
  email_autor: string | null;
  dt_publicacao: Date | string;
  id_anexo: number | null;
}

interface ConteudoWithAnexoRow extends ConteudoRow {
  anexo_id: number | null;
  anexo_nome: string | null;
  anexo_tipo: string | null;
  anexo_conteudo: string | null;
}

const resolveAuthor = (row: ConteudoRow | ConteudoWithAnexoRow) => row.email_autor || row.nome_autor || null;

const mapNewsRow = (row: ConteudoRow): TvNews => ({
  id: row.id,
  title: row.titulo,
  message: row.descricao,
  publishedAt: normalizeDate(row.dt_publicacao) ?? new Date().toISOString(),
  createdBy: resolveAuthor(row)
});

const mapContentRow = (row: ConteudoWithAnexoRow): TvContent => {
  const base64 = row.anexo_conteudo ?? "";
  const mime = row.anexo_tipo ?? null;
  return {
    id: row.id,
    title: row.titulo,
    description: row.descricao,
    imageDataUrl: base64 && mime ? `data:${mime};base64,${base64}` : null,
    imageMimeType: mime,
    imageName: row.anexo_nome,
    publishedAt: normalizeDate(row.dt_publicacao) ?? new Date().toISOString(),
    createdBy: resolveAuthor(row)
  };
};

const extractInsertId = (result: InsertResult): number | null => {
  if (!result) return null;
  if (Array.isArray(result)) {
    const first = result[0] as Record<string, unknown> | undefined;
    return parseNumericId(first?.insertId ?? first?.insert_id);
  }

  const fromHeader = parseNumericId((result as ResultSetHeader).insertId);
  if (fromHeader !== null) return fromHeader;

  const record = result as Record<string, unknown>;
  return parseNumericId(record.insertId ?? record.insert_id);
};

export async function fetchTvNews(): Promise<TvNews[]> {
  const query = `
    SELECT id, titulo, descricao, nome_autor, email_autor, dt_publicacao, id_anexo
    FROM ${conteudosTable}
    WHERE id_anexo IS NULL OR id_anexo = 0
    ORDER BY dt_publicacao DESC
  `;
  const rows = await executeQueryAsti<ConteudoRow[]>({ query });
  return rows.map(mapNewsRow);
}

export async function fetchTvContents(): Promise<TvContent[]> {
  const query = `
    SELECT
      c.id,
      c.titulo,
      c.descricao,
      c.nome_autor,
      c.email_autor,
      c.dt_publicacao,
      c.id_anexo,
      a.id AS anexo_id,
      a.nome_arquivo AS anexo_nome,
      a.tipo_arquivo AS anexo_tipo,
      a.conteudo_arquivo AS anexo_conteudo
    FROM ${conteudosTable} c
    INNER JOIN ${anexosTable} a ON a.conteudos_id = c.id
    WHERE c.id_anexo IS NOT NULL AND c.id_anexo <> 0
    ORDER BY c.dt_publicacao DESC
  `;
  const rows = await executeQueryAsti<ConteudoWithAnexoRow[]>({ query });
  return rows.map(mapContentRow);
}

export async function fetchTvDashboardData() {
  const [news, contents] = await Promise.all([fetchTvNews(), fetchTvContents()]);
  return { news, contents };
}

const fetchNewsById = async (id: number): Promise<TvNews | null> => {
  const query = `
    SELECT id, titulo, descricao, nome_autor, email_autor, dt_publicacao, id_anexo
    FROM ${conteudosTable}
    WHERE id = ? LIMIT 1
  `;
  const rows = await executeQueryAsti<ConteudoRow[]>({ query, values: [id] });
  const row = rows[0];
  return row && (row.id_anexo === 0 || row.id_anexo === null) ? mapNewsRow(row) : null;
};

const fetchContentById = async (id: number): Promise<TvContent | null> => {
  const query = `
    SELECT
      c.id,
      c.titulo,
      c.descricao,
      c.nome_autor,
      c.email_autor,
      c.dt_publicacao,
      c.id_anexo,
      a.id AS anexo_id,
      a.nome_arquivo AS anexo_nome,
      a.tipo_arquivo AS anexo_tipo,
      a.conteudo_arquivo AS anexo_conteudo
    FROM ${conteudosTable} c
    LEFT JOIN ${anexosTable} a ON a.conteudos_id = c.id
    WHERE c.id = ?
    LIMIT 1
  `;
  const rows = await executeQueryAsti<ConteudoWithAnexoRow[]>({ query, values: [id] });
  const row = rows[0];
  return row ? mapContentRow(row) : null;
};

export async function insertTvNews(payload: TvNewsPayload): Promise<TvNews | null> {
  const query = `
    INSERT INTO ${conteudosTable} (titulo, descricao, nome_autor, email_autor, dt_publicacao, id_anexo)
    VALUES (?, ?, ?, ?, NOW(), 0)
  `;
  const values = [
    payload.title,
    payload.message,
    payload.createdByName ?? payload.createdByEmail ?? "Sistema",
    payload.createdByEmail ?? null
  ];
  const result = await executeQueryAsti<InsertResult>({ query, values });
  const insertId = extractInsertId(result);
  return insertId ? fetchNewsById(insertId) : null;
}

export async function insertTvContent(payload: TvContentPayload): Promise<TvContent | null> {
  const authorName = payload.createdByName ?? payload.createdByEmail ?? "Sistema";
  const authorEmail = payload.createdByEmail ?? null;

  const conteudoResult = await executeQueryAsti<InsertResult>({
    query: `
      INSERT INTO ${conteudosTable} (titulo, descricao, nome_autor, email_autor, dt_publicacao, id_anexo)
      VALUES (?, ?, ?, ?, NOW(), 0)
    `,
    values: [payload.title, payload.description, authorName, authorEmail]
  });

  const conteudoId = extractInsertId(conteudoResult);
  if (!conteudoId) return null;

  const attachmentResult = await executeQueryAsti<InsertResult>({
    query: `
      INSERT INTO ${anexosTable} (
        conteudos_id,
        nome_arquivo,
        caminho_arquivo,
        google_drive_id,
        google_drive_link,
        tipo_arquivo,
        tamanho_bytes,
        dt_upload,
        usuario_email,
        conteudo_arquivo
      ) VALUES (?, ?, '', '', '', ?, ?, NOW(), ?, ?)
    `,
    values: [
      conteudoId,
      payload.image.fileName,
      payload.image.mimeType,
      payload.image.size,
      authorEmail ?? "sistema@asti.local",
      payload.image.base64
    ]
  });

  const attachmentId = extractInsertId(attachmentResult);
  if (attachmentId) {
    await executeQueryAsti({
      query: `UPDATE ${conteudosTable} SET id_anexo = ? WHERE id = ?`,
      values: [attachmentId, conteudoId]
    });
  }

  return fetchContentById(conteudoId);
}

export async function deleteTvEntry(kind: TvEntryKind, id: number): Promise<void> {
  if (kind === "media") {
    await executeQueryAsti({
      query: `DELETE FROM ${anexosTable} WHERE conteudos_id = ?`,
      values: [id]
    });
  }

  await executeQueryAsti({
    query: `DELETE FROM ${conteudosTable} WHERE id = ? LIMIT 1`,
    values: [id]
  });
}
