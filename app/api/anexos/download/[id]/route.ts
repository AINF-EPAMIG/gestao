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
}

export async function GET(
  request: NextRequest
) {
  try {
    console.log("[Download] DEBUG - URL completa:", request.url)
    console.log("[Download] Iniciando processo de download")
    
    const session = await getServerSession(authOptions)
    if (!session) {
      console.log("[Download] Erro: Usuário não autenticado")
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }
    console.log("[Download] Usuário autenticado:", session.user?.email)

    // Extrair o ID da URL
    const pathParts = request.nextUrl.pathname.split('/')
    const anexoId = pathParts[pathParts.length - 1]
    console.log("[Download] ID do anexo:", anexoId)

    // Buscar informações do anexo no banco
    console.log("[Download] Buscando anexo no banco...")
    const [rows] = await db.execute<AnexoRow[]>(
      "SELECT * FROM u711845530_gestao.anexos WHERE id = ?",
      [anexoId]
    )
    console.log("[Download] Resultado da busca:", {
      encontrado: rows.length > 0,
      dados: rows.length > 0 ? {
        id: rows[0].id,
        nome: rows[0].nome_arquivo,
        caminho: rows[0].caminho_arquivo,
        tipo: rows[0].tipo_arquivo
      } : null
    })

    if (!rows.length) {
      console.log("[Download] Anexo não encontrado")
      return NextResponse.json(
        { error: "Anexo não encontrado" },
        { status: 404 }
      )
    }

    const anexo = rows[0]
    console.log("[Download] Anexo encontrado:", {
      nome: anexo.nome_arquivo,
      tipo: anexo.tipo_arquivo,
      caminho: anexo.caminho_arquivo
    })

    // Construir URL completa para o arquivo
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
    const fileUrl = `${baseUrl}/uploads/${anexo.caminho_arquivo}`
    console.log("[Download] URL do arquivo:", fileUrl)

    // Redirecionar para a URL do arquivo
    console.log("[Download] Redirecionando para o arquivo...")
    return NextResponse.redirect(fileUrl)
  } catch (error) {
    console.error("[Download] Erro ao baixar anexo:", {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error,
      type: typeof error
    })
    return NextResponse.json(
      { error: "Erro ao baixar anexo" },
      { status: 500 }
    )
  }
} 