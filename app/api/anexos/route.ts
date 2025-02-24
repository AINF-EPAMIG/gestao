import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { RowDataPacket } from "mysql2"

interface AnexoRow extends RowDataPacket {
  id: number
  nome_arquivo: string
  caminho_arquivo: string
  tipo_arquivo: string
  tamanho_bytes: number
  data_upload: string
  usuario_email: string
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get("taskId")

    if (!taskId) {
      return NextResponse.json(
        { error: "ID da tarefa não fornecido" },
        { status: 400 }
      )
    }

    const [rows] = await db.execute<AnexoRow[]>(
      `SELECT 
        id,
        nome_arquivo,
        caminho_arquivo,
        tipo_arquivo,
        tamanho_bytes,
        data_upload,
        usuario_email
      FROM u711845530_gestao.anexos 
      WHERE atividade_id = ?
      ORDER BY data_upload DESC`,
      [taskId]
    )

    return NextResponse.json(rows || [])
  } catch (error) {
    console.error("Erro ao listar anexos:", error)
    return NextResponse.json([])
  }
} 