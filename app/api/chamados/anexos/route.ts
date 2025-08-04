import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { dbAtendimento } from "@/lib/db"
import { RowDataPacket } from "mysql2"

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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const chamadoId = searchParams.get("chamadoId")
    const origem = searchParams.get("origem") // Novo parâmetro para identificar a origem

    if (!chamadoId) {
      return NextResponse.json(
        { error: "ID do chamado não fornecido" },
        { status: 400 }
      )
    }

    // Determinar o tipo de registro baseado na origem
    let tipoRegistro = 'chamado'; // padrão
    if (origem === 'criacao_acessos') {
      tipoRegistro = 'acesso';
    }

    // Buscar anexos do chamado na nova tabela anexos
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
        google_drive_link
      FROM anexos 
      WHERE tipo_registro = ? AND registro_id = ?
      ORDER BY data_upload DESC`,
      [tipoRegistro, chamadoId]
    )

    return NextResponse.json(rows || [])
  } catch (error) {
    console.error("Erro ao listar anexos do chamado:", error)
    return NextResponse.json(
      { error: "Erro ao listar anexos" },
      { status: 500 }
    )
  }
} 