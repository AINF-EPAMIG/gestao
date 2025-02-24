import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { readFile } from "fs/promises"
import { join } from "path"
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
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Extrair o ID da URL
    const pathParts = request.nextUrl.pathname.split('/')
    const anexoId = pathParts[pathParts.length - 1]

    // Buscar informações do anexo no banco
    const [rows] = await db.execute<AnexoRow[]>(
      "SELECT * FROM u711845530_gestao.anexos WHERE id = ?",
      [anexoId]
    )

    if (!rows.length) {
      return NextResponse.json(
        { error: "Anexo não encontrado" },
        { status: 404 }
      )
    }

    const anexo = rows[0]
    const filePath = join(process.cwd(), "uploads", anexo.caminho_arquivo)

    // Ler arquivo do disco
    const fileBuffer = await readFile(filePath)

    // Configurar headers para download
    const headers = new Headers()
    headers.set("Content-Type", anexo.tipo_arquivo)
    headers.set(
      "Content-Disposition",
      `attachment; filename="${anexo.nome_arquivo}"`
    )

    return new NextResponse(fileBuffer, {
      headers,
    })
  } catch (error) {
    console.error("Erro ao baixar anexo:", error)
    return NextResponse.json(
      { error: "Erro ao baixar anexo" },
      { status: 500 }
    )
  }
} 