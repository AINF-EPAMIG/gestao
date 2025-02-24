import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

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

    // Excluir do banco de dados
    await db.execute(
      "DELETE FROM u711845530_gestao.anexos WHERE id = ?",
      [anexoId]
    );
    console.log("[Delete] Registro excluído do banco com sucesso")

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Delete] Erro ao excluir anexo:", error);
    return NextResponse.json(
      { error: "Erro ao excluir anexo" },
      { status: 500 }
    );
  }
}