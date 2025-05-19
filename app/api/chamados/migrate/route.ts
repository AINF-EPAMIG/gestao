import { NextRequest, NextResponse } from 'next/server';
import { dbAtendimento } from '@/lib/db';
import { RowDataPacket, OkPacket } from 'mysql2';

interface ChamadoRow extends RowDataPacket {
  id: number;
  status: string;
  position: number | null;
}

interface CriacaoAcessoRow extends RowDataPacket {
  id: number;
  status: string;
  position: number | null;
}

interface KanbanPositionRow extends RowDataPacket {
  id: number;
  tipo_item: 'chamado' | 'acesso';
  id_referencia: number;
  status: string;
  posicao: number | null;
}

export async function POST(request: NextRequest) {
  try {
    // Verificar se a chave de API foi fornecida
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get('key');
    
    // Chave de API simples para proteger a rota de migração
    if (apiKey !== process.env.MIGRATION_API_KEY) {
      return NextResponse.json({ error: 'Chave de API inválida' }, { status: 403 });
    }

    // 1. Buscar todos os chamados
    const [chamadosRows] = await dbAtendimento.query<ChamadoRow[]>(
      'SELECT id, status, position FROM chamados_atendimento'
    );
    
    // 2. Buscar todos os acessos
    const [acessosRows] = await dbAtendimento.query<CriacaoAcessoRow[]>(
      'SELECT id, status, position FROM criacao_acessos'
    );

    // 3. Buscar posições existentes para não duplicar
    const [kanbanPositionsRows] = await dbAtendimento.query<KanbanPositionRow[]>(
      'SELECT * FROM kanban_positions'
    );

    const chamados = Array.isArray(chamadosRows) ? chamadosRows : [];
    const acessos = Array.isArray(acessosRows) ? acessosRows : [];
    const kanbanPositions = Array.isArray(kanbanPositionsRows) ? kanbanPositionsRows : [];

    // Criar mapa de posições para verificação rápida
    const existingPositions = new Map<string, boolean>();
    kanbanPositions.forEach(pos => {
      const key = `${pos.tipo_item}-${pos.id_referencia}`;
      existingPositions.set(key, true);
    });

    // Estatísticas para retornar
    const stats = {
      chamadosMigrated: 0,
      acessosMigrated: 0,
      alreadyExisting: 0,
      errors: 0
    };

    // 4. Migrar chamados
    for (const chamado of chamados) {
      const key = `chamado-${chamado.id}`;
      
      // Pular se já existe
      if (existingPositions.has(key)) {
        stats.alreadyExisting++;
        continue;
      }
      
      try {
        await dbAtendimento.execute<OkPacket>(
          'INSERT INTO kanban_positions (tipo_item, id_referencia, status, posicao) VALUES (?, ?, ?, ?)',
          ['chamado', chamado.id, chamado.status || 'Em fila', chamado.position || 0]
        );
        stats.chamadosMigrated++;
      } catch (error) {
        console.error(`Erro ao migrar chamado ${chamado.id}:`, error);
        stats.errors++;
      }
    }

    // 5. Migrar acessos
    for (const acesso of acessos) {
      const key = `acesso-${acesso.id}`;
      
      // Pular se já existe
      if (existingPositions.has(key)) {
        stats.alreadyExisting++;
        continue;
      }
      
      try {
        await dbAtendimento.execute<OkPacket>(
          'INSERT INTO kanban_positions (tipo_item, id_referencia, status, posicao) VALUES (?, ?, ?, ?)',
          ['acesso', acesso.id, acesso.status || 'Em fila', acesso.position || 0]
        );
        stats.acessosMigrated++;
      } catch (error) {
        console.error(`Erro ao migrar acesso ${acesso.id}:`, error);
        stats.errors++;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migração concluída',
      stats
    });
  } catch (error) {
    console.error('Erro durante a migração:', error);
    return NextResponse.json(
      { error: 'Erro durante a migração', details: error },
      { status: 500 }
    );
  }
} 