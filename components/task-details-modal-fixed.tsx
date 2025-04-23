"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Trash, Edit2, X, Check, Send, Loader2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { useTaskStore, getPriorityName, getStatusName, formatHours } from "@/lib/store"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSession } from "next-auth/react"
import { getUserInfoFromRM, isUserChefe, isUserAdmin, getResponsaveisBySetor } from "@/lib/rm-service"
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

interface Projeto {
  id: number;
  nome: string;
}

interface Comentario {
  id: number;
  atividade_id: number;
  usuario_email: string;
  usuario_nome: string | null;
  comentario: string;
  data_criacao: string;
  data_edicao: string | null;
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
  const { data: session } = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const [canEdit, setCanEdit] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isFading, setIsFading] = useState(false)
  const [showLoading, setShowLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  // Estado local para armazenar a tarefa em edição
  const [localTask, setLocalTask] = useState<Task>(task)
  const [titulo, setTitulo] = useState(task.titulo)
  const [descricao, setDescricao] = useState(task.descricao || "")
  const [prioridade, setPrioridade] = useState(task.prioridade_id.toString())
  const [estimativaHoras, setEstimativaHoras] = useState(task.estimativa_horas || "")
  const [dataInicio, setDataInicio] = useState(task.data_inicio ? new Date(task.data_inicio).toISOString().split('T')[0] : "")
  const [dataFim, setDataFim] = useState(task.data_fim ? new Date(task.data_fim).toISOString().split('T')[0] : "")
  const [responsavelInput, setResponsavelInput] = useState("")
  const [selectedResponsaveis, setSelectedResponsaveis] = useState<Responsavel[]>([])
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([])
  const [showResponsavelSuggestions, setShowResponsavelSuggestions] = useState(false)
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [projetoId, setProjetoId] = useState(task.projeto_id?.toString() || "")
  const setTasks = useTaskStore((state) => state.setTasks)
  const updateTaskTimestamp = useTaskStore((state) => state.updateTaskTimestamp)
  const [comentario, setComentario] = useState("")
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [comentarioEditando, setComentarioEditando] = useState<number | null>(null)
  const [textoEditando, setTextoEditando] = useState("")
  // Acesso ao contexto de polling
  const { pausePolling, resumePolling } = usePolling()
  // Definindo o limite máximo de caracteres
  const MAX_TITLE_LENGTH = 40
  const MAX_DESCRIPTION_LENGTH = 500
  const MAX_COMMENT_LENGTH = 200

  // ... [manter todas as funções existentes] ...

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      // Quando o modal for fechado, garantir que o polling seja retomado
      if (!newOpen && isEditing) {
        setIsEditing(false);
        resumePolling();
      }
      onOpenChange(newOpen);
    }}>
      <DialogContent className={cn(
        "sm:max-w-[600px] h-[85vh] p-0 flex flex-col overflow-hidden",
        (isFading || isSaving) && "opacity-50 pointer-events-none transition-opacity duration-[2000ms]",
        "[&>button]:hidden" // Oculta o botão de fechar padrão do DialogContent
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
                setLocalTask(task);
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
                      // Restaurar os dados originais da tarefa
                      setLocalTask(task);
                      setTitulo(task.titulo);
                      setDescricao(task.descricao || "");
                      setPrioridade(task.prioridade_id.toString());
                      setEstimativaHoras(task.estimativa_horas || "");
                      setDataInicio(task.data_inicio ? new Date(task.data_inicio).toISOString().split('T')[0] : "");
                      setDataFim(task.data_fim ? new Date(task.data_fim).toISOString().split('T')[0] : "");
                      setProjetoId(task.projeto_id?.toString() || "");
                      setSelectedResponsaveis(
                        task.responsaveis?.map(r => ({
                          EMAIL: r.email,
                          NOME: r.nome || r.email.split('@')[0],
                          CARGO: r.cargo
                        })) || []
                      );
                      // Retomar o polling
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
          
          <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300 scrollbar-track-transparent">
            <div className="p-4 flex flex-col h-full">
              <TabsContent value="detalhes" className="flex flex-col h-full">
                {/* Resto do conteúdo do componente... */}
              </TabsContent>
              <TabsContent value="anexos" className="space-y-3 py-3">
                <TaskAttachments 
                  taskId={task.id} 
                  canEdit={canEdit}
                />
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
} 