import { NextRequest, NextResponse } from "next/server";
import { executeQueryAsti } from "@/lib/db";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { deleteFileFromDrive, uploadFileToDrive } from "@/lib/google-drive";
import { KNOWLEDGE_CATEGORIES } from "@/lib/constants";

function extractBase64Payload(raw: string | undefined | null) {
  if (!raw) return null;
  const commaIndex = raw.indexOf(",");
  return commaIndex > -1 ? raw.substring(commaIndex + 1) : raw;
}

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
  if (!session.accessToken || session.error) {
    return NextResponse.json({ erro: session.error ? `Erro de autenticação: ${session.error}` : "Token de acesso do Google indisponível" }, { status: 401 });
  }
  const paramsObj = await params;
  const id = String(paramsObj?.id ?? "");
  try {
    const body = await req.json();

    // aceita tipo vindo como string "0"/"1" ou como número
    const tipo = Number(body.tipo);
    const categoriaValue = typeof body.categoria === "string" ? body.categoria.trim() : "";
    if (
      !body.nome ||
      isNaN(tipo) ||
      (tipo !== 0 && tipo !== 1) ||
      !body.descricao ||
      !categoriaValue ||
      !KNOWLEDGE_CATEGORIES.includes(categoriaValue as (typeof KNOWLEDGE_CATEGORIES)[number])
    ) {
      return NextResponse.json({ erro: "Campos obrigatórios ausentes ou inválidos" }, { status: 400 });
    }

    const linkValue = typeof body.link === "string" && body.link.trim() !== "" ? body.link.trim() : null;

    // Atualiza apenas campos principais primeiro. Fazemos a atualização das colunas
    // de modificação em uma query separada para evitar falha caso tais colunas não existam.
    const queryMain = `
      UPDATE conhecimento
      SET nome = ?, tipo = ?, descricao = ?, categoria = ?, link = ?
      WHERE id = ?
    `;
    const valuesMain = [body.nome, tipo, body.descricao, categoriaValue, linkValue, id];
    await executeQueryAsti({ query: queryMain, values: valuesMain });

    // Se veio anexo no body, apagar anexo antigo, inserir novo anexo e atualizar o conhecimento.anexo_id
    try {
      if (body.anexo && body.anexo.conteudo_base64) {
        // Buscar anexos antigos relacionados para remoção (inclui dados do Drive)
        const queryGetOldAnexo = `SELECT id, google_drive_id FROM anexo WHERE conhecimento_id = ?`;
        const oldAnexoRes = await executeQueryAsti({ query: queryGetOldAnexo, values: [id] }) as Array<{ id: number; google_drive_id: string | null }>;

        if (oldAnexoRes.length > 0) {
          for (const anexoRow of oldAnexoRes) {
            if (anexoRow.google_drive_id) {
              try {
                await deleteFileFromDrive(session.accessToken!, anexoRow.google_drive_id);
              } catch (driveErr) {
                console.warn("Falha ao remover arquivo antigo do Google Drive:", driveErr);
              }
            }
          }
          const placeholders = oldAnexoRes.map(() => "?").join(",");
          await executeQueryAsti({
            query: `DELETE FROM anexo WHERE id IN (${placeholders})`,
            values: oldAnexoRes.map((row) => row.id)
          });
        }

        // Inserir novo anexo
        const anexo = body.anexo;
        // server-side validation: only accept PDFs on update
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
            anexo.nome_arquivo || anexo.name || `arquivo-${id}.pdf`,
            anexo.tipo_arquivo || anexo.type || "application/pdf"
          );
        } catch (driveError) {
          console.error("Erro ao enviar novo anexo para o Google Drive:", driveError);
          return NextResponse.json({ erro: "Falha ao salvar anexo no Google Drive" }, { status: 502 });
        }
        const insertAnexoQuery = `
          INSERT INTO anexo (conhecimento_id, nome_arquivo, caminho_arquivo, google_drive_id, google_drive_link, tipo_arquivo, tamanho_bytes, dt_upload, usuario_email, conteudo_arquivo)
          VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)
        `;
        const insertAnexoValues = [
          id,
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
  if (!session.accessToken || session.error) {
    return NextResponse.json({ erro: session.error ? `Erro de autenticação: ${session.error}` : "Token de acesso do Google indisponível" }, { status: 401 });
  }
  const paramsObj = await params;
  const id = String(paramsObj?.id ?? "");
  try {
    // Primeiro, buscar anexos relacionados (por conhecimento_id ou por anexo_id referenciado)
    try {
      const anexosParaExcluir: Array<{ id: number; google_drive_id: string | null }> = [];

      const queryAnexos = `SELECT id, google_drive_id FROM anexo WHERE conhecimento_id = ?`;
      const anexosResultado = await executeQueryAsti({ query: queryAnexos, values: [id] }) as Array<{ id: number; google_drive_id: string | null }> | undefined;
      if (anexosResultado) {
        anexosResultado.forEach((row) => {
          if (typeof row.id === "number") {
            anexosParaExcluir.push({ id: row.id, google_drive_id: row.google_drive_id || null });
          }
        });
      }

      // Também verificar se o próprio conhecimento referencia um anexo (conhecimento.anexo_id)
      const queryRef = `SELECT anexo_id FROM conhecimento WHERE id = ?`;
      const refRes = await executeQueryAsti({ query: queryRef, values: [id] }) as Array<Record<string, unknown>> | undefined;
      let refAnexo: { id: number; google_drive_id: string | null } | null = null;
      if (refRes && refRes[0]) {
        const raw = refRes[0]["anexo_id"] as unknown;
        const numeric = typeof raw === "number" ? raw : (typeof raw === "string" && raw !== "" ? Number(raw) : NaN);
        if (!Number.isNaN(numeric) && numeric > 0) {
          refAnexo = { id: numeric, google_drive_id: null };
        }
      }

      if (refAnexo && !anexosParaExcluir.find((row) => row.id === refAnexo.id)) {
        const refRow = await executeQueryAsti({
          query: `SELECT id, google_drive_id FROM anexo WHERE id = ?`,
          values: [refAnexo.id]
        }) as Array<{ id: number; google_drive_id: string | null }> | undefined;
        if (refRow && refRow[0]) {
          anexosParaExcluir.push(refRow[0]);
        } else {
          anexosParaExcluir.push(refAnexo);
        }
      }

      if (anexosParaExcluir.length > 0) {
        for (const anexo of anexosParaExcluir) {
          if (anexo.google_drive_id) {
            try {
              await deleteFileFromDrive(session.accessToken!, anexo.google_drive_id);
            } catch (driveErr) {
              console.warn("Falha ao excluir arquivo do Google Drive:", driveErr);
            }
          }
        }

        const placeholders = anexosParaExcluir.map(() => '?').join(',');
        await executeQueryAsti({
          query: `DELETE FROM anexo WHERE id IN (${placeholders})`,
          values: anexosParaExcluir.map((row) => row.id)
        });
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
