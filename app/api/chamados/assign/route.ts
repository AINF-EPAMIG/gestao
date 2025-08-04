import { NextRequest, NextResponse } from 'next/server';
import { dbAtendimento } from '@/lib/db';
import { OkPacket, RowDataPacket } from 'mysql2';

interface ChamadoRow extends RowDataPacket {
  tecnicos_responsaveis?: string | null;
}

interface ColumnInfo extends RowDataPacket {
  Field: string;
  Type: string;
  Null: string;
  Key: string;
  Default: string | null;
  Extra: string;
}

export async function PUT(request: NextRequest) {
  const data = await request.json();
  const { chamadoId, origem, userName, emailsResponsaveis } = data;

  try {
    // Converter chamadoId para número para garantir
    const chamadoIdNumber = parseInt(chamadoId, 10);
    const table = origem === 'chamados_atendimento' ? 'chamados_atendimento' : 'criacao_acessos';
    
    if (userName === null) {
      console.log(`[ASSIGN API] Removendo técnico(s) responsável(is) do chamado ${chamadoIdNumber} (origem: ${origem})`);
    } else {
      if (emailsResponsaveis) {
        const totalResponsaveis = emailsResponsaveis.split(',').length;
        console.log(`[ASSIGN API] Atribuindo ${totalResponsaveis} técnico(s) ao chamado ${chamadoIdNumber} (origem: ${origem}): ${emailsResponsaveis}`);
      } else {
        console.log(`[ASSIGN API] Atribuindo técnico ${userName} ao chamado ${chamadoIdNumber} (origem: ${origem})`);
      }
    }

    // Verificar se a coluna tecnicos_responsaveis existe na tabela
    const [columnsResult] = await dbAtendimento.execute<ColumnInfo[]>(
      `DESCRIBE ${table}`
    );
    
    const columns = columnsResult.map(col => col.Field);
    const hasTecnicosResponsaveis = columns.includes('tecnicos_responsaveis');
    
    console.log(`[ASSIGN API] Colunas disponíveis em ${table}:`, columns);
    console.log(`[ASSIGN API] tecnicos_responsaveis existe: ${hasTecnicosResponsaveis}`);

    // Se não tiver a coluna tecnicos_responsaveis, criar ela
    if (!hasTecnicosResponsaveis) {
      console.log(`[ASSIGN API] Criando coluna tecnicos_responsaveis na tabela ${table}`);
      await dbAtendimento.execute(
        `ALTER TABLE ${table} ADD COLUMN tecnicos_responsaveis VARCHAR(500) NULL`
      );
      console.log(`[ASSIGN API] Coluna tecnicos_responsaveis criada com sucesso`);
    }

    // Verificar o técnico responsável atual
    try {
      const [rows] = await dbAtendimento.execute<ChamadoRow[]>(
        `SELECT tecnicos_responsaveis FROM ${table} WHERE id = ?`,
        [chamadoIdNumber]
      );

      // Se já tiver técnicos responsáveis, registra a mudança
      if (rows && Array.isArray(rows) && rows.length > 0) {
        const row = rows[0];
        const currentResponsaveis = row.tecnicos_responsaveis || '';
        
        if (currentResponsaveis) {
          if (userName === null) {
            console.log(`[ASSIGN API] Removendo técnicos responsáveis: ${currentResponsaveis}`);
          } else {
            console.log(`[ASSIGN API] Alterando técnicos responsáveis de "${currentResponsaveis}" para "${emailsResponsaveis || userName}"`);
          }
        }
      }
    } catch (selectError) {
      console.log(`[ASSIGN API] Erro ao verificar responsáveis atuais (ignorando):`, selectError);
    }

    // Atribui ou remove os técnicos responsáveis
    if (userName === null) {
      // Remover todos os responsáveis
      await dbAtendimento.execute<OkPacket>(
        `UPDATE ${table} SET tecnicos_responsaveis = NULL WHERE id = ?`,
        [chamadoIdNumber]
      );
    } else {
      // Atribuir responsáveis
      const responsaveisValue = emailsResponsaveis || userName;
      await dbAtendimento.execute<OkPacket>(
        `UPDATE ${table} SET tecnicos_responsaveis = ? WHERE id = ?`,
        [responsaveisValue, chamadoIdNumber]
      );
    }
    
    if (userName === null) {
      console.log(`[ASSIGN API] Técnico(s) responsável(is) removido(s) com sucesso do chamado ${chamadoIdNumber}`);
    } else {
      if (emailsResponsaveis) {
        const totalResponsaveis = emailsResponsaveis.split(',').length;
        console.log(`[ASSIGN API] ${totalResponsaveis} técnico(s) atribuído(s) com sucesso ao chamado ${chamadoIdNumber}`);
      } else {
        console.log(`[ASSIGN API] Técnico ${userName} atribuído com sucesso ao chamado ${chamadoIdNumber}`);
      }
    }

    const successMessage = userName === null 
      ? 'Técnico(s) responsável(is) removido(s) com sucesso' 
      : emailsResponsaveis 
        ? `${emailsResponsaveis.split(',').length} técnico(s) responsável(is) atualizado(s) com sucesso`
        : 'Técnico responsável atualizado com sucesso';

    return NextResponse.json({ 
      success: true, 
      message: successMessage
    });
    
  } catch (error) {
    console.error('Erro ao atualizar técnico responsável:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar técnico responsável', details: error },
      { status: 500 }
    );
  }
} 