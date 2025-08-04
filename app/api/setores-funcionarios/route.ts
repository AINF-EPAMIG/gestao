import { NextResponse } from 'next/server';
import { executeQueryFuncionarios } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { verificarPermissao } from '@/lib/auth-config';
import { Funcionario } from '@/lib/types';

interface SetorInfo {
  sigla: string;
  nome: string;
  tipo: 'departamento' | 'divisao' | 'assessoria' | 'secao';
  count: number;
}

async function getUserInfo(email: string) {
  const result = await executeQueryFuncionarios<Funcionario[]>({
    query: 'SELECT * FROM vw_colaboradores_completos WHERE email = ? LIMIT 1',
    values: [email],
  });
  return result[0] || null;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const userInfo = await getUserInfo(session.user.email);
    if (!userInfo) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const canViewAllSectors = verificarPermissao(userInfo, 'visualizar_todos_setores');

    if (!canViewAllSectors) {
      // Se não pode ver todos os setores, retorna apenas o setor do usuário
      const userSetor = userInfo.departamento || userInfo.divisao || userInfo.assessoria || userInfo.secao;
      if (!userSetor) {
        return NextResponse.json([]);
      }

      return NextResponse.json([{
        sigla: userSetor,
        nome: userSetor,
        tipo: userInfo.departamento ? 'departamento' : 
              userInfo.divisao ? 'divisao' : 
              userInfo.assessoria ? 'assessoria' : 'secao',
        count: 1
      }]);
    }

    // Se pode ver todos os setores, busca todos os setores únicos da view
    const setores = await executeQueryFuncionarios<{setor: string, tipo: string, count: number}[]>({
      query: `
        SELECT 
          departamento as setor, 'departamento' as tipo, COUNT(*) as count
        FROM vw_colaboradores_completos 
        WHERE departamento IS NOT NULL AND departamento != ''
        GROUP BY departamento
        
        UNION ALL
        
        SELECT 
          divisao as setor, 'divisao' as tipo, COUNT(*) as count
        FROM vw_colaboradores_completos 
        WHERE divisao IS NOT NULL AND divisao != '' 
          AND (departamento IS NULL OR departamento = '')
        GROUP BY divisao
        
        UNION ALL
        
        SELECT 
          assessoria as setor, 'assessoria' as tipo, COUNT(*) as count
        FROM vw_colaboradores_completos 
        WHERE assessoria IS NOT NULL AND assessoria != ''
          AND (departamento IS NULL OR departamento = '')
          AND (divisao IS NULL OR divisao = '')
        GROUP BY assessoria
        
        ORDER BY setor
      `,
      values: [],
    });

    const setoresFormatados: SetorInfo[] = setores.map(setor => ({
      sigla: setor.setor,
      nome: setor.setor,
      tipo: setor.tipo as 'departamento' | 'divisao' | 'assessoria' | 'secao',
      count: setor.count
    }));

    return NextResponse.json(setoresFormatados);
  } catch (error) {
    console.error('Erro ao buscar setores dos funcionários:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar setores' },
      { status: 500 }
    );
  }
}