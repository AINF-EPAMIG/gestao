import { executeQuery } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');
    console.log(`API Avatar: Buscando avatar para email: ${email}`);

    if (!email) {
      console.log('API Avatar: Email não fornecido');
      return NextResponse.json(
        { error: 'Email não fornecido' },
        { status: 400 }
      );
    }

    // Garantir que o email tenha o domínio @epamig.br
    const emailFormatado = email.includes('@') ? email : `${email}@epamig.br`;
    console.log(`API Avatar: Email formatado: ${emailFormatado}`);
    
    console.log(`API Avatar: Consultando banco para email: ${emailFormatado}`);
    const result = await executeQuery({
      query: 'SELECT image_url FROM u711845530_gestao.responsaveis WHERE email = ?',
      values: [emailFormatado]
    }) as { image_url: string | null }[];

    console.log(`API Avatar: Resultado para ${emailFormatado}:`, result);

    if (!result.length) {
      console.log(`API Avatar: Usuário não encontrado para email: ${emailFormatado}`);
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    console.log(`API Avatar: URL encontrada para ${emailFormatado}:`, result[0].image_url);
    return NextResponse.json({ image_url: result[0].image_url });
  } catch (error) {
    console.error('Erro ao buscar avatar:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar avatar' },
      { status: 500 }
    );
  }
} 