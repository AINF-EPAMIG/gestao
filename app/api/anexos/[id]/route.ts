import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { deleteFileFromDrive } from "@/lib/google-drive";

// Interface para o resultado da consulta
interface AnexoInfo extends RowDataPacket {
  atividade_id: number;
  google_drive_id: string;
}

export async function DELETE(
  request: NextRequest
) {
  try {
    console.log("[Delete] Iniciando processo de exclusão")
    
    const session = await getServerSession(authOptions);
    if (!session) {
      console.log("[Delete] Erro: Usuário não autenticado")
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    console.log("[Delete] Usuário autenticado:", session.user?.email)

    // Verificar se temos o token de acesso
    if (!session.accessToken) {
      console.log("[Delete] Erro: Token de acesso do Google não disponível")
      return NextResponse.json(
        { error: "Token de acesso do Google não disponível" },
        { status: 401 }
      )
    }

    // Verificar se há erro no token
    if (session.error) {
      console.log(`[Delete] Erro: Erro na autenticação: ${session.error}`)
      return NextResponse.json(
        { error: `Erro na autenticação: ${session.error}` },
        { status: 401 }
      );
    }

    // Extrair o ID da URL
    const pathParts = request.nextUrl.pathname.split('/');
    const anexoId = pathParts[pathParts.length - 1];
    console.log("[Delete] ID do anexo:", anexoId)

    // Buscar o ID da atividade e o ID do arquivo no Google Drive antes de excluir o anexo
    const [anexoInfo] = await db.execute<AnexoInfo[]>(
      "SELECT atividade_id, google_drive_id FROM u711845530_gestao.anexos WHERE id = ?",
      [anexoId]
    );
    
    // Verificar se o anexo existe e obter o ID da atividade
    if (!anexoInfo || !Array.isArray(anexoInfo) || anexoInfo.length === 0) {
      return NextResponse.json({ error: "Anexo não encontrado" }, { status: 404 });
    }
    
    const atividadeId = anexoInfo[0].atividade_id;
    const driveFileId = anexoInfo[0].google_drive_id;

    // Se tiver um ID do Google Drive, excluir o arquivo de lá
    if (driveFileId) {
      try {
        console.log("[Delete] Tentando excluir arquivo do Google Drive:", driveFileId);
        await deleteFileFromDrive(session.accessToken, driveFileId);
        console.log("[Delete] Arquivo excluído do Google Drive com sucesso");
      } catch (driveError) {
        console.error("[Delete] Erro ao excluir arquivo do Google Drive:", driveError);
        // Continuamos mesmo se falhar a exclusão no Drive
      }
    }

    // Excluir do banco de dados
    await db.execute(
      "DELETE FROM u711845530_gestao.anexos WHERE id = ?",
      [anexoId]
    );
    console.log("[Delete] Registro excluído do banco com sucesso")

    // Atualiza a data da última atualização da tarefa com ajuste de -3h
    await db.execute(
      "UPDATE u711845530_gestao.atividades SET ultima_atualizacao = DATE_SUB(NOW(), INTERVAL 3 HOUR) WHERE id = ?",
      [atividadeId]
    );
    console.log("[Delete] Timestamp da atividade atualizado com sucesso")

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Delete] Erro ao excluir anexo:", error);
    return NextResponse.json(
      { error: "Erro ao excluir anexo" },
      { status: 500 }
    );
  }
}