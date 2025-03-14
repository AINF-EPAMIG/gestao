import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ResultSetHeader } from "mysql2"
import { uploadFileToDrive } from "@/lib/google-drive"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Verificar se temos o token de acesso
    if (!session.accessToken) {
      return NextResponse.json(
        { error: "Token de acesso do Google não disponível" },
        { status: 401 }
      )
    }

    // Verificar se há erro no token
    if (session.error) {
      return NextResponse.json(
        { error: `Erro na autenticação: ${session.error}` },
        { status: 401 }
      );
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
        // Converter o arquivo para buffer
        const fileBuffer = Buffer.from(await file.arrayBuffer())
        
        // Upload para o Google Drive usando o token do usuário
        const driveFile = await uploadFileToDrive(
          session.accessToken,
          fileBuffer,
          file.name,
          file.type
        )

        // Salvar informações no banco
        const [result] = await db.execute<ResultSetHeader>(
          `INSERT INTO u711845530_gestao.anexos (
            atividade_id,
            nome_arquivo,
            caminho_arquivo,
            tipo_arquivo,
            tamanho_bytes,
            usuario_email,
            google_drive_id,
            google_drive_link
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            taskId,
            file.name,
            driveFile.name,
            file.type,
            file.size,
            session.user?.email,
            driveFile.id,
            driveFile.webViewLink
          ]
        )

        savedFiles.push({
          id: result.insertId,
          nome_arquivo: file.name,
          caminho_arquivo: driveFile.name,
          tipo_arquivo: file.type,
          tamanho_bytes: file.size,
          usuario_email: session.user?.email,
          google_drive_id: driveFile.id,
          google_drive_link: driveFile.webViewLink,
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

    // Atualiza a data da última atualização da tarefa
    const date = new Date();
    date.setHours(date.getHours() - 3);
    const now = date.toISOString();
    
    await db.execute(
      `UPDATE u711845530_gestao.atividades SET ultima_atualizacao = ? WHERE id = ?`,
      [now, taskId]
    );

    return NextResponse.json(savedFiles)
  } catch (error) {
    console.error("Erro ao fazer upload:", error)
    return NextResponse.json(
      { error: "Erro ao fazer upload" },
      { status: 500 }
    )
  }
} 