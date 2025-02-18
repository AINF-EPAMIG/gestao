"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTaskStore } from "@/lib/store"
import { useSession } from "next-auth/react"

interface Projeto {
  id: number
  nome: string
}

interface Responsavel {
  email: string;
  nome: string;
}

export function CreateTaskModal() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [titulo, setTitulo] = useState("")
  const [descricao, setDescricao] = useState("")
  const [projetoId, setProjetoId] = useState<string>("")
  const [responsavelEmail, setResponsavelEmail] = useState("")
  const [prioridade, setPrioridade] = useState("2") // Média como padrão
  const [estimativaHoras, setEstimativaHoras] = useState("")
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0])
  const [dataFim, setDataFim] = useState("")
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([])
  const setTasks = useTaskStore((state) => state.setTasks)
  const [projetoInput, setProjetoInput] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    // Carregar projetos do banco
    const fetchProjetos = async () => {
      try {
        const response = await fetch('/api/projetos')
        if (response.ok) {
          const data = await response.json()
          setProjetos(data)
        }
      } catch (error) {
        console.error('Erro ao carregar projetos:', error)
      }
    }

    // Carregar responsáveis do banco
    const fetchResponsaveis = async () => {
      try {
        const response = await fetch('/api/responsaveis')
        if (response.ok) {
          const data = await response.json()
          setResponsaveis(data)
        }
      } catch (error) {
        console.error('Erro ao carregar responsáveis:', error)
      }
    }

    fetchProjetos()
    fetchResponsaveis()
    
    // Preencher email do usuário logado
    if (session?.user?.email) {
      setResponsavelEmail(session.user.email)
    }
  }, [session?.user?.email])

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
          projeto_id: parseInt(projetoId),
          responsavel_email: responsavelEmail,
          data_inicio: dataInicio,
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
        setProjetoId("")
        setPrioridade("2")
        setEstimativaHoras("")
        setDataFim("")
      }
    } catch (error) {
      console.error('Erro ao criar tarefa:', error)
    }
  }

  const handleProjetoSelect = (projeto: Projeto) => {
    setProjetoId(projeto.id.toString())
    setProjetoInput(projeto.nome)
    setShowSuggestions(false)
  }

  const handleCreateNewProjeto = async (nome: string) => {
    try {
      const nomeCapitalizado = nome.charAt(0).toUpperCase() + nome.slice(1);
      
      const response = await fetch('/api/projetos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nomeCapitalizado })
      })

      if (response.ok) {
        const novoProjeto = await response.json()
        setProjetos(prev => [...prev, novoProjeto])
        setProjetoId(novoProjeto.id.toString())
        setProjetoInput(novoProjeto.nome)
        setShowSuggestions(false)
      }
    } catch (error) {
      console.error('Erro ao criar projeto:', error)
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
            <label className="text-sm font-medium">Projeto</label>
            <div className="relative">
              <Input
                ref={inputRef}
                value={projetoInput}
                onChange={(e) => {
                  setProjetoInput(e.target.value)
                  setShowSuggestions(true)
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Digite o nome do projeto"
                className="w-full"
              />
              {showSuggestions && projetoInput && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
                  {projetos
                    .filter(p => p.nome.toLowerCase().includes(projetoInput.toLowerCase()))
                    .map(projeto => (
                      <div
                        key={projeto.id}
                        className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                        onClick={() => handleProjetoSelect(projeto)}
                      >
                        {projeto.nome}
                      </div>
                    ))}
                  {!projetos.some(p => p.nome.toLowerCase() === projetoInput.toLowerCase()) && (
                    <div
                      className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-emerald-600"
                      onClick={() => handleCreateNewProjeto(projetoInput)}
                    >
                      + Criar &quot;{projetoInput}&quot;
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Responsável</label>
            <Select value={responsavelEmail} onValueChange={setResponsavelEmail}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um responsável" />
              </SelectTrigger>
              <SelectContent position="item-aligned" side="bottom" align="start">
                {responsaveis.map((resp) => (
                  <SelectItem key={resp.email} value={resp.email}>
                    {resp.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Prioridade</label>
              <Select value={prioridade} onValueChange={setPrioridade}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a prioridade" />
                </SelectTrigger>
                <SelectContent position="item-aligned" side="bottom" align="start">
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
                placeholder="Ex: 8"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Data de Início</label>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Data de Fim Prevista</label>
              <Input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
          </div>

          <Button type="submit" className="w-full bg-emerald-800 text-white hover:bg-emerald-700">
            Criar Tarefa
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
} 