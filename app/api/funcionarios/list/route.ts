import { NextRequest, NextResponse } from 'next/server';
import { executeQueryFuncionarios } from '@/lib/db';
import { Funcionario } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const setor = searchParams.get('setor') || '';
    const regional = searchParams.get('regional') || '';
    const cargo = searchParams.get('cargo') || '';

    let query = `
      SELECT 
        chapa,
        nome,
        email,
        CASE
          WHEN departamento IS NOT NULL AND TRIM(departamento) <> '' THEN TRIM(departamento)
          WHEN (departamento IS NULL OR TRIM(departamento) = '') AND divisao IS NOT NULL AND TRIM(divisao) <> '' THEN TRIM(divisao)
          WHEN (departamento IS NULL OR TRIM(departamento) = '') AND (divisao IS NULL OR TRIM(divisao) = '') AND assessoria IS NOT NULL AND TRIM(assessoria) <> '' THEN TRIM(assessoria)
          ELSE ''
        END AS setor,
        regional,
        cargo
      FROM vw_colaboradores_completos
      WHERE 1=1
    `;

    const values: string[] = [];

    // Filtro de busca geral (nome, email ou chapa)
    if (search) {
      query += ` AND (
        nome LIKE ? OR 
        email LIKE ? OR 
        chapa LIKE ?
      )`;
      const searchPattern = `%${search}%`;
      values.push(searchPattern, searchPattern, searchPattern);
    }

    // Filtro por setor
    if (setor) {
      query += ` AND (
        (departamento IS NOT NULL AND TRIM(departamento) <> '' AND UPPER(TRIM(departamento)) = UPPER(TRIM(?))) OR
        ((departamento IS NULL OR TRIM(departamento) = '') AND divisao IS NOT NULL AND TRIM(divisao) <> '' AND UPPER(TRIM(divisao)) = UPPER(TRIM(?))) OR
        ((departamento IS NULL OR TRIM(departamento) = '') AND (divisao IS NULL OR TRIM(divisao) = '') AND assessoria IS NOT NULL AND TRIM(assessoria) <> '' AND UPPER(TRIM(assessoria)) = UPPER(TRIM(?)))
      )`;
      values.push(setor, setor, setor);
    }

    // Filtro por regional
    if (regional) {
      query += ` AND regional = ?`;
      values.push(regional);
    }

    // Filtro por cargo
    if (cargo) {
      query += ` AND cargo LIKE ?`;
      values.push(`%${cargo}%`);
    }

    query += ` ORDER BY nome`;

    const funcionarios = await executeQueryFuncionarios<Funcionario[]>({
      query,
      values,
    });

    return NextResponse.json(funcionarios);
  } catch (error) {
    console.error('Erro ao buscar funcionários:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar funcionários', details: String(error) },
      { status: 500 }
    );
  }
}
