import { NextRequest, NextResponse } from "next/server";
import { executeQueryAsti } from "@/lib/db";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; 

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ erro: "Usuário não autenticado" }, { status: 401 });
  }

  const body = await req.json();

  // Validação simples dos campos enviados pelo frontend
  if (
    !body.nome ||
    body.tipo == null || // verifica se tipo está definido e não é null
    (Number(body.tipo) !== 0 && Number(body.tipo) !== 1) ||
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
      INSERT INTO conhecimento (nome, tipo, nome_autor, email_autor, dt_publicacao, descricao)
      VALUES (?, ?, ?, ?, NOW(), ?)
    `;
    const insertConhecimentoValues = [
      body.nome,
      Number(body.tipo),
      session.user?.name || "",
      session.user?.email || "",
      body.descricao
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
      const insertAnexoQuery = `
        INSERT INTO anexo (conhecimento_id, nome_arquivo, caminho_arquivo, google_drive_id, google_drive_link, tipo_arquivo, tamanho_bytes, dt_upload, usuario_email, conteudo_arquivo)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)
      `;
      const insertAnexoValues = [
        conhecimentoId,
        anexo.nome_arquivo || anexo.name || "",
        anexo.caminho_arquivo || "",
        anexo.google_drive_id || "",
        anexo.google_drive_link || "",
        anexo.tipo_arquivo || anexo.type || "application/octet-stream",
        anexo.tamanho_bytes || anexo.size || 0,
        session.user?.email || "",
        anexo.conteudo_base64 || ""
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

    let query = `
      SELECT id, nome, dt_publicacao, tipo
      FROM conhecimento
      WHERE nome LIKE ?
    `;
    const values = [`%${nome}%`];

    // filtro por data
    if (data) {
      query += ` AND DATE(dt_publicacao) = ?`;
      values.push(data);
    }

    // filtro por tipo
    if (tipoStr !== null && (tipoStr === "0" || tipoStr === "1")) {
      query += ` AND tipo = ?`;
      values.push(tipoStr);
    }

    // ordenar alfabeticamente pelo nome
    query += ` ORDER BY nome ASC`;

    const resultado = await executeQueryAsti({ query, values });
    return NextResponse.json(resultado);
  } catch {
    return NextResponse.json({ erro: "Erro na consulta" }, { status: 500 });
  }
}
