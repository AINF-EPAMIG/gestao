import { NextRequest } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Função para buscar tarefas
        const fetchTasks = async () => {
          const tasks = await executeQuery({
            query: `
              SELECT a.*, r.email as responsavel_email, s.nome as sistema_nome
              FROM u711845530_gestao.atividades a
              LEFT JOIN u711845530_gestao.responsaveis r ON a.responsavel_id = r.id
              LEFT JOIN u711845530_gestao.sistemas s ON a.sistema_id = s.id
              ORDER BY a.status_id, a.position
            `,
          });

          // Envia os dados para o cliente
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(tasks)}\n\n`));
        };

        // Busca inicial
        await fetchTasks();

        // Polling a cada 2 segundos
        const interval = setInterval(fetchTasks, 2000);

        // Limpa o intervalo quando a conexão é fechada
        request.signal.addEventListener('abort', () => {
          clearInterval(interval);
        });
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
} 