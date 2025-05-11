import { NextRequest, NextResponse } from 'next/server';
import { executeQueryFuncionarios } from '@/lib/db';
import { Funcionario } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email não fornecido' },
        { status: 400 }
      );
    }

    const result = await executeQueryFuncionarios<Funcionario[]>({
      query: 'SELECT * FROM funcionarios WHERE email = ? LIMIT 1',
      values: [email],
    });
    const userInfo = result[0] || null;
    const isChefe = !!userInfo && typeof userInfo.chefia === 'string' && userInfo.chefia.trim() !== '';

    return NextResponse.json({ isChefe });
  } catch (error) {
    console.error('Erro ao verificar papel do usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 