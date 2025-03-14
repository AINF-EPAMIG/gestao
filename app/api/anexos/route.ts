import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Obter o ID da tarefa da query string
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get("taskId")

    if (!taskId) {
      return NextResponse.json(
        { error: "ID da tarefa não fornecido" },
        { status: 400 }
      )
    }

    // Buscar anexos da tarefa
    const [anexos] = await db.execute(
      `SELECT 
        id,
        nome_arquivo,
        caminho_arquivo,
        tipo_arquivo,
        tamanho_bytes,
        usuario_email,
        google_drive_id,
        google_drive_link,
        DATE_FORMAT(data_upload, '%Y-%m-%dT%H:%i:%s.000Z') as data_upload
      FROM u711845530_gestao.anexos
      WHERE atividade_id = ?
      ORDER BY data_upload DESC`,
      [taskId]
    )

    return NextResponse.json(anexos)
  } catch (error) {
    console.error("Erro ao buscar anexos:", error)
    return NextResponse.json(
      { error: "Erro ao buscar anexos", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 