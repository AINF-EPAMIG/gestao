import { NextRequest, NextResponse } from 'next/server';
import { dbAtendimento } from '@/lib/db';
import { OkPacket } from 'mysql2';

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const origem = url.searchParams.get('origem');

    if (!id || !origem) {
      return NextResponse.json(
        { error: 'ID e origem são obrigatórios' },
        { status: 400 }
      );
    }

    // Determina a tabela com base na origem
    const tabela = origem === 'chamados_atendimento' ? 'chamados_atendimento' : 'criacao_acessos';

    // Exclui o chamado
    const [result] = await dbAtendimento.execute<OkPacket>(
      `DELETE FROM ${tabela} WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Chamado não encontrado' },
        { status: 404 }
      );
    }

    // Exclui a posição do kanban
    await dbAtendimento.execute<OkPacket>(
      'DELETE FROM kanban_positions WHERE tipo_item = ? AND id_referencia = ?',
      [origem === 'chamados_atendimento' ? 'chamado' : 'acesso', id]
    );

    return NextResponse.json({ message: 'Chamado excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir chamado:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 