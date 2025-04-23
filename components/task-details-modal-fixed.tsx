"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Edit2, X, Check, Loader2 } from "lucide-react"
import { TaskAttachments } from "./task-attachments"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { usePolling } from "./polling-wrapper"

interface TaskResponsavel {
  id: number;
  email: string;
  nome?: string;
  cargo?: string;
}

interface Responsavel {
  EMAIL: string;
  NOME: string;
  CARGO?: string;
}

interface Task {
  id: number;
  titulo: string;
  descricao: string;
  projeto_id: number;
  projeto_nome?: string;
  status_id: number;
  prioridade_id: number;
  estimativa_horas: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  id_release: string | null;
  ultima_atualizacao: string | null;
  responsaveis?: TaskResponsavel[];
}

interface TaskDetailsModalProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailsModal({ task, open, onOpenChange }: TaskDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [canEdit] = useState(false)
  const [isDeleting] = useState(false)
  const [isFading] = useState(false)
  const [showLoading] = useState(false)
  const [isSaving] = useState(false)
  
  const [selectedResponsaveis, setSelectedResponsaveis] = useState<Responsavel[]>([])
  
  const { resumePolling } = usePolling()
  
  const handleDelete = () => {
    // Implementação da função de exclusão
  }
  
  const handleSubmit = () => {
    // Implementação da função de envio
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen && isEditing) {
        setIsEditing(false);
        resumePolling();
      }
      onOpenChange(newOpen);
    }}>
      <DialogContent className={cn(
        "sm:max-w-[600px] h-[85vh] p-0 flex flex-col overflow-hidden",
        (isFading || isSaving) && "opacity-50 pointer-events-none transition-opacity duration-[2000ms]",
        "[&>button]:hidden"
      )}>
        {showLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-50">
            <div className="p-3 rounded-full">
              <Loader2 className="h-8 w-8 animate-spin text-[#2E7D32]" />
            </div>
          </div>
        )}
        
        <div className="absolute top-3 right-4 flex items-center gap-2 z-10">
          <Button 
            type="button"
            variant="ghost"
            className="h-3.5 w-3.5 p-0 rounded-full bg-red-500 hover:bg-red-600 hover:scale-110 transition-transform border-0"
            onClick={() => onOpenChange(false)}
            title="Fechar"
          />
          <Button 
            type="button"
            variant="ghost"
            className="h-3.5 w-3.5 p-0 rounded-full bg-yellow-400 hover:bg-yellow-500 hover:scale-110 transition-transform border-0"
            onClick={() => {
              if (canEdit && !isEditing) {
                setIsEditing(true);
              }
            }}
            disabled={!canEdit || isEditing}
            title="Editar tarefa"
          />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                type="button"
                variant="ghost"
                className="h-3.5 w-3.5 p-0 rounded-full bg-green-500 hover:bg-green-600 hover:scale-110 transition-transform border-0"
                disabled={!canEdit || isEditing}
                title="Excluir tarefa"
              />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso excluirá permanentemente a tarefa.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDelete} 
                  className="bg-red-500 hover:bg-red-600 text-white"
                  disabled={isDeleting}
                >
                  {isDeleting ? "Excluindo..." : "Excluir"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        
        <Tabs defaultValue="detalhes" className="flex flex-col h-full">
          <DialogHeader className="px-6 py-3 border-b shrink-0">
            <DialogTitle className="sr-only">Detalhes da Tarefa</DialogTitle>
            <div className="flex items-center justify-between">
              <TabsList className="grid w-[200px] grid-cols-2">
                <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
                <TabsTrigger value="anexos">Anexos</TabsTrigger>
              </TabsList>
              
              {canEdit && !isEditing && (
                <div className="invisible">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-9 w-9 p-0"
                  >
                    <Edit2 className="h-[18px] w-[18px] text-gray-500" />
                  </Button>
                </div>
              )}
              
              {isEditing && (
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    onClick={handleSubmit}
                    disabled={isSaving || selectedResponsaveis.length === 0}
                    className="h-9 w-9 p-0 bg-green-600 hover:bg-green-500 text-white"
                  >
                    {isSaving ? (
                      <Loader2 className="h-[18px] w-[18px] animate-spin" />
                    ) : (
                      <Check className="h-[18px] w-[18px]" />
                    )}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      setIsEditing(false);
                      setSelectedResponsaveis(
                        task.responsaveis?.map(r => ({
                          EMAIL: r.email,
                          NOME: r.nome || r.email.split('@')[0],
                          CARGO: r.cargo
                        })) || []
                      );
                      resumePolling();
                    }}
                    disabled={isSaving}
                    className="h-9 w-9 p-0"
                  >
                    <X className="h-[18px] w-[18px]" />
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>
          
          <TabsContent value="detalhes" className="flex-1 overflow-auto p-6">
            {/* Conteúdo da aba de detalhes */}
          </TabsContent>
          
          <TabsContent value="anexos" className="flex-1 overflow-auto p-6">
            <TaskAttachments taskId={task.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
} 