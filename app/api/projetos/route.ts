import { executeQuery } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const projetos = await executeQuery({
      query: 'SELECT * FROM u711845530_gestao.projetos ORDER BY nome',
    });
    
    return NextResponse.json(projetos);
  } catch (error) {
    console.error('Erro ao buscar projetos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar projetos' },
      { status: 500 }
    );
  }
}

interface QueryResult {
  insertId: number;
}

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export async function POST(request: NextRequest) {
  try {
    const { nome } = await request.json();
    const nomeCapitalizado = capitalizeFirstLetter(nome);
    
    const result = await executeQuery({
      query: 'INSERT INTO u711845530_gestao.projetos (nome) VALUES (?)',
      values: [nomeCapitalizado],
    }) as QueryResult;

    const novoProjeto = {
      id: result.insertId,
      nome: nomeCapitalizado
    };
    
    return NextResponse.json(novoProjeto);
  } catch (error) {
    console.error('Erro ao criar projeto:', error);
    return NextResponse.json(
      { error: 'Erro ao criar projeto' },
      { status: 500 }
    );
  }
} 