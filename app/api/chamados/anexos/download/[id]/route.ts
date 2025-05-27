import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { dbAtendimento } from "@/lib/db"
import { RowDataPacket } from "mysql2"
import fs from 'fs'
import path from 'path'

interface AnexoRow extends RowDataPacket {
  id: number
  tipo_registro: string
  registro_id: number
  nome_arquivo: string
  caminho_arquivo: string
  tipo_arquivo: string
  tamanho_bytes: number
  data_upload: string
  usuario_upload: string
  google_drive_id: string
  google_drive_link: string
  conteudo_arquivo: Buffer | null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const resolvedParams = await params
    const anexoId = resolvedParams.id

    // Buscar o anexo na nova tabela
    const [rows] = await dbAtendimento.execute<AnexoRow[]>(
      `SELECT 
        id,
        tipo_registro,
        registro_id,
        nome_arquivo,
        caminho_arquivo,
        tipo_arquivo,
        tamanho_bytes,
        data_upload,
        usuario_upload,
        google_drive_id,
        google_drive_link,
        conteudo_arquivo
      FROM anexos 
      WHERE id = ? AND tipo_registro = 'chamado'`,
      [anexoId]
    )

    if (!rows.length) {
      return NextResponse.json(
        { error: "Anexo não encontrado" },
        { status: 404 }
      )
    }

    const anexo = rows[0]

    // Se temos conteúdo do arquivo no banco, usar ele
    if (anexo.conteudo_arquivo) {
      const response = new NextResponse(anexo.conteudo_arquivo)
      
      // Definir cabeçalhos
      response.headers.set('Content-Type', anexo.tipo_arquivo || 'application/octet-stream')
      response.headers.set('Content-Disposition', `attachment; filename="${anexo.nome_arquivo}"`)
      response.headers.set('Content-Length', anexo.tamanho_bytes.toString())
      
      return response
    }

    // Se não temos conteúdo no banco, mas temos Google Drive ID
    if (anexo.google_drive_id) {
      // Redirecionar para o link do Google Drive ou tentar baixar
      if (anexo.google_drive_link) {
        return NextResponse.redirect(anexo.google_drive_link)
      }
    }

    // Se temos caminho do arquivo, tentar buscar no sistema de arquivos
    if (anexo.caminho_arquivo) {
      try {
        // Construir o caminho completo do arquivo
        const uploadsPath = path.join(process.cwd(), 'public', 'uploads')
        const filePath = path.join(uploadsPath, anexo.caminho_arquivo)

        // Verificar se o arquivo existe
        if (fs.existsSync(filePath)) {
          // Ler o arquivo
          const fileBuffer = fs.readFileSync(filePath)
          
          const response = new NextResponse(fileBuffer)
          
          // Definir cabeçalhos
          response.headers.set('Content-Type', anexo.tipo_arquivo || 'application/octet-stream')
          response.headers.set('Content-Disposition', `attachment; filename="${anexo.nome_arquivo}"`)
          response.headers.set('Content-Length', fileBuffer.length.toString())
          
          return response
        }
      } catch (fsError) {
        console.error("Erro ao acessar arquivo no sistema:", fsError)
      }
    }

    return NextResponse.json(
      { error: "Arquivo não encontrado no servidor" },
      { status: 404 }
    )

  } catch (error) {
    console.error("Erro ao baixar anexo do chamado:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
} 