"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTaskStore } from "@/lib/store"
import { useSession } from "next-auth/react"

interface Sistema {
  id: number
  nome: string
}

export function CreateTaskModal() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [titulo, setTitulo] = useState("")
  const [descricao, setDescricao] = useState("")
  const [sistemaId, setSistemaId] = useState<string>("")
  const [prioridade, setPrioridade] = useState("2") // Média como padrão
  const [estimativaHoras, setEstimativaHoras] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [sistemas, setSistemas] = useState<Sistema[]>([])
  const setTasks = useTaskStore((state) => state.setTasks)

  const dataAtual = new Date().toLocaleDateString('pt-BR')
  const dataAtualISO = new Date().toISOString().split('T')[0]

  useEffect(() => {
    // Carregar sistemas do banco
    const fetchSistemas = async () => {
      try {
        const response = await fetch('/api/sistemas')
        if (response.ok) {
          const data = await response.json()
          setSistemas(data)
        }
      } catch (error) {
        console.error('Erro ao carregar sistemas:', error)
      }
    }

    fetchSistemas()
  }, [])

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
          sistema_id: parseInt(sistemaId),
          responsavel_email: session?.user?.email,
          data_inicio: dataAtualISO,
          data_fim: dataFim,
          status_id: 1, // Não iniciada
          prioridade_id: parseInt(prioridade),
          estimativa_horas: estimativaHoras,
        }),
      })

      if (response.ok) {
        const updatedTasks = await response.json()
        setTasks(updatedTasks)
        setOpen(false)
        // Resetar campos
        setTitulo("")
        setDescricao("")
        setSistemaId("")
        setPrioridade("2")
        setEstimativaHoras("")
        setDataFim("")
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
            <label className="text-sm font-medium">Título *</label>
            <Input
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Digite o título da tarefa"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Descrição</label>
            <Textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Digite a descrição da tarefa"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Sistema *</label>
            <Select required value={sistemaId} onValueChange={setSistemaId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um sistema" />
              </SelectTrigger>
              <SelectContent>
                {sistemas.map((sistema) => (
                  <SelectItem key={sistema.id} value={sistema.id.toString()}>
                    {sistema.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Responsável</label>
            <Input
              disabled
              value={session?.user?.email || ""}
              placeholder="Email do responsável"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Prioridade</label>
            <Select value={prioridade} onValueChange={setPrioridade}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Alta</SelectItem>
                <SelectItem value="2">Média</SelectItem>
                <SelectItem value="3">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Estimativa (horas)</label>
            <Input
              type="number"
              step="0.1"
              value={estimativaHoras}
              onChange={(e) => setEstimativaHoras(e.target.value)}
              placeholder="Ex: 8.5"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Data de Início</label>
            <Input disabled value={dataAtual} />
          </div>

          <div>
            <label className="text-sm font-medium">Data de Fim Prevista</label>
            <Input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
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