import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔵 Buscando responsáveis...');
    
    const responsaveis = await executeQuery({
      query: 'SELECT email FROM u711845530_gestao.responsaveis ORDER BY email',
    });
    
    return NextResponse.json(responsaveis);
  } catch (error) {
    console.error('❌ Erro ao buscar responsáveis:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar responsáveis' },
      { status: 500 }
    );
  }
} 