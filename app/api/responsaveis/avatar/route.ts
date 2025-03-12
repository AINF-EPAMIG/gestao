import { executeQuery } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email não fornecido' },
        { status: 400 }
      );
    }

    const result = await executeQuery({
      query: 'SELECT image_url FROM u711845530_gestao.responsaveis WHERE email = ?',
      values: [email]
    }) as { image_url: string | null }[];

    if (!result.length) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ image_url: result[0].image_url });
  } catch (error) {
    console.error('Erro ao buscar avatar:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar avatar' },
      { status: 500 }
    );
  }
} 