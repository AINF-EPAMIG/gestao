import { NextRequest, NextResponse } from "next/server";
import { executeQueryAsti } from "@/lib/db";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; 
import { uploadFileToDrive } from "@/lib/google-drive";
import { KNOWLEDGE_CATEGORIES } from "@/lib/constants";

function extractBase64Payload(raw: string | undefined | null) {
  if (!raw) return null;
  const commaIndex = raw.indexOf(",");
  return commaIndex > -1 ? raw.substring(commaIndex + 1) : raw;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ erro: "Usuário não autenticado" }, { status: 401 });
  }

  if (!session.accessToken || session.error) {
    return NextResponse.json({ erro: session.error ? `Erro de autenticação: ${session.error}` : "Token de acesso do Google indisponível" }, { status: 401 });
  }

  const body = await req.json();
  const linkValue = typeof body.link === "string" && body.link.trim() !== "" ? body.link.trim() : null;
  const categoriaValue = typeof body.categoria === "string" ? body.categoria.trim() : "";

  // Validação simples dos campos enviados pelo frontend
  if (
    !body.nome ||
    body.tipo == null || // verifica se tipo está definido e não é null
    (Number(body.tipo) !== 0 && Number(body.tipo) !== 1) ||
    !categoriaValue ||
    !KNOWLEDGE_CATEGORIES.includes(categoriaValue as (typeof KNOWLEDGE_CATEGORIES)[number]) ||
    !body.descricao
  ) {
    return NextResponse.json({ erro: "Campos obrigatórios ausentes ou inválidos" }, { status: 400 });
  }

  // exige anexo no cadastro
  if (!body.anexo || !body.anexo.conteudo_base64) {
    return NextResponse.json({ erro: "Anexo obrigatório para cadastro" }, { status: 400 });
  }

  try {
    // 1) Criar registro de conhecimento (sem informar anexo_id). Se houver anexo, atualizamos depois.
    const insertConhecimentoQuery = `
      INSERT INTO conhecimento (nome, tipo, nome_autor, email_autor, dt_publicacao, categoria, descricao, link)
      VALUES (?, ?, ?, ?, NOW(), ?, ?, ?)
    `;
    const insertConhecimentoValues = [
      body.nome,
      Number(body.tipo),
      session.user?.name || "",
      session.user?.email || "",
      categoriaValue,
      body.descricao,
      linkValue
    ];

    const insertResult = await executeQueryAsti({ query: insertConhecimentoQuery, values: insertConhecimentoValues }) as
      | Record<string, unknown>
      | Array<Record<string, unknown>>
      | undefined;

    let conhecimentoId: number | null = null;
    if (Array.isArray(insertResult)) {
      const first = insertResult[0] as Record<string, unknown> | undefined;
      const raw = first?.insertId ?? first?.insert_id as unknown;
      if (typeof raw === "number") conhecimentoId = raw;
      else if (typeof raw === "string" && /^[0-9]+$/.test(raw)) conhecimentoId = Number(raw);
    } else if (insertResult) {
      const raw = (insertResult.insertId ?? insertResult.insert_id) as unknown;
      if (typeof raw === "number") conhecimentoId = raw;
      else if (typeof raw === "string" && /^[0-9]+$/.test(raw)) conhecimentoId = Number(raw);
    }

    // Se o driver não retornou insertId, tentamos obter o último registro inserido (fallback)
    if (!conhecimentoId) {
      // tentativa simples: retornar sucesso sem anexo
      return NextResponse.json({ mensagem: "Registro criado (sem anexo)" }, { status: 201 });
    }

    // 2) Se veio anexo no body, criar anexo e atualizar conhecimento.anexo_id
    if (body.anexo && body.anexo.conteudo_base64) {
      const anexo = body.anexo;
      // server-side validation: only accept PDFs
      const tipoArquivo = String(anexo.tipo_arquivo ?? anexo.type ?? "").toLowerCase();
      const nomeArquivo = String(anexo.nome_arquivo ?? anexo.name ?? "").toLowerCase();
      if (!tipoArquivo.includes("pdf") && !nomeArquivo.endsWith('.pdf')) {
        return NextResponse.json({ erro: "Apenas arquivos PDF são aceitos" }, { status: 400 });
      }

      const base64Payload = extractBase64Payload(anexo.conteudo_base64);
      if (!base64Payload) {
        return NextResponse.json({ erro: "Conteúdo do anexo inválido" }, { status: 400 });
      }

      const fileBuffer = Buffer.from(base64Payload, "base64");
      const tamanhoBytes = anexo.tamanho_bytes || anexo.size || fileBuffer.byteLength;
      let driveFile;
      try {
        driveFile = await uploadFileToDrive(
          session.accessToken,
          fileBuffer,
          anexo.nome_arquivo || anexo.name || `arquivo-${conhecimentoId}.pdf`,
          anexo.tipo_arquivo || anexo.type || "application/pdf"
        );
      } catch (driveError) {
        console.error("Erro ao enviar anexo para o Google Drive:", driveError);
        return NextResponse.json({ erro: "Falha ao salvar anexo no Google Drive" }, { status: 502 });
      }
      const insertAnexoQuery = `
        INSERT INTO anexo (conhecimento_id, nome_arquivo, caminho_arquivo, google_drive_id, google_drive_link, tipo_arquivo, tamanho_bytes, dt_upload, usuario_email, conteudo_arquivo)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)
      `;
      const insertAnexoValues = [
        conhecimentoId,
        anexo.nome_arquivo || anexo.name || "",
        driveFile.webContentLink || anexo.caminho_arquivo || "",
        driveFile.id,
        driveFile.webViewLink || driveFile.webContentLink || anexo.google_drive_link || "",
        anexo.tipo_arquivo || anexo.type || "application/octet-stream",
        tamanhoBytes,
        session.user?.email || "",
        ""
      ];
      const anexoResult = await executeQueryAsti({ query: insertAnexoQuery, values: insertAnexoValues }) as
        | Record<string, unknown>
        | Array<Record<string, unknown>>
        | undefined;

      let anexoId: number | null = null;
      if (Array.isArray(anexoResult)) {
        const first = anexoResult[0] as Record<string, unknown> | undefined;
        const raw = first?.insertId as unknown;
        if (typeof raw === "number") anexoId = raw;
        else if (typeof raw === "string" && /^[0-9]+$/.test(raw)) anexoId = Number(raw);
      } else if (anexoResult) {
        const raw = anexoResult.insertId as unknown;
        if (typeof raw === "number") anexoId = raw;
        else if (typeof raw === "string" && /^[0-9]+$/.test(raw)) anexoId = Number(raw);
      }
      if (anexoId) {
        const updateConhecimento = `UPDATE conhecimento SET anexo_id = ? WHERE id = ?`;
        await executeQueryAsti({ query: updateConhecimento, values: [anexoId, conhecimentoId] });
      }
    }

    return NextResponse.json({ mensagem: "Tutorial cadastrado!" }, { status: 201 });
  } catch {
    return NextResponse.json({ erro: "Falha ao cadastrar" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const nome = searchParams.get("nome") || "";
    const data = searchParams.get("data") || "";
    const tipoStr = searchParams.get("tipo"); // recebe string "0" ou "1" ou null
    const categoria = searchParams.get("categoria");

    let query = `
      SELECT 
        c.id,
        c.nome,
        c.dt_publicacao,
        c.tipo,
        c.descricao,
        c.categoria,
        c.link,
        c.anexo_id,
        a.nome_arquivo,
        a.google_drive_link
      FROM conhecimento c
      LEFT JOIN anexo a ON a.id = c.anexo_id
      WHERE c.nome LIKE ?
    `;
    const values = [`%${nome}%`];

    // filtro por data
    if (data) {
      query += ` AND DATE(c.dt_publicacao) = ?`;
      values.push(data);
    }

    // filtro por tipo
    if (tipoStr !== null && (tipoStr === "0" || tipoStr === "1")) {
      query += ` AND c.tipo = ?`;
      values.push(tipoStr);
    }

    if (categoria && KNOWLEDGE_CATEGORIES.includes(categoria as (typeof KNOWLEDGE_CATEGORIES)[number])) {
      query += ` AND c.categoria = ?`;
      values.push(categoria);
    }

    // ordenar alfabeticamente pelo nome
    query += ` ORDER BY c.nome ASC`;

    const resultado = await executeQueryAsti({ query, values });
    return NextResponse.json(resultado);
  } catch {
    return NextResponse.json({ erro: "Erro na consulta" }, { status: 500 });
  }
}
