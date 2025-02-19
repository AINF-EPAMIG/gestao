import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const setores = await executeQuery({
      query: 'SELECT * FROM u711845530_gestao.setor ORDER BY sigla',
    });
    
    return NextResponse.json(setores);
  } catch (error) {
    console.error('Erro ao buscar setores:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar setores' },
      { status: 500 }
    );
  }
} 