import { NextResponse } from 'next/server';
import { dbAtendimento, executeQueryAtendimento } from '@/lib/db';
import { RowDataPacket, OkPacket } from 'mysql2';

interface KanbanPositionRow extends RowDataPacket {
  id: number;
  tipo_item: 'chamado' | 'acesso';
  id_referencia: number;
  status: string;
  posicao: number | null;
}

export async function GET() {
  try {
    console.log('[NORMALIZE API] Iniciando normalização de todas as posições');
    
    // 1. Buscar todos os status únicos no banco
    const [statusRows] = await dbAtendimento.execute<RowDataPacket[]>(
      `SELECT DISTINCT status FROM kanban_positions`
    );
    
    const statusList = statusRows.map(row => row.status);
    console.log(`[NORMALIZE API] Status encontrados: ${statusList.join(', ')}`);
    
    let totalCorrecoes = 0;
    
    // 2. Para cada status, normalizar as posições
    for (const status of statusList) {
      const correcoes = await normalizarPosicoesDoStatus(status);
      totalCorrecoes += correcoes;
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Normalização concluída. ${totalCorrecoes} posições foram corrigidas.`,
      statusProcessados: statusList.length
    });
  } catch (error) {
    console.error('[NORMALIZE API] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao normalizar posições', details: error },
      { status: 500 }
    );
  }
}

// Função auxiliar para normalizar as posições de um status específico
async function normalizarPosicoesDoStatus(status: string): Promise<number> {
  try {
    console.log(`[NORMALIZE API] Normalizando posições para status=${status}`);
    
    // 1. Busca todos os itens do status, ordenados por posição e id
    const [items] = await dbAtendimento.execute<KanbanPositionRow[]>(
      `SELECT * FROM kanban_positions 
       WHERE status = ? 
       ORDER BY posicao, id`,
      [status]
    );
    
    // Verifica se há posições duplicadas ou não sequenciais
    const posicoes = items.map(item => item.posicao);
    const temDuplicadas = posicoes.some((pos, index) => 
      pos !== null && posicoes.indexOf(pos) !== index
    );
    
    const temNaoSequenciais = items.some((item, idx) => 
      item.posicao !== idx + 1
    );
    
    if (!temDuplicadas && !temNaoSequenciais) {
      console.log(`[NORMALIZE API] Posições já estão normalizadas para status=${status}`);
      return 0;
    }
    
    console.log(`[NORMALIZE API] Corrigindo posições para status=${status}`);
    
    // 2. Atualiza as posições uma por uma em ordem crescente
    let correcoes = 0;
    for (let i = 0; i < items.length; i++) {
      const novaPos = i + 1; // Posições começam em 1
      if (items[i].posicao !== novaPos) {
        await dbAtendimento.execute<OkPacket>(
          `UPDATE kanban_positions SET posicao = ? WHERE id = ?`,
          [novaPos, items[i].id]
        );
        console.log(`[NORMALIZE API] Normalizada posição: id=${items[i].id}, tipo=${items[i].tipo_item}, ref=${items[i].id_referencia}, posicao=${novaPos}`);
        correcoes++;
      }
    }
    
    console.log(`[NORMALIZE API] ${correcoes} posições corrigidas para status=${status}`);
    return correcoes;
  } catch (error) {
    console.error(`[NORMALIZE API] Erro ao normalizar posições para status=${status}:`, error);
    return 0;
  }
} 

export async function POST() {
  try {
    // Buscar todos os status únicos
        const statusResult = await executeQueryAtendimento<{ status: number }[]>({
      query: `
        SELECT DISTINCT status
        FROM kanban_positions 
        WHERE status IN (1, 2, 3, 4)
        ORDER BY status
      `
    });

    const statusList = statusResult.map((row) => row.status);

    let totalCorrecoes = 0;

    // Para cada status, normalizar as posições
    for (const status of statusList) {
      // Buscar todos os itens para este status
      const items = await executeQueryAtendimento<KanbanPositionRow[]>({
        query: `
          SELECT id, tipo_item, id_referencia, posicao
          FROM kanban_positions
          WHERE status = ?
          ORDER BY posicao
        `,
        values: [status]
      });

      if (items.length === 0) continue;

      // Verificar se as posições já estão normalizadas
      let precisaNormalizar = false;
      for (let i = 0; i < items.length; i++) {
        if (items[i].posicao !== i + 1) {
          precisaNormalizar = true;
          break;
        }
      }

      if (!precisaNormalizar) continue;

      // Normalizar posições
      let correcoes = 0;
      for (let i = 0; i < items.length; i++) {
        const novaPos = i + 1;
        if (items[i].posicao !== novaPos) {
          await executeQueryAtendimento({
            query: `
              UPDATE kanban_positions
              SET posicao = ?
              WHERE id = ?
            `,
            values: [novaPos, items[i].id]
          });
          correcoes++;
        }
      }

      totalCorrecoes += correcoes;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Normalização concluída. ${totalCorrecoes} posições corrigidas.` 
    });
  } catch (error) {
    console.error('Erro ao normalizar posições:', error);
    return NextResponse.json(
      { error: 'Erro ao normalizar posições' },
      { status: 500 }
    );
  }
} 