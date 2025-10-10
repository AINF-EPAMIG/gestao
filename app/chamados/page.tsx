"use client"

import { useSession } from "next-auth/react"
import { ChamadosBoard } from "@/components/chamados-board"
import AuthRequired from "@/components/auth-required"
import { Loader2 } from "lucide-react"
import { useChamadosStore } from "@/lib/chamados-store"
import { PollingWrapper } from "@/components/polling-wrapper"
import AuthenticatedLayout from "../authenticated-layout"
import { PageHeader } from "@/components/page-header"

export default function ChamadosPage() {
  const { data: session } = useSession()
  const chamados = useChamadosStore((state) => state.chamados)
  const isLoading = useChamadosStore((state) => state.isLoading)
  const updateChamadoPosition = useChamadosStore((state) => state.updateChamadoPosition)

  const handleChamadoMove = (chamadoId: number, newStatusId: number, origem: string, position: number) => {
    // Encontra o chamado atual para verificar se houve mudança de status
    const chamado = chamados.find(c => c.id === chamadoId && c.origem === origem);
    const isStatusChange = chamado && chamado.status_id !== newStatusId;

    // Prepara o userName se houver mudança de status e usuário logado
    let userName: string | undefined;
    if (isStatusChange && session?.user?.email) {
      const email = session.user.email;
      userName = email.includes('@') ? email : `${email}@epamig.br`;
    }

    // Atualiza a posição através da store (que agora gerencia a atribuição de responsável automaticamente)
    updateChamadoPosition(chamadoId, newStatusId, origem, position, userName);
  }

  return (
    <AuthRequired>
      <AuthenticatedLayout>
        <PollingWrapper>
          <div className="p-4 pt-10 lg:pt-6 max-w-[100vw] overflow-x-hidden">
            <PageHeader title="Chamadoss" />

            {isLoading && chamados.length === 0 ? (
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
      </AuthenticatedLayout>
    </AuthRequired>
  )
} 