import { executeQuery } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getUserInfoFromRM, isUserChefe, isUserAdmin } from '@/lib/rm-service';

interface Atividade {
  id: number;
  titulo: string;
  descricao: string;
  projeto_id: number;
  responsavel_email: string;
  data_inicio: string;
  data_fim: string | null;
  data_criacao: string;
  status_id: number;
  prioridade_id: number;
  estimativa_horas: string | null;
  projeto_nome: string | null;
  setor_sigla: string | null;
  position: number | null;
}

interface AtividadeComResponsavel extends Atividade {
  responsavel_nome: string;
  responsavel_cargo: string;
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userEmail = url.searchParams.get('userEmail');
    const setorSigla = url.searchParams.get('setorSigla');

    if (!userEmail) {
      return NextResponse.json(
        { error: 'Email do usuário não fornecido' },
        { status: 400 }
      );
    }

    // Verificar se é um administrador
    const isAdmin = isUserAdmin(userEmail);

    // Se não for admin, buscar o setor do usuário
    let whereClause = '';
    let queryValues: (string)[] = [];

    if (!isAdmin) {
      const userInfo = await getUserInfoFromRM(userEmail);
      
      if (!userInfo?.SECAO) {
        return NextResponse.json(
          { error: 'Setor do usuário não encontrado' },
          { status: 404 }
        );
      }

      whereClause = 'WHERE s.sigla = ?';
      queryValues = [userInfo.SECAO];
    } else if (setorSigla) {
      // Se for admin e um setor foi especificado
      whereClause = 'WHERE s.sigla = ?';
      queryValues = [setorSigla];
    }

    // Buscar atividades sem depender da tabela responsaveis
    const atividades = await executeQuery({
      query: `
        SELECT a.*, r.email as responsavel_email, p.nome as projeto_nome, s.sigla as setor_sigla
        FROM u711845530_gestao.atividades a
        LEFT JOIN u711845530_gestao.responsaveis r ON a.responsavel_id = r.id
        LEFT JOIN u711845530_gestao.projetos p ON a.projeto_id = p.id
        LEFT JOIN u711845530_gestao.setor s ON a.setor_id = s.id
        ${whereClause}
        ORDER BY a.id DESC
      `,
      values: queryValues,
    }) as Atividade[];
    
    // Buscar informações dos responsáveis da API do RM
    const responsaveisInfo = new Map<string, { nome: string; cargo: string }>();
    for (const atividade of atividades) {
      if (atividade.responsavel_email && !responsaveisInfo.has(atividade.responsavel_email)) {
        const userInfo = await getUserInfoFromRM(atividade.responsavel_email);
        if (userInfo) {
          responsaveisInfo.set(atividade.responsavel_email, {
            nome: userInfo.NOME_COMPLETO,
            cargo: userInfo.CARGO
          });
        }
      }
    }

    // Adicionar informações dos responsáveis às atividades
    const atividadesComResponsaveis: AtividadeComResponsavel[] = atividades.map(atividade => ({
      ...atividade,
      responsavel_nome: responsaveisInfo.get(atividade.responsavel_email)?.nome || 'Não atribuído',
      responsavel_cargo: responsaveisInfo.get(atividade.responsavel_email)?.cargo || ''
    }));
    
    return new NextResponse(JSON.stringify(atividadesComResponsaveis), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('❌ Erro ao consultar o banco:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar atividades' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, status_id, position } = data;

    console.log('🔵 Atualizando tarefa...');
    
    await executeQuery({
      query: 'UPDATE u711845530_gestao.atividades SET status_id = ?, position = ? WHERE id = ?',
      values: [status_id, position, id],
    });
    
    console.log('✅ Tarefa atualizada com sucesso');
    
    // Buscar dados atualizados
    const atividades = await executeQuery({
      query: `
        SELECT a.*, r.email as responsavel_email, p.nome as projeto_nome, s.sigla as setor_sigla
        FROM u711845530_gestao.atividades a
        LEFT JOIN u711845530_gestao.responsaveis r ON a.responsavel_id = r.id
        LEFT JOIN u711845530_gestao.projetos p ON a.projeto_id = p.id
        LEFT JOIN u711845530_gestao.setor s ON a.setor_id = s.id
        ORDER BY a.status_id, a.position
      `,
    }) as Atividade[];

    // Buscar informações dos responsáveis da API do RM
    const responsaveisInfo = new Map<string, { nome: string; cargo: string }>();
    for (const atividade of atividades) {
      if (atividade.responsavel_email && !responsaveisInfo.has(atividade.responsavel_email)) {
        const userInfo = await getUserInfoFromRM(atividade.responsavel_email);
        if (userInfo) {
          responsaveisInfo.set(atividade.responsavel_email, {
            nome: userInfo.NOME_COMPLETO,
            cargo: userInfo.CARGO
          });
        }
      }
    }

    // Adicionar informações dos responsáveis às atividades
    const atividadesComResponsaveis: AtividadeComResponsavel[] = atividades.map(atividade => ({
      ...atividade,
      responsavel_nome: responsaveisInfo.get(atividade.responsavel_email)?.nome || 'Não atribuído',
      responsavel_cargo: responsaveisInfo.get(atividade.responsavel_email)?.cargo || ''
    }));
    
    return NextResponse.json(atividadesComResponsaveis);
  } catch (error) {
    console.error('❌ Erro ao atualizar tarefa:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar tarefa' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { 
      titulo, 
      descricao, 
      data_inicio, 
      status_id, 
      prioridade_id, 
      projeto_id, 
      responsavel_email, 
      data_fim, 
      estimativa_horas, 
      userEmail,
      data_criacao 
    } = data;

    // Verificar se é admin ou chefe
    const isAdmin = isUserAdmin(userEmail);
    let userInfo = null;
    let setorSigla = null;

    // Se não for admin, verificar se é chefe e obter o setor
    if (!isAdmin) {
      userInfo = await getUserInfoFromRM(userEmail);
      
      if (!isUserChefe(userInfo)) {
        return NextResponse.json(
          { error: 'Apenas chefes e administradores podem criar novas tarefas' },
          { status: 403 }
        );
      }

      if (!userInfo?.SECAO) {
        return NextResponse.json(
          { error: 'Setor do usuário não encontrado' },
          { status: 404 }
        );
      }
      setorSigla = userInfo.SECAO;
    }

    if (isAdmin && data.setorSigla) {
      setorSigla = data.setorSigla;
    }

    // Extrair email da string (caso venha com nome)
    const emailMatch = responsavel_email.match(/\((.*?)\)/);
    const email = emailMatch ? emailMatch[1] : responsavel_email;

    // 1. Verificar se o responsável já existe
    const existingResponsavel = await executeQuery({
      query: 'SELECT id FROM u711845530_gestao.responsaveis WHERE email = ? LIMIT 1',
      values: [email]
    }) as { id: number }[];

    let responsavelId;

    if (existingResponsavel.length > 0) {
      // Se já existe, usa o ID existente
      responsavelId = existingResponsavel[0].id;
    } else {
      // Se não existe, cria um novo
      await executeQuery({
        query: 'INSERT INTO u711845530_gestao.responsaveis (email) VALUES (?)',
        values: [email]
      });

      // Busca o ID do responsável recém inserido
      const getResponsavelId = await executeQuery({
        query: 'SELECT id FROM u711845530_gestao.responsaveis WHERE email = ? ORDER BY id DESC LIMIT 1',
        values: [email]
      }) as { id: number }[];

      if (!getResponsavelId || getResponsavelId.length === 0) {
        throw new Error('Falha ao obter ID do responsável');
      }

      responsavelId = getResponsavelId[0].id;
    }

    // 3. Criar a atividade com o ID do responsável
    await executeQuery({
      query: `
        INSERT INTO u711845530_gestao.atividades 
        (titulo, descricao, projeto_id, responsavel_id, data_inicio, data_fim, 
         status_id, prioridade_id, estimativa_horas, setor_id, data_criacao) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,
          ${setorSigla ? '(SELECT id FROM u711845530_gestao.setor WHERE sigla = ?)' : '?'},
          ?
        )
      `,
      values: [
        titulo, 
        descricao, 
        projeto_id,
        responsavelId,
        data_inicio,
        data_fim,
        status_id,
        prioridade_id,
        estimativa_horas,
        setorSigla || null,
        data_criacao
      ],
    });

    console.log('✅ Atividade criada com sucesso');
    
    // Buscar dados atualizados
    const atividades = await executeQuery({
      query: `
        SELECT a.*, r.email as responsavel_email, p.nome as projeto_nome, s.sigla as setor_sigla
        FROM u711845530_gestao.atividades a
        LEFT JOIN u711845530_gestao.responsaveis r ON a.responsavel_id = r.id
        LEFT JOIN u711845530_gestao.projetos p ON a.projeto_id = p.id
        LEFT JOIN u711845530_gestao.setor s ON a.setor_id = s.id
        ${!isAdmin && setorSigla ? 'WHERE s.sigla = ?' : ''}
        ORDER BY a.id DESC
      `,
      values: !isAdmin && setorSigla ? [setorSigla] : [],
    }) as Atividade[];

    // Buscar informações dos responsáveis da API do RM
    const responsaveisInfo = new Map<string, { nome: string; cargo: string }>();
    for (const atividade of atividades) {
      if (atividade.responsavel_email && !responsaveisInfo.has(atividade.responsavel_email)) {
        const userInfo = await getUserInfoFromRM(atividade.responsavel_email);
        if (userInfo) {
          responsaveisInfo.set(atividade.responsavel_email, {
            nome: userInfo.NOME_COMPLETO,
            cargo: userInfo.CARGO
          });
        }
      }
    }

    // Adicionar informações dos responsáveis às atividades
    const atividadesComResponsaveis: AtividadeComResponsavel[] = atividades.map(atividade => ({
      ...atividade,
      responsavel_nome: responsaveisInfo.get(atividade.responsavel_email)?.nome || 'Não atribuído',
      responsavel_cargo: responsaveisInfo.get(atividade.responsavel_email)?.cargo || ''
    }));
    
    return NextResponse.json(atividadesComResponsaveis);
  } catch (error) {
    console.error('❌ Erro ao criar atividade:', error);
    return NextResponse.json(
      { error: 'Erro ao criar atividade' },
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
        { error: 'ID não fornecido' },
        { status: 400 }
      );
    }
    
    console.log('🔵 Excluindo atividade...');
    
    await executeQuery({
      query: 'DELETE FROM u711845530_gestao.atividades WHERE id = ?',
      values: [id],
    });
    
    console.log('✅ Atividade excluída com sucesso');
    
    // Buscar dados atualizados
    const atividades = await executeQuery({
      query: `
        SELECT a.*, r.email as responsavel_email, p.nome as projeto_nome, s.sigla as setor_sigla
        FROM u711845530_gestao.atividades a
        LEFT JOIN u711845530_gestao.responsaveis r ON a.responsavel_id = r.id
        LEFT JOIN u711845530_gestao.projetos p ON a.projeto_id = p.id
        LEFT JOIN u711845530_gestao.setor s ON a.setor_id = s.id
      `,
    }) as Atividade[];

    // Buscar informações dos responsáveis da API do RM
    const responsaveisInfo = new Map<string, { nome: string; cargo: string }>();
    for (const atividade of atividades) {
      if (atividade.responsavel_email && !responsaveisInfo.has(atividade.responsavel_email)) {
        const userInfo = await getUserInfoFromRM(atividade.responsavel_email);
        if (userInfo) {
          responsaveisInfo.set(atividade.responsavel_email, {
            nome: userInfo.NOME_COMPLETO,
            cargo: userInfo.CARGO
          });
        }
      }
    }

    // Adicionar informações dos responsáveis às atividades
    const atividadesComResponsaveis: AtividadeComResponsavel[] = atividades.map(atividade => ({
      ...atividade,
      responsavel_nome: responsaveisInfo.get(atividade.responsavel_email)?.nome || 'Não atribuído',
      responsavel_cargo: responsaveisInfo.get(atividade.responsavel_email)?.cargo || ''
    }));
    
    return NextResponse.json(atividadesComResponsaveis);
  } catch (error) {
    console.error('❌ Erro ao excluir atividade:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir atividade' },
      { status: 500 }
    );
  }
} 