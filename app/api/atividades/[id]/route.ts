import { executeQuery } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Certifique-se de que não há outras definições conflitantes de RouteContext
type RouteContext = {
  params: {
    id: string;
  };
};

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { status_id } = await request.json();
    
    await executeQuery({
      query: 'UPDATE u711845530_gestao.atividades SET status_id = ? WHERE id = ?',
      values: [status_id, context.params.id],
    });

    return NextResponse.json({ message: 'Status atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar status' },
      { status: 500 }
    );
  }
} 