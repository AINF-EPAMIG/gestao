import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'

interface Comentario {
  id: number;
  atividade_id?: number;
  chamado_id?: number;
  tipo_registro: 'atividade' | 'chamado';
  registro_id: number;
  responsavel_comentario: string;
  comentario: string;
  data_criacao: string;
  data_edicao?: string | null;
  usuario_email: string;
  usuario_nome: string | null;
}

interface InsertResult {
  insertId: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const atividade_id = searchParams.get('atividade_id')
  const chamado_id = searchParams.get('chamado_id')

  if (!atividade_id && !chamado_id) {
    return NextResponse.json({ error: 'ID da atividade ou chamado é obrigatório' }, { status: 400 })
  }

  try {
    let query = '';
    let values: (string | number)[] = [];

    if (chamado_id) {
      // Buscar comentários da nova tabela comentarios para chamados
      query = 'SELECT * FROM u711845530_atendimento.comentarios WHERE tipo_registro = ? AND registro_id = ? ORDER BY data_criacao DESC';
      values = ['chamado', parseInt(chamado_id)];
    } else if (atividade_id) {
      // Buscar comentários da tabela comentarios para atividades (kanban)
      query = 'SELECT * FROM u711845530_gestao.comentarios WHERE atividade_id = ? ORDER BY data_criacao DESC';
      values = [parseInt(atividade_id)];
    }

    const comentarios = await executeQuery({
      query,
      values
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
    const { atividade_id, chamado_id, comentario, usuario_email, usuario_nome } = body

    if (!comentario || (!atividade_id && !chamado_id)) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    let result: InsertResult;
    let novoComentario: Comentario[];

    if (chamado_id) {
      // Inserir na nova tabela comentarios para chamados
      result = await executeQuery({
        query: `
          INSERT INTO u711845530_atendimento.comentarios (
            tipo_registro,
            registro_id,
            responsavel_comentario,
            comentario,
            data_criacao
          ) 
          VALUES (?, ?, ?, ?, NOW())
        `,
        values: ['chamado', chamado_id, usuario_email || 'sistema', comentario]
      }) as InsertResult

      novoComentario = await executeQuery({
        query: 'SELECT * FROM u711845530_atendimento.comentarios WHERE id = ?',
        values: [result.insertId]
      }) as Comentario[]
    } else {
      // Inserir na tabela comentarios para atividades (kanban)
      result = await executeQuery({
        query: `
          INSERT INTO u711845530_gestao.comentarios (
            atividade_id, 
            usuario_email, 
            usuario_nome, 
            comentario,
            data_criacao
          ) 
          VALUES (?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL 3 HOUR))
        `,
        values: [atividade_id, usuario_email, usuario_nome, comentario]
      }) as InsertResult

      // Atualiza a data da última atualização da tarefa com ajuste de -3h
      await executeQuery({
        query: 'UPDATE u711845530_gestao.atividades SET ultima_atualizacao = DATE_SUB(NOW(), INTERVAL 3 HOUR) WHERE id = ?',
        values: [atividade_id]
      });

      novoComentario = await executeQuery({
        query: 'SELECT * FROM u711845530_gestao.comentarios WHERE id = ?',
        values: [result.insertId]
      }) as Comentario[]
    }

    return NextResponse.json(novoComentario[0])
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
    const { id, comentario, usuario_email, tipo_registro = 'atividade' } = body

    if (!id || !comentario || !usuario_email) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    let comentarioExistente: Comentario[];
    let comentarioAtualizado: Comentario[];

    if (tipo_registro === 'chamado') {
      // Verifica se o usuário é o autor do comentário na tabela de chamados
      comentarioExistente = await executeQuery({
        query: 'SELECT * FROM u711845530_atendimento.comentarios WHERE id = ? AND responsavel_comentario = ?',
        values: [id, usuario_email]
      }) as Comentario[]

      if (!comentarioExistente.length) {
        return NextResponse.json(
          { error: 'Comentário não encontrado ou usuário não autorizado' },
          { status: 403 }
        )
      }

      await executeQuery({
        query: 'UPDATE u711845530_atendimento.comentarios SET comentario = ?, data_edicao = NOW() WHERE id = ?',
        values: [comentario, id]
      })

      comentarioAtualizado = await executeQuery({
        query: 'SELECT * FROM u711845530_atendimento.comentarios WHERE id = ?',
        values: [id]
      }) as Comentario[]
    } else {
      // Verifica se o usuário é o autor do comentário na tabela de atividades
      comentarioExistente = await executeQuery({
        query: 'SELECT * FROM u711845530_gestao.comentarios WHERE id = ? AND usuario_email = ?',
        values: [id, usuario_email]
      }) as Comentario[]

      if (!comentarioExistente.length) {
        return NextResponse.json(
          { error: 'Comentário não encontrado ou usuário não autorizado' },
          { status: 403 }
        )
      }

      await executeQuery({
        query: 'UPDATE u711845530_gestao.comentarios SET comentario = ?, data_edicao = DATE_SUB(NOW(), INTERVAL 3 HOUR) WHERE id = ?',
        values: [comentario, id]
      })

      // Atualiza a data da última atualização da tarefa com ajuste de -3h
      if (comentarioExistente[0].atividade_id) {
        await executeQuery({
          query: 'UPDATE u711845530_gestao.atividades SET ultima_atualizacao = DATE_SUB(NOW(), INTERVAL 3 HOUR) WHERE id = ?',
          values: [comentarioExistente[0].atividade_id]
        });
      }

      comentarioAtualizado = await executeQuery({
        query: 'SELECT * FROM u711845530_gestao.comentarios WHERE id = ?',
        values: [id]
      }) as Comentario[]
    }

    return NextResponse.json(comentarioAtualizado[0])
  } catch (error) {
    console.error('Erro ao atualizar comentário:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar comentário' },
      { status: 500 }
    )
  }
} 