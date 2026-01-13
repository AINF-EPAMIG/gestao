import { NextResponse } from 'next/server';
import { executeQueryAsti } from '@/lib/db';

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, tipo, nome, quantidade, patrimonio, marca, dataAquisicao } = body;

    if (!id || !tipo) {
      return NextResponse.json({ error: 'id e tipo são obrigatórios' }, { status: 400 });
    }

    const table = tipo === 'equipamento' ? 'equipamentos' : 'perifericos';

    const query = `
      UPDATE ${table}
      SET nome = ?, quantidade = ?, patrimonio = ?, marca = ?, data_aquisicao = ?
      WHERE id = ?
    `;

    const values = [nome ?? null, quantidade ?? null, patrimonio ?? null, marca ?? null, dataAquisicao ?? null, id];

    await executeQueryAsti({ query, values });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar item:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
