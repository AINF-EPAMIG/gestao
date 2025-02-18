import { executeQuery } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Buscar atividades e responsáveis em uma única consulta
    const atividades = await executeQuery({
      query: `
        SELECT a.*, r.email as responsavel_email, p.nome as projeto_nome
        FROM u711845530_gestao.atividades a
        LEFT JOIN u711845530_gestao.responsaveis r ON a.responsavel_id = r.id
        LEFT JOIN u711845530_gestao.projetos p ON a.projeto_id = p.id
      `,
    });
    
    // Adiciona headers para prevenir cache
    return new NextResponse(JSON.stringify(atividades), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('❌ Erro ao consultar o banco:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar atividades' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, status_id, position } = data;

    console.log('🔵 Atualizando tarefa...');
    
    await executeQuery({
      query: 'UPDATE u711845530_gestao.atividades SET status_id = ?, position = ? WHERE id = ?',
      values: [status_id, position, id],
    });
    
    console.log('✅ Tarefa atualizada com sucesso');
    
    // Buscar dados atualizados
    const atividades = await executeQuery({
      query: `
        SELECT a.*, r.email as responsavel_email, p.nome as projeto_nome
        FROM u711845530_gestao.atividades a
        LEFT JOIN u711845530_gestao.responsaveis r ON a.responsavel_id = r.id
        LEFT JOIN u711845530_gestao.projetos p ON a.projeto_id = p.id
        ORDER BY a.status_id, a.position
      `,
    });
    
    return NextResponse.json(atividades);
  } catch (error) {
    console.error('❌ Erro ao atualizar tarefa:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar tarefa' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { titulo, descricao, data_inicio, status_id, prioridade_id, projeto_id, responsavel_email, data_fim, estimativa_horas } = data;

    await executeQuery({
      query: `
        INSERT INTO u711845530_gestao.atividades 
        (titulo, descricao, projeto_id, responsavel_id, data_inicio, data_fim, 
         status_id, prioridade_id, estimativa_horas) 
        VALUES (?, ?, ?, 
          (SELECT id FROM u711845530_gestao.responsaveis WHERE email = ?), 
          ?, ?, ?, ?, ?)
      `,
      values: [
        titulo, 
        descricao, 
        projeto_id,
        responsavel_email,
        data_inicio,
        data_fim,
        status_id,
        prioridade_id,
        estimativa_horas
      ],
    });
    
    // Buscar dados atualizados
    const atividades = await executeQuery({
      query: `
        SELECT a.*, r.email as responsavel_email, p.nome as projeto_nome
        FROM u711845530_gestao.atividades a
        LEFT JOIN u711845530_gestao.responsaveis r ON a.responsavel_id = r.id
        LEFT JOIN u711845530_gestao.projetos p ON a.projeto_id = p.id
      `,
    });
    
    return NextResponse.json(atividades);
  } catch (error) {
    console.error('Erro ao criar atividade:', error);
    return NextResponse.json(
      { error: 'Erro ao criar atividade' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Extrair o ID da URL
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID não fornecido' },
        { status: 400 }
      );
    }
    
    console.log('🔵 Excluindo atividade...');
    
    await executeQuery({
      query: 'DELETE FROM u711845530_gestao.atividades WHERE id = ?',
      values: [id],
    });
    
    console.log('✅ Atividade excluída com sucesso');
    
    // Buscar dados atualizados
    const atividades = await executeQuery({
      query: `
        SELECT a.*, r.email as responsavel_email, p.nome as projeto_nome
        FROM u711845530_gestao.atividades a
        LEFT JOIN u711845530_gestao.responsaveis r ON a.responsavel_id = r.id
        LEFT JOIN u711845530_gestao.projetos p ON a.projeto_id = p.id
      `,
    });
    
    return NextResponse.json(atividades);
  } catch (error) {
    console.error('❌ Erro ao excluir atividade:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir atividade' },
      { status: 500 }
    );
  }
} 