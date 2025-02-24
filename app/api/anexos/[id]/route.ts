import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { unlink } from "fs/promises";
import { join } from "path";
import { RowDataPacket } from "mysql2";

interface AnexoRow extends RowDataPacket {
  id: number;
  nome_arquivo: string;
  caminho_arquivo: string;
  tipo_arquivo: string;
}

export async function DELETE(
  request: NextRequest
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Extrair o ID da URL
    const pathParts = request.nextUrl.pathname.split('/');
    const anexoId = pathParts[pathParts.length - 1];

    const [rows] = await db.execute<AnexoRow[]>(
      "SELECT * FROM u711845530_gestao.anexos WHERE id = ?",
      [anexoId]
    );

    if (!rows.length) {
      return NextResponse.json(
        { error: "Anexo não encontrado" },
        { status: 404 }
      );
    }

    const anexo = rows[0];
    const filePath = join(process.cwd(), "uploads", anexo.caminho_arquivo);
    await unlink(filePath);

    await db.execute(
      "DELETE FROM u711845530_gestao.anexos WHERE id = ?",
      [anexoId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir anexo:", error);
    return NextResponse.json(
      { error: "Erro ao excluir anexo" },
      { status: 500 }
    );
  }
}