import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteFileFromDrive } from "@/lib/google-drive";

interface SessionWithAccessToken {
  accessToken?: string;
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  error?: string;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions) as SessionWithAccessToken;
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar se temos o token de acesso
    if (!session.accessToken) {
      return NextResponse.json(
        { error: "Token de acesso do Google não disponível" },
        { status: 401 }
      );
    }

    // Verificar se há erro no token
    if (session.error) {
      return NextResponse.json(
        { error: `Erro na autenticação: ${session.error}` },
        { status: 401 }
      );
    }

    const id = params.id;
    if (!id) {
      return NextResponse.json(
        { error: "ID do anexo não fornecido" },
        { status: 400 }
      );
    }

    // Buscar informações do anexo antes de excluir
    const [anexos] = await db.execute(
      `SELECT google_drive_id, atividade_id FROM u711845530_gestao.anexos WHERE id = ?`,
      [id]
    );

    const anexosArray = anexos as any[];
    if (!anexosArray.length) {
      return NextResponse.json(
        { error: "Anexo não encontrado" },
        { status: 404 }
      );
    }

    const googleDriveId = anexosArray[0].google_drive_id;
    const atividadeId = anexosArray[0].atividade_id;

    // Excluir o arquivo do Google Drive
    try {
      await deleteFileFromDrive(session.accessToken, googleDriveId);
    } catch (driveError) {
      console.error("Erro ao excluir arquivo do Google Drive:", driveError);
      // Continuamos mesmo se falhar a exclusão no Drive, para remover do banco
    }

    // Excluir o registro do banco de dados
    await db.execute(
      `DELETE FROM u711845530_gestao.anexos WHERE id = ?`,
      [id]
    );

    // Atualiza a data da última atualização da tarefa
    const date = new Date();
    date.setHours(date.getHours() - 3);
    const now = date.toISOString();
    
    await db.execute(
      `UPDATE u711845530_gestao.atividades SET ultima_atualizacao = ? WHERE id = ?`,
      [now, atividadeId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir anexo:", error);
    return NextResponse.json(
      { error: "Erro ao excluir anexo", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}