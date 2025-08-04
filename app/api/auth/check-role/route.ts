import { NextRequest, NextResponse } from 'next/server';
import { executeQueryFuncionarios } from '@/lib/db';
import { Funcionario, NivelHierarquico } from '@/lib/types';
import { 
  determinarNivelHierarquico, 
  calcularPermissoes
} from '@/lib/auth-config';

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');
    const acao = request.nextUrl.searchParams.get('acao');

    if (!email) {
      return NextResponse.json(
        { error: 'Email não fornecido' },
        { status: 400 }
      );
    }

    const result = await executeQueryFuncionarios<Funcionario[]>({
      query: 'SELECT * FROM vw_colaboradores_completos WHERE email = ? LIMIT 1',
      values: [email],
    });
    const userInfo = result[0] || null;
    
    if (!userInfo) {
      return NextResponse.json({ 
        isChefe: false,
        nivel: NivelHierarquico.COLABORADOR,
        permissoes: null,
        error: 'Usuário não encontrado'
      });
    }
    
    const nivel = determinarNivelHierarquico(userInfo);
    const permissoes = calcularPermissoes(userInfo);
    
    // Determinar se é chefe (mantido para compatibilidade)
    const isChefe = nivel === NivelHierarquico.CHEFE || 
                   nivel === NivelHierarquico.PRESIDENTE || 
                   nivel === NivelHierarquico.DIRETORIA;

    // Resposta específica baseada na ação solicitada
    switch (acao) {
      case 'nivel':
        return NextResponse.json({ nivel });
      case 'permissoes':
        return NextResponse.json({ permissoes });
      case 'completo':
        return NextResponse.json({ 
          isChefe, 
          nivel, 
          permissoes,
          setor: userInfo.departamento || userInfo.divisao || userInfo.assessoria || userInfo.secao
        });
      default:
        // Resposta padrão (compatibilidade)
        return NextResponse.json({ isChefe });
    }
  } catch (error) {
    console.error('Erro ao verificar papel do usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 