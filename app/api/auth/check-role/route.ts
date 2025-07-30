import { NextRequest, NextResponse } from 'next/server';
import { executeQueryFuncionarios } from '@/lib/db';
import { Funcionario } from '@/lib/types';
import { isExceptionEmailChefia } from '@/lib/auth-config';

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email não fornecido' },
        { status: 400 }
      );
    }

    // Verificar se é email de exceção primeiro
    if (isExceptionEmailChefia(email)) {
      return NextResponse.json({ isChefe: true });
    }

    const result = await executeQueryFuncionarios<Funcionario[]>({
      query: 'SELECT * FROM vw_colaboradores_completos WHERE email = ? LIMIT 1',
      values: [email],
    });
    const userInfo = result[0] || null;
    
    if (!userInfo) {
      return NextResponse.json({ isChefe: false });
    }
    
    // Verificar se cargo contém "CHEFE"
    const isChefe = typeof userInfo.cargo === 'string' && userInfo.cargo.toUpperCase().includes('CHEFE');

    return NextResponse.json({ isChefe });
  } catch (error) {
    console.error('Erro ao verificar papel do usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 