import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔵 Buscando sistemas...');
    
    const sistemas = await executeQuery({
      query: 'SELECT * FROM u711845530_gestao.sistemas ORDER BY nome',
    });
    
    return NextResponse.json(sistemas);
  } catch (error) {
    console.error('❌ Erro ao buscar sistemas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar sistemas' },
      { status: 500 }
    );
  }
} 