import { executeQuery } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Função utilitária para atualizar o timestamp da atividade pai
async function updateParentActivityTimestamp(atividadeId: number) {
  try {
    await executeQuery({
      query: `
        UPDATE u711845530_gestao.atividades 
        SET ultima_atualizacao = NOW() 
        WHERE id = ?
      `,
      values: [atividadeId]
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar timestamp da atividade pai:', error);
    // Não falha a operação principal se falhar ao atualizar timestamp
  }
}

interface Todo {
  id: number;
  atividade_id: number;
  titulo: string;
  descricao: string | null;
  concluido: boolean;
  ordem: number;
  data_criacao: string;
  data_conclusao: string | null;
  criado_por: string;
}

interface CreateTodoRequest {
  titulo: string;
  descricao?: string;
}

interface UpdateTodoRequest {
  titulo?: string;
  descricao?: string;
  concluido?: boolean;
  ordem?: number;
  data_conclusao?: string;
}

// GET - Buscar todos os To Dos de uma atividade
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const atividadeId = parseInt(id);
    
    if (isNaN(atividadeId)) {
      return NextResponse.json(
        { error: 'ID da atividade inválido' },
        { status: 400 }
      );
    }

    const todos = await executeQuery({
      query: `
        SELECT * FROM u711845530_gestao.atividades_todos 
        WHERE atividade_id = ? 
        ORDER BY ordem ASC, data_criacao ASC
      `,
      values: [atividadeId]
    }) as Todo[];

    return NextResponse.json(todos);
  } catch (error) {
    console.error('❌ Erro ao buscar To Dos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar um novo To Do
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const atividadeId = parseInt(id);
    if (isNaN(atividadeId)) {
      return NextResponse.json(
        { error: 'ID da atividade inválido' },
        { status: 400 }
      );
    }

    const body: CreateTodoRequest = await request.json();
    
    if (!body.titulo || body.titulo.trim() === '') {
      return NextResponse.json(
        { error: 'Título é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar a próxima ordem
    const maxOrdemResult = await executeQuery({
      query: `
        SELECT COALESCE(MAX(ordem), 0) as max_ordem 
        FROM u711845530_gestao.atividades_todos 
        WHERE atividade_id = ?
      `,
      values: [atividadeId]
    }) as { max_ordem: number }[];

    const novaOrdem = maxOrdemResult[0].max_ordem + 1;

    // Inserir o novo To Do
    const result = await executeQuery({
      query: `
        INSERT INTO u711845530_gestao.atividades_todos 
        (atividade_id, titulo, descricao, ordem, criado_por)
        VALUES (?, ?, ?, ?, ?)
      `,
      values: [
        atividadeId,
        body.titulo.trim(),
        body.descricao?.trim() || '',
        novaOrdem,
        session.user.email
      ]
    }) as { insertId: number };

    // Buscar o To Do criado
    const novoTodo = await executeQuery({
      query: `
        SELECT * FROM u711845530_gestao.atividades_todos 
        WHERE id = ?
      `,
      values: [result.insertId]
    }) as Todo[];

    // Atualizar timestamp da atividade pai
    await updateParentActivityTimestamp(atividadeId);

    return NextResponse.json(novoTodo[0], { status: 201 });
  } catch (error) {
    console.error('❌ Erro ao criar To Do:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar um To Do específico
export async function PUT(
  request: NextRequest
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const todoId = url.searchParams.get('todoId');
    
    if (!todoId) {
      return NextResponse.json(
        { error: 'ID do To Do é obrigatório' },
        { status: 400 }
      );
    }

    const body: UpdateTodoRequest = await request.json();
    
    // Construir query de update dinamicamente
    const updateFields: string[] = [];
    const updateValues: (string | number)[] = [];

    if (body.titulo !== undefined) {
      updateFields.push('titulo = ?');
      updateValues.push(body.titulo.trim());
    }

    if (body.descricao !== undefined) {
      updateFields.push('descricao = ?');
      updateValues.push(body.descricao?.trim() || '');
    }

    if (body.concluido !== undefined) {
      updateFields.push('concluido = ?');
      updateValues.push(body.concluido ? 1 : 0);
      
      if (body.concluido) {
        // Se uma data de conclusão específica foi fornecida, use ela
        if (body.data_conclusao) {
          updateFields.push('data_conclusao = ?');
          updateValues.push(body.data_conclusao);
        } else {
          updateFields.push('data_conclusao = NOW()');
        }
      } else {
        updateFields.push('data_conclusao = NULL');
      }
    } else if (body.data_conclusao !== undefined) {
      // Permitir atualizar apenas a data de conclusão sem alterar o status
      if (body.data_conclusao) {
        updateFields.push('data_conclusao = ?');
        updateValues.push(body.data_conclusao);
      } else {
        updateFields.push('data_conclusao = NULL');
      }
    }

    if (body.ordem !== undefined) {
      updateFields.push('ordem = ?');
      updateValues.push(body.ordem);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum campo para atualizar' },
        { status: 400 }
      );
    }

    updateValues.push(parseInt(todoId));

    await executeQuery({
      query: `
        UPDATE u711845530_gestao.atividades_todos 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `,
      values: updateValues
    });

    // Buscar o To Do atualizado
    const todoAtualizado = await executeQuery({
      query: `
        SELECT * FROM u711845530_gestao.atividades_todos 
        WHERE id = ?
      `,
      values: [parseInt(todoId)]
    }) as Todo[];

    // Atualizar timestamp da atividade pai
    if (todoAtualizado[0]) {
      await updateParentActivityTimestamp(todoAtualizado[0].atividade_id);
    }

    return NextResponse.json(todoAtualizado[0]);
  } catch (error) {
    console.error('❌ Erro ao atualizar To Do:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar um To Do específico
export async function DELETE(
  request: NextRequest
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const todoId = url.searchParams.get('todoId');
    
    if (!todoId) {
      return NextResponse.json(
        { error: 'ID do To Do é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar o ID da atividade antes de deletar
    const todoParaDeletar = await executeQuery({
      query: `
        SELECT atividade_id FROM u711845530_gestao.atividades_todos 
        WHERE id = ?
      `,
      values: [parseInt(todoId)]
    }) as { atividade_id: number }[];

    await executeQuery({
      query: `
        DELETE FROM u711845530_gestao.atividades_todos 
        WHERE id = ?
      `,
      values: [parseInt(todoId)]
    });

    // Atualizar timestamp da atividade pai
    if (todoParaDeletar[0]) {
      await updateParentActivityTimestamp(todoParaDeletar[0].atividade_id);
    }

    return NextResponse.json({ message: 'To Do deletado com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao deletar To Do:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
