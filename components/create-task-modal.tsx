"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTaskStore } from "@/lib/store"
import { useSession } from "next-auth/react"
import { getUserInfoFromRM, isUserChefe, isUserAdmin, getSubordinadosFromRM } from "@/lib/rm-service"

interface Projeto {
  id: number
  nome: string
}

interface Responsavel {
  email: string;
  nome: string;
  cargo?: string;
}

interface Setor {
  id: number;
  sigla: string;
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
  const [isChefe, setIsChefe] = useState<boolean>(false)
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [setores, setSetores] = useState<Setor[]>([])
  const [selectedSetor, setSelectedSetor] = useState<string>("")
  const setTasks = useTaskStore((state) => state.setTasks)
  const [projetoInput, setProjetoInput] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [responsavelInput, setResponsavelInput] = useState("")
  const [showResponsavelSuggestions, setShowResponsavelSuggestions] = useState(false)
  const [setorInput, setSetorInput] = useState("")
  const [showSetorSuggestions, setShowSetorSuggestions] = useState(false)
  const responsavelRef = useRef<HTMLInputElement>(null)
  const setorRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Verificar se o usuário é chefe ou admin
    const checkUserRole = async () => {
      if (session?.user?.email) {
        try {
          // Verificar se é admin
          const admin = isUserAdmin(session.user.email);
          setIsAdmin(admin);

          // Verificar se é chefe e buscar setor
          const userInfo = await getUserInfoFromRM(session.user.email);
          if (userInfo) {
            const isUserChefeResult = isUserChefe(userInfo);
            setIsChefe(isUserChefeResult);
            setSelectedSetor(userInfo.SECAO);
            setSetorInput(userInfo.SECAO);

            // Se for chefe, buscar subordinados
            if (isUserChefeResult) {
              const subordinadosData = await getSubordinadosFromRM(session.user.email);
              if (subordinadosData) {
                const formattedSubordinados = subordinadosData.map(sub => ({
                  email: sub.EMAIL_SUBORDINADO,
                  nome: sub.NOME_SUBORDINADO,
                  cargo: sub.CARGO_SUBORDINADO
                }));
                setResponsaveis(formattedSubordinados);
              }
            } else {
              // Se não for chefe, só pode atribuir para si mesmo
              setResponsaveis([{
                email: session.user.email,
                nome: userInfo.NOME_COMPLETO,
                cargo: userInfo.CARGO
              }]);
            }
          }

          // Se for admin, buscar lista de setores
          if (admin) {
            const response = await fetch('/api/setor');
            if (response.ok) {
              const data = await response.json();
              setSetores(data);
            }
          }
        } catch (error) {
          console.error('Erro ao verificar papel do usuário:', error);
        }
      }
    };

    checkUserRole();
  }, [session?.user?.email, setSelectedSetor]);

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

    fetchProjetos()
    
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
          userEmail: session?.user?.email,
          setorSigla: selectedSetor,
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
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao criar tarefa')
      }
    } catch (error) {
      console.error('Erro ao criar tarefa:', error)
      alert('Erro ao criar tarefa')
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

  const handleResponsavelSelect = (responsavel: Responsavel) => {
    setResponsavelEmail(responsavel.email)
    setResponsavelInput(`${responsavel.nome} (${responsavel.email})`)
    setShowResponsavelSuggestions(false)
  }

  const handleSetorSelect = (setor: Setor) => {
    setSelectedSetor(setor.sigla)
    setSetorInput(setor.sigla + (setor.nome ? ` ${setor.nome}` : ''))
    setShowSetorSuggestions(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className="bg-emerald-800 text-white hover:bg-emerald-700"
          disabled={!isChefe && !isAdmin}
          title={!isChefe && !isAdmin ? "Apenas chefes e administradores podem criar novas tarefas" : ""}
        >
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
            <div className="relative">
              <Input
                ref={responsavelRef}
                value={responsavelInput}
                onChange={(e) => {
                  setResponsavelInput(e.target.value)
                  setShowResponsavelSuggestions(true)
                }}
                onFocus={() => setShowResponsavelSuggestions(true)}
                placeholder="Digite o nome do responsável"
                className="w-full"
              />
              {showResponsavelSuggestions && responsavelInput && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-[200px] overflow-y-auto">
                  {responsaveis
                    .filter(r => r.nome.toLowerCase().includes(responsavelInput.toLowerCase()))
                    .map(responsavel => (
                      <div
                        key={responsavel.email}
                        className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                        onClick={() => handleResponsavelSelect(responsavel)}
                      >
                        <div>{responsavel.nome}</div>
                        <div className="text-sm text-gray-500">{responsavel.email}</div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Setor</label>
            {isAdmin ? (
              <div className="relative">
                <Input
                  ref={setorRef}
                  value={setorInput}
                  onChange={(e) => {
                    setSetorInput(e.target.value)
                    setShowSetorSuggestions(true)
                  }}
                  onFocus={() => setShowSetorSuggestions(true)}
                  placeholder="Digite o setor"
                  className="w-full"
                />
                {showSetorSuggestions && setorInput && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-[200px] overflow-y-auto">
                    {setores
                      .filter(s => 
                        s.sigla.toLowerCase().includes(setorInput.toLowerCase()) ||
                        (s.nome && s.nome.toLowerCase().includes(setorInput.toLowerCase()))
                      )
                      .map(setor => (
                        <div
                          key={setor.id}
                          className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSetorSelect(setor)}
                        >
                          {setor.sigla}{setor.nome ? ` ${setor.nome}` : ''}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ) : (
              <Input
                value={setorInput}
                disabled
                className="bg-gray-100"
              />
            )}
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