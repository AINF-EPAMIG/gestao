import { executeQuery, executeQueryFuncionarios } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, createTaskAssignmentEmail, createTaskNewResponsibleEmail } from '@/lib/email-service';
import { Funcionario } from '@/lib/types';
import { isExceptionEmailChefia } from '@/lib/auth-config';

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
  responsaveis?: {
    id: number;
    email: string;
    nome?: string;
    cargo?: string;
  }[];
}

interface Responsavel {
  id: number;
  email: string;
}

interface AtividadeComResponsavel extends Atividade {
  responsavel_nome: string;
  responsavel_cargo: string;
}

interface ResponsavelParcial {
  id?: number;
  email?: string;
}

interface QueryResult {
  insertId: number;
}

// Helpers para nova API
async function getUserInfo(email: string) {
  const result = await executeQueryFuncionarios<Funcionario[]>({
    query: 'SELECT * FROM funcionarios WHERE email = ? LIMIT 1',
    values: [email],
  });
  return result[0] || null;
}

async function isUserAdmin() {
  // Adapte conforme sua lógica de admin, se necessário
  // Exemplo: checar se o email está em uma lista de admins
  return false;
}

async function isUserChefe(email: string) {
  // Verificar se é email de exceção primeiro
  if (isExceptionEmailChefia(email)) {
    return true;
  }
  
  // Verificação tradicional por chefia/cargo
  const userInfo = await getUserInfo(email);
  if (!userInfo) return false;
  
  // Verificar se tem chefia definida (campo chefia não vazio)
  const hasChefia = typeof userInfo.chefia === 'string' && userInfo.chefia.trim() !== '';
  
  // Verificar se cargo contém "CHEFE" (para compatibilidade com outras funções)
  const isChefeCargo = typeof userInfo.cargo === 'string' && userInfo.cargo.toUpperCase().includes('CHEFE');
  
  return hasChefia || isChefeCargo;
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userEmail = url.searchParams.get('userEmail');
    const setorSigla = url.searchParams.get('setorSigla');
    const getAllTasks = url.searchParams.get('all') === 'true';

    // Se o parâmetro 'all' for true, retornar todas as tarefas sem filtros
    if (getAllTasks) {
      console.log('Buscando todas as tarefas sem filtros');
      
      const atividades = await executeQuery({
        query: `
          SELECT 
            a.*,
            p.nome as projeto_nome, 
            s.sigla as setor_sigla,
            COALESCE(
              CONCAT('[', 
                GROUP_CONCAT(
                  CASE 
                    WHEN ar.responsavel_id IS NOT NULL 
                    THEN JSON_OBJECT('id', ar.responsavel_id, 'email', r.email)
                    ELSE NULL 
                  END
                ),
              ']'),
              '[]'
            ) as responsaveis
          FROM u711845530_gestao.atividades a
          LEFT JOIN u711845530_gestao.atividades_responsaveis ar ON a.id = ar.atividade_id
          LEFT JOIN u711845530_gestao.responsaveis r ON ar.responsavel_id = r.id
          LEFT JOIN u711845530_gestao.projetos p ON a.projeto_id = p.id
          LEFT JOIN u711845530_gestao.setor s ON a.setor_id = s.id
          GROUP BY a.id, a.titulo, a.descricao, a.projeto_id, a.data_inicio, a.data_fim, 
                  a.status_id, a.prioridade_id, a.estimativa_horas, a.data_criacao,
                  a.id_release, a.position, a.ultima_atualizacao, a.setor_id,
                  p.nome, s.sigla
          ORDER BY a.id DESC
        `,
        values: [],
      }) as Atividade[];

      // Processar os responsáveis de string JSON para array
      const atividadesProcessadas = atividades.map(atividade => {
        let responsaveis = [];
        if (atividade.responsaveis && typeof atividade.responsaveis === 'string') {
          try {
            responsaveis = JSON.parse(atividade.responsaveis);
            // Filtrar responsáveis inválidos
            responsaveis = responsaveis.filter((r: ResponsavelParcial) => r && r.id && r.email);
          } catch (e) {
            console.error('Erro ao processar responsáveis:', e);
          }
        }
        return {
          ...atividade,
          responsaveis
        };
      });
      
      return new NextResponse(JSON.stringify(atividadesProcessadas), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }

    if (!userEmail) {
      return NextResponse.json(
        { error: 'Email do usuário não fornecido' },
        { status: 400 }
      );
    }

    // Verificar se é um administrador
    const isAdmin = await isUserAdmin();

    // Se não for admin, buscar o setor do usuário
    let whereClause = '';
    let queryValues: (string)[] = [];

    if (!isAdmin) {
      const userInfo = await getUserInfo(userEmail);
      
      if (!userInfo?.secao) {
        return NextResponse.json(
          { error: 'Setor do usuário não encontrado' },
          { status: 404 }
        );
      }

      whereClause = 'WHERE s.sigla = ?';
      queryValues = [userInfo.secao];
    } else if (setorSigla) {
      // Se for admin e um setor foi especificado
      whereClause = 'WHERE s.sigla = ?';
      queryValues = [setorSigla];
    }

    // Buscar atividades sem depender da tabela responsaveis
    const atividades = await executeQuery({
      query: `
        SELECT 
          a.*,
          p.nome as projeto_nome, 
          s.sigla as setor_sigla,
          COALESCE(
            CONCAT('[', 
              GROUP_CONCAT(
                CASE 
                  WHEN ar.responsavel_id IS NOT NULL 
                  THEN JSON_OBJECT('id', ar.responsavel_id, 'email', r.email)
                  ELSE NULL 
                END
              ),
            ']'),
            '[]'
          ) as responsaveis
        FROM u711845530_gestao.atividades a
        LEFT JOIN u711845530_gestao.atividades_responsaveis ar ON a.id = ar.atividade_id
        LEFT JOIN u711845530_gestao.responsaveis r ON ar.responsavel_id = r.id
        LEFT JOIN u711845530_gestao.projetos p ON a.projeto_id = p.id
        LEFT JOIN u711845530_gestao.setor s ON a.setor_id = s.id
        ${whereClause}
        GROUP BY a.id, a.titulo, a.descricao, a.projeto_id, a.data_inicio, a.data_fim, 
                a.status_id, a.prioridade_id, a.estimativa_horas, a.data_criacao,
                a.id_release, a.position, a.ultima_atualizacao, a.setor_id,
                p.nome, s.sigla
        ORDER BY a.id DESC
      `,
      values: queryValues,
    }) as Atividade[];

    // Processar os responsáveis de string JSON para array
    const atividadesProcessadas = atividades.map(atividade => {
      let responsaveis = [];
      if (atividade.responsaveis && typeof atividade.responsaveis === 'string') {
        try {
          responsaveis = JSON.parse(atividade.responsaveis);
          // Filtrar responsáveis inválidos
          responsaveis = responsaveis.filter((r: ResponsavelParcial) => r && r.id && r.email);
        } catch (e) {
          console.error('Erro ao processar responsáveis:', e);
        }
      }
      return {
        ...atividade,
        responsaveis
      };
    });
    
    // Buscar informações dos responsáveis da API do RM
    const responsaveisInfo = new Map<string, { nome: string; cargo: string }>();
    for (const atividade of atividadesProcessadas) {
      for (const responsavel of atividade.responsaveis) {
        if (responsavel.email && !responsaveisInfo.has(responsavel.email)) {
          const userInfo = await getUserInfo(responsavel.email);
          if (userInfo) {
            responsaveisInfo.set(responsavel.email, {
              nome: userInfo.nome,
              cargo: userInfo.cargo
            });
          }
        }
      }
    }

    // Adicionar informações dos responsáveis às atividades
    const atividadesComResponsaveis = atividadesProcessadas.map(atividade => ({
      ...atividade,
      responsaveis: atividade.responsaveis.map((resp: Responsavel) => ({
        ...resp,
        nome: responsaveisInfo.get(resp.email)?.nome || 'Não atribuído',
        cargo: responsaveisInfo.get(resp.email)?.cargo || ''
      }))
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
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID não fornecido' },
        { status: 400 }
      );
    }

    const data = await request.json();
    const { 
      status_id, 
      position,
      titulo,
      descricao,
      projeto_id,
      responsaveis_emails,
      data_inicio,
      data_fim,
      prioridade_id,
      estimativa_horas,
      userEmail,
      novosResponsaveis,
      editorName,
      id_release
    } = data;

    // Se for apenas atualização de status e posição
    if (status_id !== undefined && position !== undefined && !titulo) {
      console.log('🔵 Atualizando posição da tarefa...');
      
      await executeQuery({
        query: 'UPDATE u711845530_gestao.atividades SET status_id = ?, position = ? WHERE id = ?',
        values: [status_id, position, id],
      });
      
      console.log('✅ Tarefa atualizada com sucesso');
    } else {
      // Verificar permissões
      const isAdmin = await isUserAdmin();
      let canEdit = false;

      if (!isAdmin) {
        const isChefe = await isUserChefe(userEmail);

        // Verificar se é responsável pela tarefa
        const taskResponsaveis = await executeQuery({
          query: `
            SELECT r.email 
            FROM u711845530_gestao.atividades_responsaveis ar
            JOIN u711845530_gestao.responsaveis r ON ar.responsavel_id = r.id
            WHERE ar.atividade_id = ?
          `,
          values: [id]
        }) as { email: string }[];

        const isResponsavel = taskResponsaveis.some(r => r.email === userEmail);

        canEdit = isChefe || isResponsavel;
      } else {
        canEdit = true;
      }

      if (!canEdit) {
        return NextResponse.json(
          { error: 'Você não tem permissão para editar esta tarefa' },
          { status: 403 }
        );
      }

      console.log('🔵 Atualizando detalhes da tarefa...');

      // Atualizar dados básicos da tarefa
      await executeQuery({
        query: `
          UPDATE u711845530_gestao.atividades 
          SET titulo = ?,
              descricao = ?,
              projeto_id = ?,
              data_inicio = ?,
              data_fim = ?,
              prioridade_id = ?,
              estimativa_horas = ?,
              id_release = ?,
              ultima_atualizacao = DATE_SUB(NOW(), INTERVAL 3 HOUR)
          WHERE id = ?
        `,
        values: [
          titulo,
          descricao,
          projeto_id,
          data_inicio,
          data_fim,
          prioridade_id,
          estimativa_horas,
          id_release,
          id
        ],
      });

      // Atualizar responsáveis
      if (responsaveis_emails) {
        // Remover responsáveis atuais
        await executeQuery({
          query: 'DELETE FROM u711845530_gestao.atividades_responsaveis WHERE atividade_id = ?',
          values: [id]
        });

        // Adicionar novos responsáveis
        for (const email of responsaveis_emails) {
          // Verificar se o responsável já existe
          const existingResponsavel = await executeQuery({
            query: 'SELECT id FROM u711845530_gestao.responsaveis WHERE email = ? LIMIT 1',
            values: [email]
          }) as { id: number }[];

          let responsavelId;

          if (existingResponsavel.length > 0) {
            responsavelId = existingResponsavel[0].id;
          } else {
            // Se não existe, cria um novo
            const newResponsavel = await executeQuery({
              query: 'INSERT INTO u711845530_gestao.responsaveis (email) VALUES (?)',
              values: [email]
            }) as QueryResult;
            responsavelId = newResponsavel.insertId;
          }

          // Criar o relacionamento na tabela atividades_responsaveis
          await executeQuery({
            query: 'INSERT INTO u711845530_gestao.atividades_responsaveis (atividade_id, responsavel_id) VALUES (?, ?)',
            values: [id, responsavelId]
          });
        }

        // Enviar e-mail para novos responsáveis
        if (novosResponsaveis && novosResponsaveis.length > 0) {
          console.log('🔵 Enviando e-mails para novos responsáveis:', novosResponsaveis);
          // Buscar nome do projeto
          const projetoResult = await executeQuery({
            query: 'SELECT nome FROM u711845530_gestao.projetos WHERE id = ?',
            values: [projeto_id]
          }) as { nome: string }[];

          const projetoNome = projetoResult[0]?.nome || 'Projeto não definido';
          const prioridadeNome = prioridade_id === 1 ? 'Alta' : prioridade_id === 2 ? 'Média' : 'Baixa';

          const emailInfo = createTaskNewResponsibleEmail(
            titulo,
            descricao,
            projetoNome,
            prioridadeNome,
            data_inicio,
            editorName
          );

          console.log('🔵 Informações do e-mail:', emailInfo);

          // Filtrar o próprio usuário da lista de destinatários
          const otherResponsaveis = novosResponsaveis.filter((email: string) => email !== userEmail);

          // Enviar e-mail apenas para os outros responsáveis
          await Promise.all(
            otherResponsaveis.map(async (email: string) => {
              try {
                await sendEmail({
                  to: email,
                  subject: emailInfo.subject,
                  html: emailInfo.html
                });
                console.log('✅ E-mail enviado para:', email);
              } catch (error) {
                console.error('❌ Erro ao enviar e-mail para:', email, error);
              }
            })
          );
        }
      }

      console.log('✅ Tarefa atualizada com sucesso');
    }
    
    // Buscar dados atualizados
    const atividades = await executeQuery({
      query: `
        SELECT 
          a.*,
          p.nome as projeto_nome, 
          s.sigla as setor_sigla,
          COALESCE(
            CONCAT('[', 
              GROUP_CONCAT(
                CASE 
                  WHEN ar.responsavel_id IS NOT NULL 
                  THEN JSON_OBJECT('id', ar.responsavel_id, 'email', r.email)
                  ELSE NULL 
                END
              ),
            ']'),
            '[]'
          ) as responsaveis
        FROM u711845530_gestao.atividades a
        LEFT JOIN u711845530_gestao.atividades_responsaveis ar ON a.id = ar.atividade_id
        LEFT JOIN u711845530_gestao.responsaveis r ON ar.responsavel_id = r.id
        LEFT JOIN u711845530_gestao.projetos p ON a.projeto_id = p.id
        LEFT JOIN u711845530_gestao.setor s ON a.setor_id = s.id
        GROUP BY a.id, a.titulo, a.descricao, a.projeto_id, a.data_inicio, a.data_fim, 
                a.status_id, a.prioridade_id, a.estimativa_horas, a.data_criacao,
                a.id_release, a.position, a.ultima_atualizacao, a.setor_id,
                p.nome, s.sigla
        ORDER BY a.id DESC
      `
    }) as Atividade[];

    // Processar os responsáveis
    const atividadesProcessadas = atividades.map(atividade => {
      let responsaveis = [];
      if (atividade.responsaveis && typeof atividade.responsaveis === 'string') {
        try {
          responsaveis = JSON.parse(atividade.responsaveis);
          responsaveis = responsaveis.filter((r: ResponsavelParcial) => r && r.id && r.email);
        } catch (e) {
          console.error('Erro ao processar responsáveis:', e);
        }
      }
      return {
        ...atividade,
        responsaveis
      };
    });

    // Buscar informações dos responsáveis da API do RM
    const responsaveisInfo = new Map<string, { nome: string; cargo: string }>();
    for (const atividade of atividadesProcessadas) {
      for (const responsavel of atividade.responsaveis) {
        if (responsavel.email && !responsaveisInfo.has(responsavel.email)) {
          const userInfo = await getUserInfo(responsavel.email);
          if (userInfo) {
            responsaveisInfo.set(responsavel.email, {
              nome: userInfo.nome,
              cargo: userInfo.cargo
            });
          }
        }
      }
    }

    // Adicionar informações dos responsáveis às atividades
    const atividadesComResponsaveis = atividadesProcessadas.map(atividade => ({
      ...atividade,
      responsaveis: atividade.responsaveis.map((resp: Responsavel) => ({
        ...resp,
        nome: responsaveisInfo.get(resp.email)?.nome || 'Não atribuído',
        cargo: responsaveisInfo.get(resp.email)?.cargo || ''
      }))
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
      responsaveis_emails, // Array de emails dos responsáveis
      data_fim, 
      userEmail,
      data_criacao,
      id_release,
      estimativa_horas
    } = data;

    // Obter informações do usuário
    const userInfo = await getUserInfo(userEmail);
    if (!userInfo) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    let setorSigla = userInfo.secao;

    // Se for admin e especificou um setor diferente, usar o setor especificado
    const isAdmin = await isUserAdmin();
    if (isAdmin && data.setorSigla) {
      setorSigla = data.setorSigla;
    }

    // Criar a atividade primeiro
    const result = await executeQuery({
      query: `
        INSERT INTO u711845530_gestao.atividades 
        (titulo, descricao, projeto_id, data_inicio, data_fim, 
         status_id, prioridade_id, estimativa_horas, setor_id, data_criacao, id_release, position) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?,
          ${setorSigla ? '(SELECT id FROM u711845530_gestao.setor WHERE sigla = ?)' : '?'},
          ?,
          ?,
          0
        )
      `,
      values: [
        titulo, 
        descricao, 
        projeto_id,
        data_inicio,
        data_fim,
        status_id,
        prioridade_id,
        estimativa_horas || 0, // Usar o valor fornecido ou 0 como padrão
        setorSigla || null,
        data_criacao,
        id_release
      ],
    }) as QueryResult;

    const atividadeId = result.insertId;

    // Atualizar posições das outras tarefas no mesmo status
    await executeQuery({
      query: `
        UPDATE u711845530_gestao.atividades
        SET position = position + 1
        WHERE status_id = ? AND id != ?
      `,
      values: [status_id, atividadeId],
    });

    // Enviar e-mail para cada responsável
    if (responsaveis_emails && responsaveis_emails.length > 0) {
      // Buscar nome do projeto
      const projetoResult = await executeQuery({
        query: 'SELECT nome FROM u711845530_gestao.projetos WHERE id = ?',
        values: [projeto_id]
      }) as { nome: string }[];

      const projetoNome = projetoResult[0]?.nome || 'Projeto não definido';
      const prioridadeNome = prioridade_id === 1 ? 'Alta' : prioridade_id === 2 ? 'Média' : 'Baixa';

      // Buscar informações do usuário que criou a tarefa
      const userInfoRM = await getUserInfo(userEmail);
      const creatorName = userInfoRM?.nome || userEmail;

      const emailInfo = createTaskAssignmentEmail(
        titulo,
        descricao,
        projetoNome,
        prioridadeNome,
        data_inicio,
        creatorName
      );

      // Filtrar o próprio usuário da lista de destinatários
      const otherResponsaveis = responsaveis_emails.filter((email: string) => email !== userEmail);

      // Enviar e-mail apenas para os outros responsáveis
      await Promise.all(
        otherResponsaveis.map(async (email: string) => {
          await sendEmail({
            to: email,
            subject: emailInfo.subject,
            html: emailInfo.html
          });
        })
      );
    }

    // Processar cada responsável
    for (const email of responsaveis_emails) {
      // Verificar se o responsável já existe
      const existingResponsavel = await executeQuery({
        query: 'SELECT id FROM u711845530_gestao.responsaveis WHERE email = ? LIMIT 1',
        values: [email]
      }) as { id: number }[];

      let responsavelId;

      if (existingResponsavel.length > 0) {
        responsavelId = existingResponsavel[0].id;
      } else {
        // Se não existe, cria um novo
        const newResponsavel = await executeQuery({
          query: 'INSERT INTO u711845530_gestao.responsaveis (email) VALUES (?)',
          values: [email]
        }) as QueryResult;
        responsavelId = newResponsavel.insertId;
      }

      // Criar o relacionamento na tabela atividades_responsaveis
      await executeQuery({
        query: 'INSERT INTO u711845530_gestao.atividades_responsaveis (atividade_id, responsavel_id) VALUES (?, ?)',
        values: [atividadeId, responsavelId]
      });
    }

    // Buscar dados atualizados
    const atividades = await executeQuery({
      query: `
        SELECT 
          a.*,
          p.nome as projeto_nome, 
          s.sigla as setor_sigla,
          COALESCE(
            CONCAT('[', 
              GROUP_CONCAT(
                CASE 
                  WHEN ar.responsavel_id IS NOT NULL 
                  THEN JSON_OBJECT('id', ar.responsavel_id, 'email', r.email)
                  ELSE NULL 
                END
              ),
            ']'),
            '[]'
          ) as responsaveis
        FROM u711845530_gestao.atividades a
        LEFT JOIN u711845530_gestao.atividades_responsaveis ar ON a.id = ar.atividade_id
        LEFT JOIN u711845530_gestao.responsaveis r ON ar.responsavel_id = r.id
        LEFT JOIN u711845530_gestao.projetos p ON a.projeto_id = p.id
        LEFT JOIN u711845530_gestao.setor s ON a.setor_id = s.id
        ${!isAdmin && setorSigla ? 'WHERE s.sigla = ?' : ''}
        GROUP BY a.id, a.titulo, a.descricao, a.projeto_id, a.data_inicio, a.data_fim, 
                a.status_id, a.prioridade_id, a.estimativa_horas, a.data_criacao,
                a.id_release, a.position, a.ultima_atualizacao, a.setor_id,
                p.nome, s.sigla
        ORDER BY a.id DESC
      `,
      values: !isAdmin && setorSigla ? [setorSigla] : [],
    }) as Atividade[];

    // Processar os responsáveis
    const atividadesProcessadas = atividades.map(atividade => {
      let responsaveis = [];
      if (atividade.responsaveis && typeof atividade.responsaveis === 'string') {
        try {
          responsaveis = JSON.parse(atividade.responsaveis);
          // Filtrar responsáveis inválidos
          responsaveis = responsaveis.filter((r: ResponsavelParcial) => r && r.id && r.email);
        } catch (e) {
          console.error('Erro ao processar responsáveis:', e);
        }
      }
      return {
        ...atividade,
        responsaveis
      };
    });

    // Buscar informações dos responsáveis da API do RM
    const responsaveisInfo = new Map<string, { nome: string; cargo: string }>();
    for (const atividade of atividadesProcessadas) {
      for (const responsavel of atividade.responsaveis) {
        if (responsavel.email && !responsaveisInfo.has(responsavel.email)) {
          const userInfo = await getUserInfo(responsavel.email);
          if (userInfo) {
            responsaveisInfo.set(responsavel.email, {
              nome: userInfo.nome,
              cargo: userInfo.cargo
            });
          }
        }
      }
    }

    // Adicionar informações dos responsáveis às atividades
    const atividadesComResponsaveis = atividadesProcessadas.map(atividade => ({
      ...atividade,
      responsaveis: atividade.responsaveis.map((resp: Responsavel) => ({
        ...resp,
        nome: responsaveisInfo.get(resp.email)?.nome || 'Não atribuído',
        cargo: responsaveisInfo.get(resp.email)?.cargo || ''
      }))
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
        const userInfo = await getUserInfo(atividade.responsavel_email);
        if (userInfo) {
          responsaveisInfo.set(atividade.responsavel_email, {
            nome: userInfo.nome,
            cargo: userInfo.cargo
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