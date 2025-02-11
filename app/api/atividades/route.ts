import { executeQuery } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔵 Iniciando consulta ao banco de dados...');
    
    const atividades = await executeQuery({
      query: 'SELECT * FROM u711845530_gestao.atividades',
    });
    
    console.log('✅ Dados recuperados com sucesso:');
    console.log(JSON.stringify(atividades, null, 2));
    console.log(`📊 Total de registros: ${Array.isArray(atividades) ? atividades.length : 0}`);
    
    return NextResponse.json(atividades);
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
    const { id, status_id } = data;

    console.log('🔵 Atualizando status da atividade...');
    
    await executeQuery({
      query: 'UPDATE u711845530_gestao.atividades SET status_id = ? WHERE id = ?',
      values: [status_id, id],
    });
    
    console.log('✅ Status atualizado com sucesso');
    
    // Buscar dados atualizados
    const atividades = await executeQuery({
      query: 'SELECT * FROM u711845530_gestao.atividades',
    });
    
    return NextResponse.json(atividades);
  } catch (error) {
    console.error('❌ Erro ao atualizar status:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar status' },
      { status: 500 }
    );
  }
} 