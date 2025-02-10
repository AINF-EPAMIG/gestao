import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

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