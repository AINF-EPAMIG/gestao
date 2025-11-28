import { NextRequest, NextResponse } from "next/server";
import { executeQueryAsti } from "@/lib/db";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<Record<string, string | string[] | undefined>> }) {
  try {
    const paramsObj = await params;
    const id = String(paramsObj?.id ?? "");
    const query = `SELECT * FROM conhecimento WHERE id = ?`;
    const resultado = (await executeQueryAsti({ query, values: [id] })) as Array<Record<string, unknown>> | undefined;
    if (!resultado || resultado.length === 0) {
      return NextResponse.json({ erro: "Registro não encontrado" }, { status: 404 });
    }
    return NextResponse.json(resultado[0]);
  } catch (err) {
    return NextResponse.json({ erro: "Erro na consulta por id", detalhe: String(err) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ erro: "Usuário não autenticado" }, { status: 401 });
  }
  const paramsObj = await params;
  const id = String(paramsObj?.id ?? "");
  try {
    const body = await req.json();

    // aceita tipo vindo como string "0"/"1" ou como número
    const tipo = Number(body.tipo);
    if (!body.nome || isNaN(tipo) || (tipo !== 0 && tipo !== 1) || !body.descricao) {
      return NextResponse.json({ erro: "Campos obrigatórios ausentes ou inválidos" }, { status: 400 });
    }

    // Atualiza apenas campos principais primeiro. Fazemos a atualização das colunas
    // de modificação em uma query separada para evitar falha caso tais colunas não existam.
    const queryMain = `
      UPDATE conhecimento
      SET nome = ?, tipo = ?, descricao = ?
      WHERE id = ?
    `;
    const valuesMain = [body.nome, tipo, body.descricao, id];
    await executeQueryAsti({ query: queryMain, values: valuesMain });

    // Se veio anexo no body, apagar anexo antigo, inserir novo anexo e atualizar o conhecimento.anexo_id
    try {
      if (body.anexo && body.anexo.conteudo_base64) {
        // Buscar o anexo_id antigo do conhecimento
        const queryGetOldAnexo = `SELECT anexo_id FROM conhecimento WHERE id = ?`;
        const oldAnexoRes = await executeQueryAsti({ query: queryGetOldAnexo, values: [id] }) as Array<{ anexo_id: number | null }>;
        const oldAnexoId = oldAnexoRes.length > 0 ? oldAnexoRes[0].anexo_id : null;

        // Se existir anexo antigo, apagar ele da tabela anexo
        if (oldAnexoId) {
          const deleteOldAnexoQuery = `DELETE FROM anexo WHERE id = ?`;
          await executeQueryAsti({ query: deleteOldAnexoQuery, values: [oldAnexoId] });
        }

        // Inserir novo anexo
        const anexo = body.anexo;
        // server-side validation: only accept PDFs on update
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
          id,
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
          await executeQueryAsti({ query: updateConhecimento, values: [anexoId, id] });
        }
      }
    } catch (anexoErr) {
      console.warn('Falha ao salvar anexo:', String(anexoErr));
      // Não falhar a atualização principal por causa do anexo
    }

    return NextResponse.json({ mensagem: "Registro atualizado" });
  } catch (err) {
    return NextResponse.json({ erro: "Falha ao atualizar", detalhe: String(err) }, { status: 500 });
  }
}


export async function DELETE(req: NextRequest, { params }: { params: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ erro: "Usuário não autenticado" }, { status: 401 });
  }
  const paramsObj = await params;
  const id = String(paramsObj?.id ?? "");
  try {
    // Primeiro, buscar anexos relacionados (por conhecimento_id ou por anexo_id referenciado)
    try {
      const queryAnexos = `SELECT id FROM anexo WHERE conhecimento_id = ?`;
      const anexosResultado = await executeQueryAsti({ query: queryAnexos, values: [id] }) as Array<Record<string, unknown>> | undefined;
      const anexosIds = (anexosResultado || [])
        .map((r) => {
          const v = r && (r["id"] as unknown);
          if (typeof v === "number") return v;
          if (typeof v === "string" && v !== "") return Number(v);
          return null;
        })
        .filter((v): v is number => typeof v === "number");

      // Também verificar se o próprio conhecimento referencia um anexo (conhecimento.anexo_id)
      const queryRef = `SELECT anexo_id FROM conhecimento WHERE id = ?`;
      const refRes = await executeQueryAsti({ query: queryRef, values: [id] }) as Array<Record<string, unknown>> | undefined;
      let refAnexoId: number | null = null;
      if (refRes && refRes[0]) {
        const raw = refRes[0]["anexo_id"] as unknown;
        if (typeof raw === "number") refAnexoId = raw;
        else if (typeof raw === "string" && raw !== "") refAnexoId = Number(raw);
      }
      if (refAnexoId) anexosIds.push(refAnexoId);

      // Remover duplicatas
      const distinctAnexos = Array.from(new Set(anexosIds)).filter(Boolean);

      // Deletar anexos relacionados primeiro
      if (distinctAnexos.length > 0) {
        const placeholders = distinctAnexos.map(() => '?').join(',');
        const deleteAnexosQuery = `DELETE FROM anexo WHERE id IN (${placeholders})`;
        const deleteValues = distinctAnexos.map((v) => Number(v)) as (string | number)[];
        await executeQueryAsti({ query: deleteAnexosQuery, values: deleteValues });
      }
    } catch (cleanupErr) {
      // registrar aviso, mas continuar para tentar deletar o conhecimento
      console.warn('Falha ao limpar anexos relacionados antes de excluir conhecimento:', String(cleanupErr));
    }

    // Por fim, deletar o conhecimento
    const query = `DELETE FROM conhecimento WHERE id = ?`;
    await executeQueryAsti({ query, values: [id] });
    return NextResponse.json({ mensagem: "Registro excluído" });
  } catch (err) {
    return NextResponse.json({ erro: "Falha ao excluir", detalhe: String(err) }, { status: 500 });
  }
}
