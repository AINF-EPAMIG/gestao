import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, DB_MAIN_DATABASE, qualifyTable } from '@/lib/db';

const TABLE = qualifyTable(DB_MAIN_DATABASE, 'projetos_acessos');

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const projeto_id = url.searchParams.get('projeto_id');

    let query = `SELECT * FROM ${TABLE} ORDER BY id DESC`;
    const values: Array<string | number> = [];

    if (id) {
      query = `SELECT * FROM ${TABLE} WHERE id = ? LIMIT 1`;
      values.push(Number(id));
    } else if (projeto_id) {
      query = `SELECT * FROM ${TABLE} WHERE projeto_id = ? ORDER BY id DESC`;
      values.push(Number(projeto_id));
    }

    const rows = await executeQuery({ query, values });
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Erro projetos-acessos GET:', error);
    return NextResponse.json({ error: 'Erro ao buscar projetos_acessos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      projeto_id,
      tipo,
      nome_amigavel,
      descricao,
      status = 1,
    } = body;

    if (!projeto_id) {
      return NextResponse.json({ error: 'projeto_id é obrigatório' }, { status: 400 });
    }

    const query = `INSERT INTO ${TABLE} (projeto_id, tipo, nome_amigavel, descricao, status) VALUES (?, ?, ?, ?, ?)`;
    const values = [projeto_id, tipo || null, nome_amigavel || null, descricao || null, status];

    const result = await executeQuery<{ insertId?: number }>({ query, values });

    return NextResponse.json({ id: (result as { insertId?: number }).insertId, ...body });
  } catch (error) {
    console.error('Erro projetos-acessos POST:', error);
    return NextResponse.json({ error: 'Erro ao criar registro' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      id?: number;
      projeto_id?: number;
      tipo?: string | null;
      nome_amigavel?: string | null;
      descricao?: string | null;
      status?: number | null;
      [key: string]: unknown;
    };
    const { id } = body;
    if (!id) return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });

    const fields: string[] = [];
    const values: Array<string | number | null> = [];

    const allowed = ['projeto_id','tipo','nome_amigavel','descricao','status'];
    for (const key of allowed) {
      if (key in body) {
        fields.push(`${key} = ?`);
        const v = body[key] as string | number | null | undefined;
        values.push(v ?? null);
      }
    }

    if (fields.length === 0) return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 });

    const query = `UPDATE ${TABLE} SET ${fields.join(', ')} WHERE id = ?`;
    values.push(id);

    await executeQuery({ query, values });
    return NextResponse.json({ id, ...body });
  } catch (error) {
    console.error('Erro projetos-acessos PUT:', error);
    return NextResponse.json({ error: 'Erro ao atualizar registro' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });

    const query = `DELETE FROM ${TABLE} WHERE id = ?`;
    await executeQuery({ query, values: [Number(id)] });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro projetos-acessos DELETE:', error);
    return NextResponse.json({ error: 'Erro ao excluir registro' }, { status: 500 });
  }
}
