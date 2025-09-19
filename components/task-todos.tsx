"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Plus, Trash2, Edit2, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { invalidateTaskEtapasCache } from "@/lib/etapas-utils"
import { useTaskStore } from "@/lib/store"

interface Etapa {
  id: number;
  atividade_id: number;
  titulo: string;
  descricao: string | null;
  concluido: boolean;
  ordem: number;
  data_criacao: string;
  data_conclusao: string | null;
  criado_por: string;
}

interface TaskTodosProps {
  taskId: number;
}

interface UpdateEtapaData {
  titulo: string;
  descricao?: string;
  data_conclusao?: string;
}

export function TaskTodos({ taskId }: TaskTodosProps) {
  const [todos, setTodos] = useState<Etapa[]>([])
  const [loading, setLoading] = useState(true)
  const [newTodoTitle, setNewTodoTitle] = useState("")
  const [newTodoDescription, setNewTodoDescription] = useState("")
  const [editingTodo, setEditingTodo] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editDataConclusao, setEditDataConclusao] = useState("")
  const [isAddingTodo, setIsAddingTodo] = useState(false)
  const [deletingTodo, setDeletingTodo] = useState<number | null>(null)
  
  // Hook para atualizar timestamp da task
  const updateTaskTimestamp = useTaskStore((state) => state.updateTaskTimestamp)
  
  // Função para invalidar cache e atualizar timestamp
  const invalidateCacheAndUpdateTimestamp = useCallback(() => {
    invalidateTaskEtapasCache(taskId)
    updateTaskTimestamp(taskId)
  }, [taskId, updateTaskTimestamp])

  // Buscar Etapas da tarefa
  const fetchTodos = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/atividades/${taskId}/todos`)
      if (response.ok) {
        const data = await response.json()
        setTodos(data)
      }
    } catch (error) {
      console.error('Erro ao buscar Etapas:', error)
    } finally {
      setLoading(false)
    }
  }, [taskId])

  useEffect(() => {
    fetchTodos()
  }, [fetchTodos])

  // Adicionar nova Etapa
  const handleAddTodo = async () => {
    if (!newTodoTitle.trim()) return

    try {
      const response = await fetch(`/api/atividades/${taskId}/todos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          titulo: newTodoTitle.trim(),
          descricao: newTodoDescription.trim() || undefined
        })
      })

      if (response.ok) {
        const novaEtapa = await response.json()
        setTodos(prev => [...prev, novaEtapa])
        setNewTodoTitle("")
        setNewTodoDescription("")
        setIsAddingTodo(false)
        // Invalidar cache e atualizar timestamp da atividade pai
        invalidateCacheAndUpdateTimestamp()
      }
    } catch (error) {
      console.error('Erro ao adicionar Etapa:', error)
    }
  }

  // Marcar/desmarcar Etapa como concluída
  const handleToggleTodo = async (todoId: number, concluido: boolean) => {
    try {
      const response = await fetch(`/api/atividades/${taskId}/todos?todoId=${todoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ concluido })
      })

      if (response.ok) {
        const etapaAtualizada = await response.json()
        setTodos(prev => prev.map(todo => 
          todo.id === todoId ? etapaAtualizada : todo
        ))
        // Invalidar cache e atualizar timestamp da atividade pai
        invalidateCacheAndUpdateTimestamp()
      }
    } catch (error) {
      console.error('Erro ao atualizar Etapa:', error)
    }
  }

  // Editar Etapa
  const handleEditTodo = async (todoId: number) => {
    if (!editTitle.trim()) return

    try {
      const updateData: UpdateEtapaData = {
        titulo: editTitle.trim(),
        descricao: editDescription.trim() || undefined
      }

      // Incluir data de conclusão se fornecida
      if (editDataConclusao) {
        updateData.data_conclusao = editDataConclusao
      }

      const response = await fetch(`/api/atividades/${taskId}/todos?todoId=${todoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        const etapaAtualizada = await response.json()
        setTodos(prev => prev.map(todo => 
          todo.id === todoId ? etapaAtualizada : todo
        ))
        setEditingTodo(null)
        setEditTitle("")
        setEditDescription("")
        setEditDataConclusao("")
        // Invalidar cache e atualizar timestamp da atividade pai
        invalidateCacheAndUpdateTimestamp()
      }
    } catch (error) {
      console.error('Erro ao editar Etapa:', error)
    }
  }

  // Deletar Etapa
  const handleDeleteTodo = async (todoId: number) => {
    try {
      setDeletingTodo(todoId)
      const response = await fetch(`/api/atividades/${taskId}/todos?todoId=${todoId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setTodos(prev => prev.filter(etapa => etapa.id !== todoId))
        // Invalidar cache e atualizar timestamp da atividade pai
        invalidateCacheAndUpdateTimestamp()
      }
    } catch (error) {
      console.error('Erro ao deletar Etapa:', error)
    } finally {
      setDeletingTodo(null)
    }
  }

  // Iniciar edição
  const startEditing = (todo: Etapa) => {
    setEditingTodo(todo.id)
    setEditTitle(todo.titulo)
    setEditDescription(todo.descricao || "")
    // Formatar data para input date (YYYY-MM-DD)
    if (todo.data_conclusao) {
      const date = new Date(todo.data_conclusao)
      const formattedDate = date.toISOString().split('T')[0]
      setEditDataConclusao(formattedDate)
    } else {
      setEditDataConclusao("")
    }
  }

  // Cancelar edição
  const cancelEditing = () => {
    setEditingTodo(null)
    setEditTitle("")
    setEditDescription("")
    setEditDataConclusao("")
  }

  // Calcular progresso
  const totalTodos = todos.length
  const completedTodos = todos.filter(todo => todo.concluido).length
  const progressPercentage = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0

  if (loading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Carregando Etapas...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header com progresso */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Lista de Etapas</h3>
          <Badge variant="outline" className={cn(
            "text-sm",
            progressPercentage === 100 ? "bg-green-50 text-green-600 border-green-200" : 
            progressPercentage > 50 ? "bg-blue-50 text-blue-600 border-blue-200" :
            "bg-gray-50 text-gray-600 border-gray-200"
          )}>
            {completedTodos}/{totalTodos} concluídos ({progressPercentage}%)
          </Badge>
        </div>
        
        {/* Barra de progresso */}
        {totalTodos > 0 ? (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                progressPercentage === 100 ? "bg-green-500" :
                progressPercentage > 50 ? "bg-blue-500" : "bg-gray-400"
              )}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        ) : null}
      </div>

       {/* Lista de Etapas */}
       <div className="space-y-2 max-h-40 sm:max-h-24 md:max-h-32 lg:max-h-36 xl:max-h-40 2xl:max-h-44 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400 scrollbar-track-transparent">
        {todos.map((todo) => (
          <Card key={todo.id} className={cn(
            "transition-all duration-200",
            todo.concluido ? "bg-gray-50 border-gray-200" : "bg-white border-gray-200 hover:border-gray-300"
          )}>
            <CardContent className="p-3">
              {editingTodo === todo.id ? (
                // Modo de edição
                <div className="space-y-2">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Título da Etapa"
                    className="text-sm"
                  />
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Descrição (opcional)"
                    className="text-sm min-h-[60px]"
                  />
                  {todo.concluido ? (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Data de Conclusão
                      </label>
                      <Input
                        type="date"
                        value={editDataConclusao}
                        onChange={(e) => setEditDataConclusao(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  ) : null}
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={cancelEditing}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleEditTodo(todo.id)}
                      disabled={!editTitle.trim()}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                // Modo de visualização
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={todo.concluido}
                    onCheckedChange={(checked: boolean) => 
                      handleToggleTodo(todo.id, checked)
                    }
                    className="mt-0.5"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className={cn(
                      "text-sm font-medium",
                      todo.concluido && "line-through text-muted-foreground"
                    )}>
                      {todo.titulo}
                    </div>
                    {todo.descricao ? (
                      <div className={cn(
                        "text-xs text-muted-foreground mt-1",
                        todo.concluido && "line-through"
                      )}>
                        {todo.descricao}
                      </div>
                    ) : null}
                    {todo.data_conclusao ? (
                      <div className="text-xs text-green-600 mt-1">
                        Concluído em {new Date(todo.data_conclusao).toLocaleDateString('pt-BR')}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEditing(todo)}
                      className="h-6 w-6 p-0"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                          disabled={deletingTodo === todo.id}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir a Etapa &ldquo;{todo.titulo}&rdquo;? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={deletingTodo === todo.id}>
                            Cancelar
                          </AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteTodo(todo.id)} 
                            className="bg-red-500 hover:bg-red-600 text-white"
                            disabled={deletingTodo === todo.id}
                          >
                            {deletingTodo === todo.id ? "Excluindo..." : "Excluir"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {todos.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            <div className="text-sm">Nenhuma Etapa adicionada ainda</div>
            <div className="text-xs mt-1">Clique no botão abaixo para adicionar a primeira</div>
          </div>
        ) : null}
      </div>

      {/* Formulário para adicionar nova Etapa */}
      {isAddingTodo ? (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="p-3 space-y-2">
            <Input
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
              placeholder="Título da Etapa"
              className="text-sm"
              autoFocus
            />
            <Textarea
              value={newTodoDescription}
              onChange={(e) => setNewTodoDescription(e.target.value)}
              placeholder="Descrição (opcional)"
              className="text-sm min-h-[60px]"
            />
            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsAddingTodo(false)
                  setNewTodoTitle("")
                  setNewTodoDescription("")
                }}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleAddTodo}
                disabled={!newTodoTitle.trim()}
              >
                Adicionar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          variant="outline"
          className="w-full border-dashed border-2 border-gray-300 hover:border-gray-400"
          onClick={() => setIsAddingTodo(true)}
        >
                          <Plus className="h-4 w-4 mr-2" />
                Adicionar Etapa
        </Button>
      )}
    </div>
  )
}
