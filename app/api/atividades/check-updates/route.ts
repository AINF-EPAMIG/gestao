import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const atividades = await executeQuery({
      query: `
        SELECT a.*, r.email as responsavel_email, s.nome as sistema_nome
        FROM u711845530_gestao.atividades a
        LEFT JOIN u711845530_gestao.responsaveis r ON a.responsavel_id = r.id
        LEFT JOIN u711845530_gestao.sistemas s ON a.sistema_id = s.id
        ORDER BY a.status_id, a.position
      `,
    });
    
    return NextResponse.json(atividades);
  } catch (error) {
    console.error('❌ Erro ao verificar atualizações:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar atualizações' },
      { status: 500 }
    );
  }
} 