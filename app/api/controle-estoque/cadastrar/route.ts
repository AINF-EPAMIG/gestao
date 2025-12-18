import { NextRequest, NextResponse } from "next/server";
import { executeQueryAsti } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nome, quantidade, patrimonio, dataAquisicao, marca, tipo } = body;

    // Validação dos campos obrigatórios
    if (!nome || !quantidade || !dataAquisicao || !tipo) {
      return NextResponse.json({ erro: "Campos obrigatórios ausentes" }, { status: 400 });
    }

    if (tipo !== 'equipamento' && tipo !== 'periferico') {
      return NextResponse.json({ erro: "Tipo inválido" }, { status: 400 });
    }

    const qtd = parseInt(quantidade);
    if (isNaN(qtd) || qtd < 1) {
      return NextResponse.json({ erro: "Quantidade inválida" }, { status: 400 });
    }

    // Inserir na tabela correspondente
    if (tipo === 'equipamento') {
      const query = `
        INSERT INTO equipamentos (nome, quantidade, patrimonio, data_aquisicao, marca)
        VALUES (?, ?, ?, ?, ?)
      `;
      await executeQueryAsti({
        query,
        values: [nome.trim(), qtd, patrimonio?.trim() || null, dataAquisicao, marca?.trim() || null]
      });
    } else {
      const query = `
        INSERT INTO perifericos (nome, quantidade, patrimonio, data_aquisicao, marca)
        VALUES (?, ?, ?, ?, ?)
      `;
      await executeQueryAsti({
        query,
        values: [nome.trim(), qtd, patrimonio?.trim() || null, dataAquisicao, marca?.trim() || null]
      });
    }

    return NextResponse.json({ sucesso: true, mensagem: `${tipo === 'equipamento' ? 'Equipamento' : 'Periférico'} cadastrado com sucesso` });
  } catch (error) {
    console.error('Erro ao cadastrar item:', error);
    return NextResponse.json({ erro: "Erro interno do servidor" }, { status: 500 });
  }
}
