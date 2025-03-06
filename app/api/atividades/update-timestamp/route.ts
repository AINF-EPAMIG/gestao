import { executeQuery } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    const { taskId, ultima_atualizacao } = await request.json();

    console.log('🔵 Atualizando timestamp da tarefa...');
    
    // Atualiza a data de última atualização da tarefa
    await executeQuery({
      query: `
        UPDATE u711845530_gestao.atividades 
        SET ultima_atualizacao = ?
        WHERE id = ?
      `,
      values: [ultima_atualizacao, taskId],
    });
    
    console.log('✅ Timestamp atualizado com sucesso');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Erro ao atualizar timestamp da tarefa:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar timestamp da tarefa' },
      { status: 500 }
    );
  }
} 