import { NextRequest, NextResponse } from 'next/server';
import { dbAtendimento } from '@/lib/db';
import { OkPacket } from 'mysql2';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { chamadoId, origem, respostaConclusao } = body;

    // Validação dos dados
    if (!chamadoId || !origem) {
      return NextResponse.json(
        { error: 'Dados inválidos' },
        { status: 400 }
      );
    }

    // Validação do tamanho do texto
    if (respostaConclusao && respostaConclusao.length > 600) {
      return NextResponse.json(
        { error: 'A resposta de conclusão não pode ter mais que 600 caracteres' },
        { status: 400 }
      );
    }

    // Determina a tabela com base na origem
    const tabela = origem === 'chamados_atendimento' ? 'chamados_atendimento' : 'criacao_acessos';

    // Atualiza a resposta de conclusão
    const [result] = await dbAtendimento.execute<OkPacket>(
      `UPDATE ${tabela} SET resposta_conclusao = ? WHERE id = ?`,
      [respostaConclusao, chamadoId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Chamado não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Resposta de conclusão atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar resposta de conclusão:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 