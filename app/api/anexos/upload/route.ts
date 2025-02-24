import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { writeFile } from "fs/promises"
import { join } from "path"
import { mkdir } from "fs/promises"
import { ResultSetHeader } from "mysql2"

export async function POST(request: NextRequest) {
  console.log("[Upload] DEBUG - Rota de upload acessada")
  
  try {
    // Verificar URL da requisição
    console.log("[Upload] DEBUG - URL da requisição:", request.url)
    
    console.log("[Upload] Iniciando processo de upload")
    
    const session = await getServerSession(authOptions)
    console.log("[Upload] DEBUG - Resultado da sessão:", !!session)
    
    if (!session) {
      console.log("[Upload] Erro: Usuário não autenticado")
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }
    console.log("[Upload] Usuário autenticado:", session.user?.email)

    const formData = await request.formData()
    const taskId = formData.get("taskId")
    const files = formData.getAll("files")
    
    console.log("[Upload] Dados recebidos:", {
      taskId,
      numberOfFiles: files.length,
      filesInfo: files.map(f => ({
        type: typeof f,
        isFile: f instanceof File,
        name: f instanceof File ? f.name : 'não é arquivo'
      }))
    })

    if (!taskId || !files.length) {
      console.log("[Upload] Erro: Dados inválidos", { taskId, files })
      return NextResponse.json(
        { error: "Dados inválidos" },
        { status: 400 }
      )
    }

    // Criar diretório de uploads se não existir
    const uploadDir = join(process.cwd(), "uploads")
    console.log("[Upload] Diretório de upload:", uploadDir)
    
    try {
      await mkdir(uploadDir, { recursive: true })
      console.log("[Upload] Diretório de upload criado/verificado com sucesso")
    } catch (error) {
      console.error("[Upload] Erro ao criar diretório:", error)
      throw error
    }

    const savedFiles = []

    for (const file of files) {
      if (!(file instanceof File)) {
        console.log("[Upload] Item não é um arquivo válido, pulando...")
        continue
      }

      console.log("[Upload] Processando arquivo:", {
        name: file.name,
        type: file.type,
        size: file.size
      })

      // Gerar nome único para o arquivo
      const fileName = `${Date.now()}-${file.name}`
      const filePath = join(uploadDir, fileName)
      console.log("[Upload] Caminho do arquivo:", filePath)

      try {
        // Salvar arquivo no disco
        const bytes = await file.arrayBuffer()
        await writeFile(filePath, Buffer.from(bytes))
        console.log("[Upload] Arquivo salvo no disco com sucesso")

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
        console.log("[Upload] Informações salvas no banco com sucesso", { insertId: result.insertId })

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
        console.error("[Upload] Erro ao processar arquivo:", {
          fileName,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        })
        throw error
      }
    }

    console.log("[Upload] Upload concluído com sucesso", {
      totalSaved: savedFiles.length
    })
    return NextResponse.json(savedFiles)
  } catch (error) {
    // Log mais detalhado do erro
    console.error("[Upload] Erro crítico no processo de upload:", {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error,
      type: typeof error
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