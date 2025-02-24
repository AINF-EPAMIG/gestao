import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ResultSetHeader } from "mysql2"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const formData = await request.formData()
    const taskId = formData.get("taskId")
    const files = formData.getAll("files")

    if (!taskId || !files.length) {
      return NextResponse.json(
        { error: "Dados inválidos" },
        { status: 400 }
      )
    }

    const savedFiles = []

    for (const file of files) {
      if (!(file instanceof File)) {
        continue
      }

      try {
        // Gerar nome único para o arquivo
        const fileName = `${Date.now()}-${file.name}`

        // Salvar informações no banco
        const [result] = await db.execute<ResultSetHeader>(
          `INSERT INTO u711845530_gestao.anexos (
            atividade_id,
            nome_arquivo,
            caminho_arquivo,
            tipo_arquivo,
            tamanho_bytes,
            usuario_email
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            taskId,
            file.name,
            fileName,
            file.type,
            file.size,
            session.user?.email
          ]
        )

        savedFiles.push({
          id: result.insertId,
          nome_arquivo: file.name,
          caminho_arquivo: fileName,
          tipo_arquivo: file.type,
          tamanho_bytes: file.size,
          usuario_email: session.user?.email,
          data_upload: new Date().toISOString()
        })
      } catch (error) {
        console.error("Erro ao processar arquivo:", {
          fileName: file.name,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        })
        throw error
      }
    }

    return NextResponse.json(savedFiles)
  } catch (error) {
    console.error("Erro crítico no upload:", {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error
    })
    
    return NextResponse.json(
      { 
        error: "Erro ao fazer upload dos arquivos",
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
} 