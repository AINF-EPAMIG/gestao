"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getStatusName, getPriorityName, formatHours } from "@/lib/store"
import { getUserIcon } from "@/lib/utils"
import type { Task } from "@/lib/store"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { useTaskStore } from "@/lib/store"

interface TaskDetailsModalProps {
  task: Task
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaskDetailsModal({ task, open, onOpenChange }: TaskDetailsModalProps) {
  const formatDate = (date: string | null) => {
    if (!date) return "-"
    return new Date(date).toLocaleDateString('pt-BR')
  }

  const getResponsavelName = (email?: string): string => {
    if (!email) return "Não atribuído"
    return email.split('@')[0].replace('.', ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const formatDateTime = (dateTime: string | null) => {
    if (!dateTime) return '-';
    
    const date = new Date(dateTime);
    
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC'
    });
  };

  const deleteTask = useTaskStore((state) => state.deleteTask)

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/atividades?id=${task.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir tarefa');
      }

      await deleteTask(task.id);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
      // Aqui você pode adicionar uma notificação de erro se desejar
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Detalhes da Tarefa</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Cabeçalho com Badges */}
          <div className="flex items-center justify-between">
            <Badge
              className={
                getPriorityName(task.prioridade_id) === "Alta"
                  ? "bg-red-500"
                  : getPriorityName(task.prioridade_id) === "Média"
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }
            >
              {getPriorityName(task.prioridade_id)}
            </Badge>
            <Badge variant="outline">
              {task.projeto_nome || (!task.projeto_id ? "Projeto Indefinido" : `Projeto ${task.projeto_id}`)}
            </Badge>
          </div>

          {/* ID e Título */}
          <div>
            <div className="text-sm text-gray-500">ID</div>
            <div className="font-medium">{task.id}</div>
          </div>

          <div>
            <div className="text-sm text-gray-500">Título</div>
            <div className="font-medium">{task.titulo}</div>
          </div>

          {/* Descrição */}
          <div>
            <div className="text-sm text-gray-500">Descrição</div>
            <div className="text-sm mt-1">{task.descricao || "-"}</div>
          </div>

          {/* Status */}
          <div>
            <div className="text-sm text-gray-500">Status</div>
            <Badge 
              className={
                getStatusName(task.status_id) === "Concluída"
                  ? "bg-emerald-500"
                  : getStatusName(task.status_id) === "Em desenvolvimento"
                  ? "bg-blue-500"
                  : getStatusName(task.status_id) === "Em testes"
                  ? "bg-amber-500"
                  : "bg-orange-500"
              }
            >
              {getStatusName(task.status_id)}
            </Badge>
          </div>

          {/* Responsável */}
          <div>
            <div className="text-sm text-gray-500">Responsável</div>
            <div className="flex items-center gap-2 mt-1">
              <Avatar className="w-6 h-6">
                <AvatarImage src={getUserIcon(task.responsavel_email)} />
                <AvatarFallback>
                  {task.responsavel_email ? task.responsavel_email[0].toUpperCase() : '?'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">
                {getResponsavelName(task.responsavel_email)}
              </span>
            </div>
          </div>

          {/* Datas e Estimativa */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-500">Data de Início</div>
              <div className="text-sm">{formatDate(task.data_inicio)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Data de Fim</div>
              <div className="text-sm">{formatDate(task.data_fim)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Estimativa</div>
              <div className="text-sm">{formatHours(task.estimativa_horas)}</div>
            </div>
          </div>

          {/* ID Release */}
          <div>
            <div className="text-sm text-gray-500">ID Release</div>
            <div className="text-sm">{task.id_release || "-"}</div>
          </div>

          {/* Última Atualização */}
          <div>
            <div className="text-sm text-gray-500">Última Atualização</div>
            <div className="text-sm">
              {task.ultima_atualizacao 
                ? formatDateTime(task.ultima_atualizacao)
                : '-'}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Excluir Tarefa
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso excluirá permanentemente a tarefa.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DialogContent>
    </Dialog>
  )
} 