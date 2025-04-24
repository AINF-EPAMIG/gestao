import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'

interface Comentario {
  id: number;
  atividade_id: number;
  usuario_email: string;
  usuario_nome: string | null;
  comentario: string;
  data_criacao: string;
  data_edicao: string | null;
}

interface InsertResult {
  insertId: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const atividade_id = searchParams.get('atividade_id')

  if (!atividade_id) {
    return NextResponse.json({ error: 'ID da atividade é obrigatório' }, { status: 400 })
  }

  try {
    const comentarios = await executeQuery({
      query: 'SELECT * FROM u711845530_gestao.comentarios WHERE atividade_id = ? ORDER BY data_criacao DESC',
      values: [atividade_id]
    }) as Comentario[]

    return NextResponse.json(comentarios)
  } catch (error) {
    console.error('Erro ao buscar comentários:', error)
    return NextResponse.json({ error: 'Erro ao buscar comentários' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { atividade_id, usuario_email, usuario_nome, comentario } = body

    if (!atividade_id || !usuario_email || !comentario) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    const result = await executeQuery({
      query: 'INSERT INTO u711845530_gestao.comentarios (atividade_id, usuario_email, usuario_nome, comentario) VALUES (?, ?, ?, ?)',
      values: [atividade_id, usuario_email, usuario_nome, comentario]
    }) as InsertResult

    // Atualiza a data da última atualização da tarefa com ajuste de -3h
    await executeQuery({
      query: 'UPDATE u711845530_gestao.atividades SET ultima_atualizacao = DATE_SUB(NOW(), INTERVAL 3 HOUR) WHERE id = ?',
      values: [atividade_id]
    });

    const [novoComentario] = await executeQuery({
      query: 'SELECT * FROM u711845530_gestao.comentarios WHERE id = ?',
      values: [result.insertId]
    }) as Comentario[]

    return NextResponse.json(novoComentario)
  } catch (error) {
    console.error('Erro ao criar comentário:', error)
    return NextResponse.json(
      { error: 'Erro ao criar comentário' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, comentario, usuario_email } = body

    if (!id || !comentario || !usuario_email) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    // Verifica se o usuário é o autor do comentário
    const [comentarioExistente] = await executeQuery({
      query: 'SELECT * FROM u711845530_gestao.comentarios WHERE id = ? AND usuario_email = ?',
      values: [id, usuario_email]
    }) as Comentario[]

    if (!comentarioExistente) {
      return NextResponse.json(
        { error: 'Comentário não encontrado ou usuário não autorizado' },
        { status: 403 }
      )
    }

    await executeQuery({
      query: 'UPDATE u711845530_gestao.comentarios SET comentario = ?, data_edicao = NOW() WHERE id = ?',
      values: [comentario, id]
    })

    // Atualiza a data da última atualização da tarefa com ajuste de -3h
    await executeQuery({
      query: 'UPDATE u711845530_gestao.atividades SET ultima_atualizacao = DATE_SUB(NOW(), INTERVAL 3 HOUR) WHERE id = ?',
      values: [comentarioExistente.atividade_id]
    });

    const [comentarioAtualizado] = await executeQuery({
      query: 'SELECT * FROM u711845530_gestao.comentarios WHERE id = ?',
      values: [id]
    }) as Comentario[]

    return NextResponse.json(comentarioAtualizado)
  } catch (error) {
    console.error('Erro ao atualizar comentário:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar comentário' },
      { status: 500 }
    )
  }
} 