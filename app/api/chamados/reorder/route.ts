import { NextRequest, NextResponse } from 'next/server';
import { dbAtendimento } from '@/lib/db';
import { RowDataPacket, OkPacket } from 'mysql2';

interface ChamadoRow extends RowDataPacket {
  id: number;
  tecnico_responsavel: string | null;
  [key: string]: unknown; // para outros campos que não precisamos tipar explicitamente
}

interface KanbanPositionRow extends RowDataPacket {
  id: number;
  tipo_item: 'chamado' | 'acesso';
  id_referencia: number;
  status: string;
  posicao: number | null;
}

export async function PUT(request: NextRequest) {
  const data = await request.json();
  const { chamadoId, newStatus, origem, userName, position } = data;

  try {
    // Converter chamadoId e position para números para garantir
    const chamadoIdNumber = parseInt(chamadoId, 10);
    const positionNumber = parseInt(position, 10);
    
    console.log(`[REORDER API] Recebido: chamadoId=${chamadoIdNumber}, newStatus=${newStatus}, origem=${origem}, position=${positionNumber}`);
    
    // O status vem como string representando o número da coluna, precisa ser convertido para o texto do ENUM
    const statusMap: Record<string, string> = {
      '1': 'Em fila',
      '2': 'Em atendimento',
      '3': 'Em aguardo',
      '4': 'Concluído',
    };
    
    const statusText = statusMap[newStatus] || 'Em fila';
    const table = origem === 'chamados_atendimento' ? 'chamados_atendimento' : 'criacao_acessos';
    const tipo_item = origem === 'chamados_atendimento' ? 'chamado' : 'acesso';

    // 1. Busca a posição atual do kanban ou cria se não existir
    const [kanbanPositions] = await dbAtendimento.execute<KanbanPositionRow[]>(
      'SELECT * FROM kanban_positions WHERE tipo_item = ? AND id_referencia = ?',
      [tipo_item, chamadoIdNumber]
    );

    const currentPosition = kanbanPositions.length > 0 ? kanbanPositions[0] : null;
    const oldStatus = currentPosition?.status;
    const oldPosition = currentPosition?.posicao;
    const isStatusChange = oldStatus !== statusText;
    const isPositionChange = oldPosition !== positionNumber;

    console.log(`[REORDER API] Estado atual: oldStatus=${oldStatus}, oldPosition=${oldPosition}`);
    console.log(`[REORDER API] Mudanças: isStatusChange=${isStatusChange}, isPositionChange=${isPositionChange}`);

    // 2. Primeiro, busca todos os itens no status de destino para calcular posições corretas
    const [itemsInDestStatus] = await dbAtendimento.execute<KanbanPositionRow[]>(
      `SELECT * FROM kanban_positions 
       WHERE tipo_item = ? AND status = ? 
       ORDER BY posicao, id`,
      [tipo_item, statusText]
    );

    // Se for mesmo status e mesma posição, não faz nada
    if (!isStatusChange && !isPositionChange) {
      console.log(`[REORDER API] Sem alterações necessárias, retornando early`);
      
      // Busca os dados da tabela original para resposta
      const [updatedItem] = await dbAtendimento.execute<ChamadoRow[]>(
        `SELECT * FROM ${table} WHERE id = ?`,
        [chamadoIdNumber]
      );
      
      return NextResponse.json({ 
        success: true, 
        data: {
          ...updatedItem[0],
          status: oldStatus,
          position: oldPosition,
          origem: origem
        } 
      });
    }

    if (currentPosition) {
      // Atualiza a posição existente
      await dbAtendimento.execute<OkPacket>(
        'UPDATE kanban_positions SET status = ?, posicao = ? WHERE id = ?',
        [statusText, positionNumber, currentPosition.id]
      );
      console.log(`[REORDER API] Atualizada posição existente: id=${currentPosition.id}, status=${statusText}, posicao=${positionNumber}`);
    } else {
      // Cria uma nova posição
      await dbAtendimento.execute<OkPacket>(
        'INSERT INTO kanban_positions (tipo_item, id_referencia, status, posicao) VALUES (?, ?, ?, ?)',
        [tipo_item, chamadoIdNumber, statusText, positionNumber]
      );
      console.log(`[REORDER API] Criada nova posição: tipo=${tipo_item}, id_ref=${chamadoIdNumber}, status=${statusText}, posicao=${positionNumber}`);
    }

    // 3. Se não tem responsável e temos o nome do usuário, atualizamos isso na tabela original
    if (userName) {
      const [chamadoRows] = await dbAtendimento.execute<ChamadoRow[]>(
        `SELECT * FROM ${table} WHERE id = ?`,
        [chamadoIdNumber]
      );

      if (chamadoRows.length > 0 && !chamadoRows[0].tecnico_responsavel) {
        await dbAtendimento.execute<OkPacket>(
          `UPDATE ${table} SET tecnico_responsavel = ? WHERE id = ?`,
          [userName, chamadoIdNumber]
        );
        console.log(`[REORDER API] Atribuído técnico responsável: ${userName}`);
      }
    }

    // 4. Se houve mudança de status, reordena as posições no status antigo
    if (isStatusChange && oldStatus) {
      // Primeiro, obter todos os itens no status antigo, excluindo o que foi movido
      const [itemsInOldStatus] = await dbAtendimento.execute<KanbanPositionRow[]>(
        `SELECT * FROM kanban_positions 
         WHERE tipo_item = ? AND status = ? AND NOT (tipo_item = ? AND id_referencia = ?)
         ORDER BY posicao, id`,
        [tipo_item, oldStatus, tipo_item, chamadoIdNumber]
      );
      
      // Atualizar as posições desses itens um por um (em vez de usar WITH)
      for (let i = 0; i < itemsInOldStatus.length; i++) {
        await dbAtendimento.execute<OkPacket>(
          `UPDATE kanban_positions SET posicao = ? WHERE id = ?`,
          [i + 1, itemsInOldStatus[i].id]  // Posições começam em 1
        );
      }
      
      console.log(`[REORDER API] Reordenadas ${itemsInOldStatus.length} posições no status antigo: ${oldStatus}`);
    }

    // 5. Reordena as posições no status de destino - separa movimentação entre status e dentro do mesmo status
    if (isStatusChange) {
      // Caso 1: Movimentação entre status diferentes
      // Obter todos os itens no status de destino (sem o item movido)
      const [itemsInDestStatus] = await dbAtendimento.execute<KanbanPositionRow[]>(
        `SELECT * FROM kanban_positions 
         WHERE tipo_item = ? AND status = ? AND NOT (tipo_item = ? AND id_referencia = ?)
         ORDER BY posicao, id`,
        [tipo_item, statusText, tipo_item, chamadoIdNumber]
      );
      
      // Preparar as novas posições
      const newPositions = [];
      
      // positionNumber é a posição onde o item será inserido (começando em 1)
      for (let i = 0; i < itemsInDestStatus.length + 1; i++) {
        if (i + 1 === positionNumber) {
          // Insere o item movido na posição desejada
          newPositions.push({
            id: currentPosition!.id,
            isMovedItem: true,
            newPosition: i + 1  // Posições começam em 1
          });
        }
        
        if (i < itemsInDestStatus.length) {
          // Insere os outros itens nas posições adequadas
          newPositions.push({
            id: itemsInDestStatus[i].id,
            isMovedItem: false,
            newPosition: (i + 1) < positionNumber ? (i + 1) : (i + 2)  // Posições começam em 1
          });
        }
      }
      
      // Se o item movido não foi inserido ainda (acontece quando positionNumber é maior que o tamanho da lista)
      if (!newPositions.some(p => p.isMovedItem)) {
        newPositions.push({
          id: currentPosition!.id,
          isMovedItem: true,
          newPosition: itemsInDestStatus.length + 1  // Coloca no final da lista
        });
      }

      console.log(`[REORDER API] Calculadas ${newPositions.length} novas posições para status ${statusText}:`);
      console.log(newPositions);

      // Aplica as novas posições uma a uma
      for (const item of newPositions) {
        await dbAtendimento.execute<OkPacket>(
          `UPDATE kanban_positions SET posicao = ? WHERE id = ?`,
          [item.newPosition, item.id]
        );
        console.log(`[REORDER API] Atualizada posição: id=${item.id}, posicao=${item.newPosition}`);
      }
      
    } else if (isPositionChange) {
      // Caso 2: Movimentação dentro do mesmo status (reordenação)
      // Remove o item movido da lista
      const itemsWithoutMoved = itemsInDestStatus.filter(item => 
        !(item.tipo_item === tipo_item && item.id_referencia === chamadoIdNumber)
      );

      // Prepara as novas posições
      const newPositions = [];
      
      // positionNumber é a posição onde o item será inserido (começando em 1)
      for (let i = 0; i < itemsWithoutMoved.length + 1; i++) {
        if (i + 1 === positionNumber) {
          // Insere o item movido na posição desejada
          newPositions.push({
            id: currentPosition!.id,
            newPosition: i + 1  // Posições começam em 1
          });
        }
        
        if (i < itemsWithoutMoved.length) {
          // Insere os outros itens nas posições adequadas
          newPositions.push({
            id: itemsWithoutMoved[i].id,
            newPosition: (i + 1) < positionNumber ? (i + 1) : (i + 2)  // Posições começam em 1
          });
        }
      }

      console.log(`[REORDER API] Calculadas ${newPositions.length} novas posições para reordenação:`);
      console.log(newPositions);

      // Aplica as novas posições uma a uma para evitar race conditions
      for (const item of newPositions) {
        await dbAtendimento.execute<OkPacket>(
          `UPDATE kanban_positions SET posicao = ? WHERE id = ?`,
          [item.newPosition, item.id]
        );
        console.log(`[REORDER API] Atualizada posição: id=${item.id}, posicao=${item.newPosition}`);
      }
    }

    // NOVO: Verificação adicional para garantir que não haja posições duplicadas
    await normalizarPosicoesNoBanco(statusText);
    if (isStatusChange && oldStatus) {
      await normalizarPosicoesNoBanco(oldStatus);
    }

    // 6. Se o status é "Concluído", atualiza a data_conclusao na tabela original
    if (statusText === 'Concluído') {
      await dbAtendimento.execute<OkPacket>(
        `UPDATE ${table} SET data_conclusao = NOW() WHERE id = ? AND data_conclusao IS NULL`,
        [chamadoIdNumber]
      );
      console.log(`[REORDER API] Chamado marcado como concluído, data_conclusao atualizada`);
    }
    
    // 7. Busca a posição atualizada para retornar
    const [updatedPosition] = await dbAtendimento.execute<KanbanPositionRow[]>(
      'SELECT * FROM kanban_positions WHERE tipo_item = ? AND id_referencia = ?',
      [tipo_item, chamadoIdNumber]
    );

    // 8. Busca os dados da tabela original para complementar a resposta
    const [updatedItem] = await dbAtendimento.execute<ChamadoRow[]>(
      `SELECT * FROM ${table} WHERE id = ?`,
      [chamadoIdNumber]
    );
    
    console.log(`[REORDER API] Concluído: status=${updatedPosition[0]?.status}, posicao=${updatedPosition[0]?.posicao}`);
    
    return NextResponse.json({ 
      success: true, 
      data: {
        ...updatedItem[0],
        status: updatedPosition[0]?.status,
        position: updatedPosition[0]?.posicao,
        origem: origem
      } 
    });
  } catch (error) {
    console.error('Erro ao atualizar status do chamado:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar status do chamado', details: error },
      { status: 500 }
    );
  }
}

// Função auxiliar para normalizar as posições no banco de dados
async function normalizarPosicoesNoBanco(status: string) {
  try {
    console.log(`[REORDER API] Normalizando posições no banco para status=${status}`);
    
    // 1. Busca TODOS os itens do status especificado, independente do tipo_item
    const [items] = await dbAtendimento.execute<KanbanPositionRow[]>(
      `SELECT * FROM kanban_positions 
       WHERE status = ? 
       ORDER BY posicao, id`,
      [status]
    );
    
    // Verifica se há posições duplicadas
    const posicoes = items.map(item => item.posicao);
    const temDuplicadas = posicoes.some((pos, index) => posicoes.indexOf(pos) !== index);
    
    if (!temDuplicadas && items.every((item, idx) => item.posicao === idx + 1)) {
      console.log(`[REORDER API] Posições já estão normalizadas para status=${status}`);
      return;
    }
    
    console.log(`[REORDER API] Detectada necessidade de normalização para status=${status}`);
    
    // 2. Atualiza as posições uma por uma em ordem crescente
    for (let i = 0; i < items.length; i++) {
      const novaPos = i + 1; // Posições começam em 1
      if (items[i].posicao !== novaPos) {
        await dbAtendimento.execute<OkPacket>(
          `UPDATE kanban_positions SET posicao = ? WHERE id = ?`,
          [novaPos, items[i].id]
        );
        console.log(`[REORDER API] Normalizada posição: id=${items[i].id}, tipo=${items[i].tipo_item}, ref=${items[i].id_referencia}, posicao=${novaPos}`);
      }
    }
    
    console.log(`[REORDER API] Normalização completa: ${items.length} itens ajustados.`);
  } catch (error) {
    console.error('Erro ao normalizar posições:', error);
  }
} 