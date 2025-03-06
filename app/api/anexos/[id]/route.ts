import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { RowDataPacket } from "mysql2";

// Interface para o resultado da consulta
interface AnexoInfo extends RowDataPacket {
  atividade_id: number;
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

    // Extrair o ID da URL
    const pathParts = request.nextUrl.pathname.split('/');
    const anexoId = pathParts[pathParts.length - 1];
    console.log("[Delete] ID do anexo:", anexoId)

    // Buscar o ID da atividade antes de excluir o anexo
    const [anexoInfo] = await db.execute<AnexoInfo[]>(
      "SELECT atividade_id FROM u711845530_gestao.anexos WHERE id = ?",
      [anexoId]
    );
    
    // Verificar se o anexo existe e obter o ID da atividade
    if (!anexoInfo || !Array.isArray(anexoInfo) || anexoInfo.length === 0) {
      return NextResponse.json({ error: "Anexo não encontrado" }, { status: 404 });
    }
    
    const atividadeId = anexoInfo[0].atividade_id;

    // Excluir do banco de dados
    await db.execute(
      "DELETE FROM u711845530_gestao.anexos WHERE id = ?",
      [anexoId]
    );
    console.log("[Delete] Registro excluído do banco com sucesso")

    // Atualiza a data da última atualização da tarefa
    const date = new Date();
    date.setHours(date.getHours() - 3);
    const now = date.toISOString();
    
    await db.execute(
      "UPDATE u711845530_gestao.atividades SET ultima_atualizacao = ? WHERE id = ?",
      [now, atividadeId]
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