import { executeQuery } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    const { taskId } = await request.json();
    
    // Atualiza a data de última atualização da tarefa com ajuste de -3h
    await executeQuery({
      query: `
        UPDATE u711845530_gestao.atividades 
        SET ultima_atualizacao = DATE_SUB(NOW(), INTERVAL 3 HOUR)
        WHERE id = ?
      `,
      values: [taskId],
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Erro ao atualizar timestamp da tarefa:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar timestamp da tarefa' },
      { status: 500 }
    );
  }
} 