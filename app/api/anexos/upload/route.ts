import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ResultSetHeader } from "mysql2"
import { uploadFileToDrive } from "@/lib/google-drive"

export async function POST(request: NextRequest) {
  try {
    console.log("[Upload] Iniciando processo de upload")
    
    const session = await getServerSession(authOptions)
    if (!session) {
      console.log("[Upload] Erro: Usuário não autenticado")
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    console.log("[Upload] Usuário autenticado:", session.user?.email)

    // Verificar se temos o token de acesso
    if (!session.accessToken) {
      console.log("[Upload] Erro: Token de acesso do Google não disponível")
      return NextResponse.json(
        { error: "Token de acesso do Google não disponível" },
        { status: 401 }
      )
    }

    // Verificar se há erro no token
    if (session.error) {
      console.log("[Upload] Erro na autenticação:", session.error)
      return NextResponse.json(
        { error: `Erro na autenticação: ${session.error}` },
        { status: 401 }
      );
    }

    const formData = await request.formData()
    const taskId = formData.get("taskId")
    const files = formData.getAll("files")

    console.log("[Upload] Dados recebidos:", {
      taskId,
      numberOfFiles: files.length
    })

    if (!taskId || !files.length) {
      console.log("[Upload] Erro: Dados inválidos")
      return NextResponse.json(
        { error: "Dados inválidos" },
        { status: 400 }
      )
    }

    const savedFiles = []

    for (const file of files) {
      if (!(file instanceof File)) {
        console.log("[Upload] Arquivo ignorado (não é uma instância de File)")
        continue
      }

      console.log("[Upload] Processando arquivo:", {
        name: file.name,
        type: file.type,
        size: file.size
      })

      try {
        // Converter o arquivo para buffer
        console.log("[Upload] Convertendo arquivo para buffer...")
        const fileBuffer = Buffer.from(await file.arrayBuffer())
        console.log("[Upload] Buffer criado com sucesso, tamanho:", fileBuffer.length)
        
        // Upload para o Google Drive usando o token do usuário
        console.log("[Upload] Iniciando upload para o Google Drive...")
        const driveFile = await uploadFileToDrive(
          session.accessToken,
          fileBuffer,
          file.name,
          file.type
        )
        console.log("[Upload] Upload para Google Drive concluído:", driveFile)

        // Salvar informações no banco
        console.log("[Upload] Salvando informações no banco de dados...")
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
            file.name,
            file.type,
            file.size,
            session.user?.email,
            driveFile.id,
            driveFile.webViewLink || driveFile.webContentLink // Usar webViewLink primeiro
          ]
        )
        console.log("[Upload] Registro inserido no banco com ID:", result.insertId)

        savedFiles.push({
          id: result.insertId,
          nome_arquivo: file.name,
          caminho_arquivo: file.name,
          tipo_arquivo: file.type,
          tamanho_bytes: file.size,
          usuario_email: session.user?.email,
          google_drive_id: driveFile.id,
          google_drive_link: driveFile.webViewLink || driveFile.webContentLink,
          data_upload: new Date().toISOString()
        })
        console.log("[Upload] Arquivo processado com sucesso")
      } catch (error) {
        console.error("[Upload] Erro ao processar arquivo:", {
          fileName: file.name,
          error: error instanceof Error ? {
            message: error.message,
            stack: error.stack,
            name: error.name
          } : error
        })
        
        return NextResponse.json(
          { 
            error: `Erro ao processar arquivo ${file.name}`,
            details: error instanceof Error ? error.message : 'Erro desconhecido'
          },
          { status: 500 }
        )
      }
    }

    // Atualiza a data da última atualização da tarefa com ajuste de -3h
    console.log("[Upload] Atualizando timestamp da tarefa...")
    await db.execute(
      `UPDATE u711845530_gestao.atividades SET ultima_atualizacao = DATE_SUB(NOW(), INTERVAL 3 HOUR) WHERE id = ?`,
      [taskId]
    );
    console.log("[Upload] Timestamp da tarefa atualizado")

    console.log("[Upload] Upload concluído com sucesso. Arquivos salvos:", savedFiles.length)
    return NextResponse.json(savedFiles)
  } catch (error) {
    console.error("[Upload] Erro geral no upload:", {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error,
      type: typeof error
    })
    
    return NextResponse.json(
      { 
        error: "Erro interno do servidor durante o upload",
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
} 