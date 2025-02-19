import { NextRequest, NextResponse } from 'next/server';
import { getUserInfoFromRM, isUserChefe } from '@/lib/rm-service';

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email não fornecido' },
        { status: 400 }
      );
    }

    const userInfo = await getUserInfoFromRM(email);
    const isChefe = isUserChefe(userInfo);

    return NextResponse.json({ isChefe });
  } catch (error) {
    console.error('Erro ao verificar papel do usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar papel do usuário' },
      { status: 500 }
    );
  }
} 