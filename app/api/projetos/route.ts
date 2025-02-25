import { executeQuery } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const includeTaskCount = url.searchParams.get('includeTaskCount') === 'true';

    const query = includeTaskCount
      ? `
        SELECT 
          p.*,
          COUNT(a.id) as taskCount
        FROM u711845530_gestao.projetos p
        LEFT JOIN u711845530_gestao.atividades a ON p.id = a.projeto_id
        GROUP BY p.id, p.nome
        ORDER BY p.nome
      `
      : 'SELECT * FROM u711845530_gestao.projetos ORDER BY nome';

    const projetos = await executeQuery({ query });
    
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