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
    const [rows] = await db.execute<AnexoRow[]>(
      "SELECT * FROM u711845530_gestao.anexos WHERE id = ?",
      [anexoId]
    )

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
      tipo: anexo.tipo_arquivo
    })

    // Redirecionar para a URL do arquivo
    return NextResponse.redirect(anexo.caminho_arquivo)
  } catch (error) {
    console.error("[Download] Erro ao baixar anexo:", error)
    return NextResponse.json(
      { error: "Erro ao baixar anexo" },
      { status: 500 }
    )
  }
} 