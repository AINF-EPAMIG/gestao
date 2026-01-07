import { NextResponse } from 'next/server';
import { executeQueryAsti } from '@/lib/db';

type EstoqueItem = {
  id: string;
  nome: string;
  quantidade: number;
  patrimonio?: string | null;
  marca?: string | null;
  dataAquisicao?: string | null;
  quemCadastrou?: string | null;
  dataCadastro?: string | null;
  tipo?: string | null;
};

export async function GET() {
  try {
    // Query para buscar equipamentos e periféricos
    const query = `
      SELECT
        CONCAT(tipo, '-', id) AS id,
        nome,
        quantidade,
        patrimonio,
        marca,
        data_aquisicao AS dataAquisicao,
        quem_cadastrou AS quemCadastrou,
        data_cadastro AS dataCadastro,
        tipo
      FROM (
        SELECT
          id,
          nome,
          quantidade,
          patrimonio,
          marca,
          data_aquisicao,
          quem_cadastrou,
          data_cadastro,
          'equipamento' AS tipo
        FROM equipamentos
        UNION ALL
        SELECT
          id,
          nome,
          quantidade,
          patrimonio,
          marca,
          data_aquisicao,
          quem_cadastrou,
          data_cadastro,
          'periferico' AS tipo
        FROM perifericos
      ) AS combined
      ORDER BY dataCadastro DESC
    `;

    const results = await executeQueryAsti<EstoqueItem[]>({ query });

    // Como os campos são DATE, já retornam YYYY-MM-DD, sem formatação adicional
    const formattedResults = results;

    return NextResponse.json(formattedResults);
  } catch (error) {
    console.error('Erro ao consultar estoque:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}