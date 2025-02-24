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
  // Log inicial para garantir que a função está sendo chamada
  console.log("=== INÍCIO DO DOWNLOAD ===")
  console.log("Request URL:", request.url)
  console.log("Request method:", request.method)

  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions)
    console.log("Sessão:", session ? "Autenticado" : "Não autenticado")

    if (!session) {
      console.log("Erro: Usuário não autenticado")
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Extrair ID
    const pathParts = request.nextUrl.pathname.split('/')
    const anexoId = pathParts[pathParts.length - 1]
    console.log("ID do anexo solicitado:", anexoId)

    try {
      // Buscar no banco
      const [rows] = await db.execute<AnexoRow[]>(
        "SELECT * FROM u711845530_gestao.anexos WHERE id = ?",
        [anexoId]
      )
      console.log("Resultado da consulta:", {
        encontrado: rows.length > 0,
        totalRegistros: rows.length
      })

      if (!rows.length) {
        console.log("Anexo não encontrado no banco")
        return NextResponse.json(
          { error: "Anexo não encontrado" },
          { status: 404 }
        )
      }

      const anexo = rows[0]
      console.log("Dados do anexo:", {
        id: anexo.id,
        nome: anexo.nome_arquivo,
        tipo: anexo.tipo_arquivo,
        caminho: anexo.caminho_arquivo
      })

      // Por enquanto, vamos apenas retornar os dados do arquivo
      return NextResponse.json({
        message: "Arquivo encontrado",
        dados: {
          id: anexo.id,
          nome: anexo.nome_arquivo,
          tipo: anexo.tipo_arquivo,
          caminho: anexo.caminho_arquivo
        }
      })

    } catch (dbError) {
      console.error("Erro na consulta ao banco:", dbError)
      throw dbError
    }

  } catch (error) {
    console.log("=== ERRO NO DOWNLOAD ===")
    console.error("Detalhes do erro:", {
      mensagem: error instanceof Error ? error.message : "Erro desconhecido",
      tipo: typeof error,
      erro: error
    })
    
    return NextResponse.json(
      { error: "Erro ao baixar anexo" },
      { status: 500 }
    )
  } finally {
    console.log("=== FIM DO DOWNLOAD ===")
  }
} 