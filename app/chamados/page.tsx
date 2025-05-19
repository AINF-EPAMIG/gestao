"use client"

import { useSession } from "next-auth/react"
import { ChamadosBoard } from "@/components/chamados-board"
import AuthRequired from "@/components/auth-required"
import { Loader2 } from "lucide-react"
import { useChamadosStore } from "@/lib/chamados-store"
import { PollingWrapper } from "@/components/polling-wrapper"
import { useAuthorizedAccess } from "@/lib/hooks/use-authorized-access"
import EmDesenvolvimento from "@/app/components/EmDesenvolvimento"

export default function ChamadosPage() {
  const { data: session } = useSession()
  const chamados = useChamadosStore((state) => state.chamados)
  const isLoading = useChamadosStore((state) => state.isLoading)
  const updateChamadoPosition = useChamadosStore((state) => state.updateChamadoPosition)
  const { isAuthorized, isLoading: isAuthLoading } = useAuthorizedAccess()

  const handleChamadoMove = (chamadoId: number, newStatusId: number, origem: string, position: number) => {
    // Encontra o chamado atual para verificar se houve mudança de status
    const chamado = chamados.find(c => c.id === chamadoId && c.origem === origem);
    const isStatusChange = chamado && chamado.status_id !== newStatusId;

    // Atribui o técnico responsável apenas se houver mudança de status E não tiver responsável definido
    if (isStatusChange && session?.user?.email && !chamado?.tecnico_responsavel) {
      // Garantir que o email tenha o domínio @epamig.br
      const email = session.user.email;
      const userName = email.includes('@') ? email : `${email}@epamig.br`;
      
      // Atualiza o tecnico_responsavel no backend (apenas durante a chamada API, não no estado local)
      fetch('/api/chamados/assign', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chamadoId,
          origem,
          userName,
        }),
      }).catch(error => {
        console.error('Erro ao atribuir técnico responsável:', error);
      });
    }

    // Atualiza a posição através da store
    updateChamadoPosition(chamadoId, newStatusId, origem, position);
  }

  return (
    <AuthRequired>
      {!isAuthorized ? (
        <EmDesenvolvimento />
      ) : (
        <PollingWrapper>
          <div className="p-4 pt-10 lg:pt-6 max-w-[100vw] overflow-x-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Chamados</h1>
            </div>

            {(isLoading || isAuthLoading) && chamados.length === 0 ? (
              <div className="flex items-center justify-center min-h-[500px] w-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : chamados.length === 0 ? (
              <div className="flex items-center justify-center min-h-[500px] w-full">
                <span className="text-gray-500 text-lg">Nenhum chamado encontrado</span>
              </div>
            ) : (
              <div className="overflow-x-auto md:overflow-x-hidden w-full">
                <ChamadosBoard 
                  chamados={chamados} 
                  onChamadoMove={handleChamadoMove}
                />
              </div>
            )}
          </div>
        </PollingWrapper>
      )}
    </AuthRequired>
  )
} 