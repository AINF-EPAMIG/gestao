import { executeQuery } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const includeTaskCount = url.searchParams.get('includeTaskCount') === 'true';
    const type = url.searchParams.get('type'); // 'full' para trazer todos os campos

    let query = '';

    if (type === 'full') {
      // Buscar todos os campos da tabela projetos
      query = 'SELECT * FROM u711845530_gestao.projetos ORDER BY nome';
    } else if (includeTaskCount) {
      query = `
        SELECT 
          p.*,
          COUNT(a.id) as taskCount
        FROM u711845530_gestao.projetos p
        LEFT JOIN u711845530_gestao.atividades a ON p.id = a.projeto_id
        GROUP BY p.id, p.nome
        ORDER BY p.nome
      `;
    } else {
      query = 'SELECT * FROM u711845530_gestao.projetos ORDER BY nome';
    }

    const projetos = await executeQuery({ query });
    
    return NextResponse.json(projetos);
  } catch (error) {
    console.error('Erro ao buscar projetos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar projetos' },
      { status: 500 }
    );
  }
}

interface QueryResult {
  insertId: number;
}

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    const body = await request.json();
    
    // Se for um POST simples (compatibilidade com versão antiga)
    if (body.nome && !body.tipo) {
      const nomeCapitalizado = capitalizeFirstLetter(body.nome);
      const status = body.status || 2; // Default: Em Desenvolvimento
      const tipo = body.tipo || 1; // Default: Sistema
      
      const result = await executeQuery({
        query: 'INSERT INTO u711845530_gestao.projetos (nome, tipo, status) VALUES (?, ?, ?)',
        values: [nomeCapitalizado, tipo, status],
      }) as QueryResult;

      const novoProjeto = {
        id: result.insertId,
        nome: nomeCapitalizado,
        tipo,
        status
      };
      
      return NextResponse.json(novoProjeto);
    }

    // POST completo com todos os campos
    const {
      nome,
      sigla,
      tipo,
      status,
      objetivo,
      setor_id,
      tecnologia_principal,
      repositorio_git,
      url_producao,
      url_homologacao,
      servidor,
      banco_dados,
      sistemas_integrados,
      rotinas_principais,
      url_documentacao,
      observacoes,
      data_inicio,
    } = body;

    const quem_cadastrou = session?.user?.name || 'Sistema';

    const query = `
      INSERT INTO u711845530_gestao.projetos (
        nome, sigla, tipo, status, objetivo, setor_id,
        tecnologia_principal, repositorio_git, url_producao, url_homologacao,
        servidor, banco_dados, sistemas_integrados, rotinas_principais,
        url_documentacao, observacoes, quem_cadastrou, data_inicio
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      nome,
      sigla || null,
      tipo || 1, // Default: Sistema
      status || 2, // Default: Em Desenvolvimento
      objetivo || null,
      setor_id || null,
      tecnologia_principal || null,
      repositorio_git || null,
      url_producao || null,
      url_homologacao || null,
      servidor || null,
      banco_dados || null,
      sistemas_integrados || null,
      rotinas_principais || null,
      url_documentacao || null,
      observacoes || null,
      quem_cadastrou,
      data_inicio || null,
    ];

    const result = await executeQuery({ query, values }) as QueryResult;

    return NextResponse.json({ id: result.insertId, ...body });
  } catch (error) {
    console.error('Erro ao criar projeto:', error);
    return NextResponse.json(
      { error: 'Erro ao criar projeto' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID do projeto não fornecido' },
        { status: 400 }
      );
    }

    // Se for um PUT simples (compatibilidade com versão antiga)
    if (body.nome && !body.tipo) {
      const nomeCapitalizado = capitalizeFirstLetter(body.nome);
      
      await executeQuery({
        query: 'UPDATE u711845530_gestao.projetos SET nome = ? WHERE id = ?',
        values: [nomeCapitalizado, id],
      });

      return NextResponse.json({ id, nome: nomeCapitalizado });
    }

    // PUT completo com todos os campos
    const {
      nome,
      sigla,
      tipo,
      status,
      objetivo,
      setor_id,
      tecnologia_principal,
      repositorio_git,
      url_producao,
      url_homologacao,
      servidor,
      banco_dados,
      sistemas_integrados,
      rotinas_principais,
      url_documentacao,
      observacoes,
      data_inicio,
    } = body;

    const quem_editou = session?.user?.name || 'Sistema';

    const query = `
      UPDATE u711845530_gestao.projetos SET
        nome = ?,
        sigla = ?,
        tipo = ?,
        status = ?,
        objetivo = ?,
        setor_id = ?,
        tecnologia_principal = ?,
        repositorio_git = ?,
        url_producao = ?,
        url_homologacao = ?,
        servidor = ?,
        banco_dados = ?,
        sistemas_integrados = ?,
        rotinas_principais = ?,
        url_documentacao = ?,
        observacoes = ?,
        quem_editou = ?,
        data_inicio = ?
      WHERE id = ?
    `;

    const values = [
      nome,
      sigla || null,
      tipo || 1, // Default: Sistema
      status || 2, // Default: Em Desenvolvimento
      objetivo || null,
      setor_id || null,
      tecnologia_principal || null,
      repositorio_git || null,
      url_producao || null,
      url_homologacao || null,
      servidor || null,
      banco_dados || null,
      sistemas_integrados || null,
      rotinas_principais || null,
      url_documentacao || null,
      observacoes || null,
      quem_editou,
      data_inicio || null,
      id,
    ];

    await executeQuery({ query, values });
    
    return NextResponse.json({ id, ...body });
  } catch (error) {
    console.error('Erro ao atualizar projeto:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar projeto' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do projeto não fornecido' },
        { status: 400 }
      );
    }

    // Atualizar tarefas associadas para ficarem com projeto indefinido
    await executeQuery({
      query: 'UPDATE u711845530_gestao.atividades SET projeto_id = NULL WHERE projeto_id = ?',
      values: [id],
    });
    
    // Excluir o projeto
    await executeQuery({
      query: 'DELETE FROM u711845530_gestao.projetos WHERE id = ?',
      values: [id],
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir projeto:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir projeto' },
      { status: 500 }
    );
  }
} 