import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { RowDataPacket } from "mysql2"
import { getFileFromDrive } from "@/lib/google-drive"

interface AnexoRow extends RowDataPacket {
  id: number
  nome_arquivo: string
  caminho_arquivo: string
  tipo_arquivo: string
  google_drive_id: string
  google_drive_link: string
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

    // Verificar se temos o token de acesso
    if (!session.accessToken) {
      console.log("Erro: Token de acesso do Google não disponível")
      return NextResponse.json(
        { error: "Token de acesso do Google não disponível" },
        { status: 401 }
      )
    }

    // Verificar se há erro no token
    if (session.error) {
      console.log(`Erro: Erro na autenticação: ${session.error}`)
      return NextResponse.json(
        { error: `Erro na autenticação: ${session.error}` },
        { status: 401 }
      );
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
        driveFileId: anexo.google_drive_id
      })

      // Se temos um ID do Google Drive, baixamos o arquivo de lá
      if (anexo.google_drive_id) {
        try {
          // Obter o arquivo do Google Drive
          const driveFile = await getFileFromDrive(session.accessToken, anexo.google_drive_id)
          
          // Criar uma resposta com o conteúdo do arquivo
          const response = new NextResponse(driveFile.content)
          
          // Definir os cabeçalhos apropriados
          response.headers.set('Content-Type', anexo.tipo_arquivo)
          response.headers.set('Content-Disposition', `attachment; filename="${anexo.nome_arquivo}"`)
          
          return response
        } catch (driveError) {
          console.error("Erro ao obter arquivo do Google Drive:", driveError)
          
          // Se falhar o download, redirecionamos para o link de visualização
          if (anexo.google_drive_link) {
            return NextResponse.redirect(anexo.google_drive_link)
          }
          
          throw driveError
        }
      }

      // Fallback para o método antigo ou retornar apenas os dados
      return NextResponse.json({
        message: "Arquivo encontrado, mas não está no Google Drive",
        dados: {
          id: anexo.id,
          nome: anexo.nome_arquivo,
          tipo: anexo.tipo_arquivo,
          caminho: anexo.caminho_arquivo,
          google_drive_link: anexo.google_drive_link
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