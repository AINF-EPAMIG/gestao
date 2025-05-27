import { NextRequest, NextResponse } from 'next/server';
import { dbAtendimento } from '@/lib/db';
import { OkPacket, RowDataPacket } from 'mysql2';

interface ChamadoRow extends RowDataPacket {
  tecnico_responsavel?: string | null;
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

    // Verificar quais colunas existem na tabela
    const [columnsResult] = await dbAtendimento.execute<ColumnInfo[]>(
      `DESCRIBE ${table}`
    );
    
    const columns = columnsResult.map(col => col.Field);
    const hasTecnicoResponsavel = columns.includes('tecnico_responsavel');
    const hasTecnicosResponsaveis = columns.includes('tecnicos_responsaveis');
    
    console.log(`[ASSIGN API] Colunas disponíveis em ${table}:`, columns);
    console.log(`[ASSIGN API] tecnico_responsavel existe: ${hasTecnicoResponsavel}`);
    console.log(`[ASSIGN API] tecnicos_responsaveis existe: ${hasTecnicosResponsaveis}`);

    // Se não tiver nenhuma das colunas, criar a coluna tecnico_responsavel
    if (!hasTecnicoResponsavel && !hasTecnicosResponsaveis) {
      console.log(`[ASSIGN API] Criando coluna tecnico_responsavel na tabela ${table}`);
      await dbAtendimento.execute(
        `ALTER TABLE ${table} ADD COLUMN tecnico_responsavel VARCHAR(100) NULL`
      );
      console.log(`[ASSIGN API] Coluna tecnico_responsavel criada com sucesso`);
    }

    // Verificar o técnico responsável atual (se a coluna existir)
    if (hasTecnicoResponsavel || !hasTecnicosResponsaveis) {
      try {
        const selectColumn = hasTecnicoResponsavel ? 'tecnico_responsavel' : 'tecnicos_responsaveis';
        const [rows] = await dbAtendimento.execute<ChamadoRow[]>(
          `SELECT ${selectColumn} FROM ${table} WHERE id = ?`,
          [chamadoIdNumber]
        );

        // Se já tiver um técnico responsável, registra a mudança
        if (rows && Array.isArray(rows) && rows.length > 0) {
          const row = rows[0];
          const currentResponsavel = hasTecnicoResponsavel ? row.tecnico_responsavel : row.tecnicos_responsaveis;
          
          if (currentResponsavel) {
            if (userName === null) {
              console.log(`[ASSIGN API] Removendo técnico responsável: ${currentResponsavel}`);
            } else {
              console.log(`[ASSIGN API] Alterando técnico responsável de ${currentResponsavel} para ${userName}`);
            }
          }
        }
      } catch (selectError) {
        console.log(`[ASSIGN API] Erro ao verificar responsável atual (ignorando):`, selectError);
      }
    }

    // Atribui ou remove o técnico responsável
    if (userName === null) {
      // Remover todos os responsáveis
      if (hasTecnicoResponsavel) {
        await dbAtendimento.execute<OkPacket>(
          `UPDATE ${table} SET tecnico_responsavel = NULL WHERE id = ?`,
          [chamadoIdNumber]
        );
      }
      if (hasTecnicosResponsaveis) {
        await dbAtendimento.execute<OkPacket>(
          `UPDATE ${table} SET tecnicos_responsaveis = NULL WHERE id = ?`,
          [chamadoIdNumber]
        );
      }
    } else {
      // Atribuir responsáveis
      if (emailsResponsaveis) {
        // Múltiplos responsáveis
        if (hasTecnicosResponsaveis) {
          await dbAtendimento.execute<OkPacket>(
            `UPDATE ${table} SET tecnicos_responsaveis = ? WHERE id = ?`,
            [emailsResponsaveis, chamadoIdNumber]
          );
        }
        if (hasTecnicoResponsavel) {
          // Manter compatibilidade - primeiro responsável
          const primeiroEmail = emailsResponsaveis.split(',')[0].trim();
          const primeiroUserName = primeiroEmail.includes('@') ? primeiroEmail.split('@')[0] : primeiroEmail;
          await dbAtendimento.execute<OkPacket>(
            `UPDATE ${table} SET tecnico_responsavel = ? WHERE id = ?`,
            [primeiroUserName, chamadoIdNumber]
          );
        }
      } else {
        // Responsável único (compatibilidade)
        const updateColumn = hasTecnicoResponsavel ? 'tecnico_responsavel' : 'tecnicos_responsaveis';
        await dbAtendimento.execute<OkPacket>(
          `UPDATE ${table} SET ${updateColumn} = ? WHERE id = ?`,
          [userName, chamadoIdNumber]
        );
      }
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