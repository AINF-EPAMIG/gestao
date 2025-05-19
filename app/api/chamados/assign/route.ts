import { NextRequest, NextResponse } from 'next/server';
import { dbAtendimento } from '@/lib/db';
import { OkPacket } from 'mysql2';

interface ChamadoRow {
  tecnico_responsavel: string | null;
}

export async function PUT(request: NextRequest) {
  const data = await request.json();
  const { chamadoId, origem, userName } = data;

  try {
    // Converter chamadoId para número para garantir
    const chamadoIdNumber = parseInt(chamadoId, 10);
    const table = origem === 'chamados_atendimento' ? 'chamados_atendimento' : 'criacao_acessos';
    
    if (userName === null) {
      console.log(`[ASSIGN API] Removendo técnico responsável do chamado ${chamadoIdNumber} (origem: ${origem})`);
    } else {
      console.log(`[ASSIGN API] Atribuindo técnico ${userName} ao chamado ${chamadoIdNumber} (origem: ${origem})`);
    }

    // Verifica o técnico responsável atual
    const [rows] = await dbAtendimento.execute(
      `SELECT tecnico_responsavel FROM ${table} WHERE id = ?`,
      [chamadoIdNumber]
    );

    // Se já tiver um técnico responsável, registra a mudança
    if (rows && Array.isArray(rows) && rows.length > 0) {
      const row = rows[0] as ChamadoRow;
      if (row.tecnico_responsavel) {
        if (userName === null) {
          console.log(`[ASSIGN API] Removendo técnico responsável: ${row.tecnico_responsavel}`);
        } else {
          console.log(`[ASSIGN API] Alterando técnico responsável de ${row.tecnico_responsavel} para ${userName}`);
        }
      }
    }

    // Atribui ou remove o técnico responsável
    await dbAtendimento.execute<OkPacket>(
      `UPDATE ${table} SET tecnico_responsavel = ? WHERE id = ?`,
      [userName, chamadoIdNumber]
    );
    
    if (userName === null) {
      console.log(`[ASSIGN API] Técnico responsável removido com sucesso do chamado ${chamadoIdNumber}`);
    } else {
      console.log(`[ASSIGN API] Técnico ${userName} atribuído com sucesso ao chamado ${chamadoIdNumber}`);
    }

    return NextResponse.json({ 
      success: true, 
      message: userName === null ? 'Técnico responsável removido com sucesso' : 'Técnico responsável atualizado com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao atualizar técnico responsável:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar técnico responsável', details: error },
      { status: 500 }
    );
  }
} 