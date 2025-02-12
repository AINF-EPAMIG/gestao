"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useTaskStore } from "@/lib/store"

export function CreateTaskModal() {
  const [open, setOpen] = useState(false)
  const [titulo, setTitulo] = useState("")
  const [descricao, setDescricao] = useState("")
  const setTasks = useTaskStore((state) => state.setTasks)

  const dataAtual = new Date().toLocaleDateString('pt-BR')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/atividades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          titulo,
          descricao,
          data_inicio: new Date().toISOString().split('T')[0],
          status_id: 1, // Não iniciada
          prioridade_id: 2, // Média
        }),
      })

      if (response.ok) {
        const updatedTasks = await response.json()
        setTasks(updatedTasks)
        setOpen(false)
        setTitulo("")
        setDescricao("")
      }
    } catch (error) {
      console.error('Erro ao criar tarefa:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-800 text-white hover:bg-emerald-700">
          Nova Tarefa
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Nova Tarefa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">
              Título *
            </label>
            <Input
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Digite o título da tarefa"
            />
          </div>
          <div>
            <label className="text-sm font-medium">
              Descrição
            </label>
            <Textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Digite a descrição da tarefa"
            />
          </div>
          <div>
            <label className="text-sm font-medium">
              Data de Início
            </label>
            <Input
              disabled
              value={dataAtual}
            />
          </div>
          <Button type="submit" className="w-full bg-emerald-800 text-white hover:bg-emerald-700">
            Criar Tarefa
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
} 