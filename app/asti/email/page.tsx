"use client"

import { useState, useEffect, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Loader2, Search, Users, ArrowUpDown, ArrowUp, ArrowDown, X } from "lucide-react"
import AuthRequired from "@/components/auth-required"
import AuthenticatedLayout from "../../authenticated-layout"
import { PageHeader } from "@/components/page-header"

interface Funcionario {
  chapa: string
  nome: string
  email: string
  setor: string
  regional: string
  cargo: string
}

type SortField = 'chapa' | 'nome' | 'email'
type SortOrder = 'asc' | 'desc' | null

export default function EmailPage() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Estados para filtros
  const [searchFilter, setSearchFilter] = useState("")
  const [setorFilter, setSetorFilter] = useState("todos")
  const [regionalFilter, setRegionalFilter] = useState("SEDE")
  const [cargoFilter, setCargoFilter] = useState("todos")

  // Estados para ordenação
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder>(null)

  // Estados para o modal de cargo
  const [isCargoModalOpen, setIsCargoModalOpen] = useState(false)
  const [cargoSearchQuery, setCargoSearchQuery] = useState("")

  // Carregar funcionários
  useEffect(() => {
    const fetchFuncionarios = async () => {
      setIsLoading(true)
      try {
        const res = await fetch('/api/funcionarios/list')
        const data = await res.json()
        setFuncionarios(data)
      } catch (error) {
        console.error('Erro ao carregar funcionários:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFuncionarios()
  }, [])

  // Extrair valores únicos para os filtros
  const uniqueSetores = useMemo(() => {
    const setores = new Set(funcionarios.map(f => f.setor).filter(Boolean))
    return Array.from(setores).sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }))
  }, [funcionarios])

  const uniqueRegionais = useMemo(() => {
    const regionais = new Set(funcionarios.map(f => f.regional).filter(Boolean))
    const regionaisArray = Array.from(regionais)
    // Separar SEDE do resto e ordenar
    const sede = regionaisArray.find(r => r === "SEDE")
    const outras = regionaisArray.filter(r => r !== "SEDE").sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }))
    return sede ? [sede, ...outras] : outras
  }, [funcionarios])

  const uniqueCargos = useMemo(() => {
    const cargos = new Set(funcionarios.map(f => f.cargo).filter(Boolean))
    return Array.from(cargos).sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }))
  }, [funcionarios])

  // Filtrar cargos com base na pesquisa do modal
  const filteredCargos = useMemo(() => {
    if (!cargoSearchQuery) return uniqueCargos
    return uniqueCargos.filter(cargo => 
      cargo.toLowerCase().includes(cargoSearchQuery.toLowerCase())
    )
  }, [uniqueCargos, cargoSearchQuery])

  // Função para limpar o filtro de cargo
  const clearCargoFilter = () => {
    setCargoFilter("todos")
  }

  // Função para selecionar um cargo
  const selectCargo = (cargo: string) => {
    setCargoFilter(cargo)
    setIsCargoModalOpen(false)
    setCargoSearchQuery("")
  }

  // Aplicar filtros
  const filteredFuncionarios = useMemo(() => {
    return funcionarios.filter(funcionario => {
      const searchLower = searchFilter.toLowerCase()
      const matchSearch = !searchFilter || 
        (funcionario.nome || '').toLowerCase().includes(searchLower) ||
        (funcionario.email || '').toLowerCase().includes(searchLower) ||
        (funcionario.chapa || '').toLowerCase().includes(searchLower)
      
      const matchSetor = setorFilter === "todos" || funcionario.setor === setorFilter
      const matchRegional = regionalFilter === "todos" || funcionario.regional === regionalFilter
      const matchCargo = cargoFilter === "todos" || funcionario.cargo === cargoFilter

      return matchSearch && matchSetor && matchRegional && matchCargo
    })
  }, [funcionarios, searchFilter, setorFilter, regionalFilter, cargoFilter])

  // Aplicar ordenação
  const sortedFuncionarios = useMemo(() => {
    if (!sortField || !sortOrder) return filteredFuncionarios

    // Helper para normalizar strings (case/acento-insensível)
    const norm = (v: string) => (v || "")
      .toString()
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')

    return [...filteredFuncionarios].sort((a, b) => {
      const aRaw = a[sortField] || ''
      const bRaw = b[sortField] || ''

      if (sortField === 'chapa') {
        // Comparação numérica robusta para strings numéricas com zeros à esquerda
        const aNum = Number(String(aRaw).replace(/[^0-9]/g, '')) || 0
        const bNum = Number(String(bRaw).replace(/[^0-9]/g, '')) || 0
        return sortOrder === 'asc' ? aNum - bNum : bNum - aNum
      }

      // Comparação alfabética case/acento-insensível para demais campos
      const aVal = norm(String(aRaw))
      const bVal = norm(String(bRaw))
      if (aVal === bVal) return 0
      if (sortOrder === 'asc') {
        return aVal < bVal ? 1 * -1 : 1
      } else {
        return aVal > bVal ? 1 * -1 : -1
      }
    })
  }, [filteredFuncionarios, sortField, sortOrder])

  // Função para lidar com cliques nos headers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Se já está ordenando por este campo, alterna a ordem
      if (sortOrder === 'asc') {
        setSortOrder('desc')
      } else if (sortOrder === 'desc') {
        setSortOrder(null)
        setSortField(null)
      }
    } else {
      // Se é um novo campo, inicia com ordem ascendente
      setSortField(field)
      setSortOrder('asc')
    }
  }

  // Função para obter o ícone de ordenação
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }
    if (sortOrder === 'asc') {
      return <ArrowUp className="ml-2 h-4 w-4" />
    }
    if (sortOrder === 'desc') {
      return <ArrowDown className="ml-2 h-4 w-4" />
    }
    return <ArrowUpDown className="ml-2 h-4 w-4" />
  }

  return (
    <AuthRequired>
      <AuthenticatedLayout>
        <TooltipProvider delayDuration={300}>
          <div className="flex-1 overflow-auto p-4 pt-20 sm:pt-20 md:pt-20 lg:p-8 lg:pt-8">
          <PageHeader
            title="Funcionários"
            subtitle="Visualização e filtros de funcionários"
          />

          {/* Cards de resumo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Funcionários</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{funcionarios.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Filtrados</CardTitle>
                <Search className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sortedFuncionarios.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Setores</CardTitle>
                <Badge variant="outline">{uniqueSetores.length}</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{uniqueRegionais.length}</div>
                <p className="text-xs text-muted-foreground">Regionais</p>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <Card className="mb-4 sm:mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Nome, email ou chapa..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="setor">Setor</Label>
                  <Select value={setorFilter} onValueChange={setSetorFilter}>
                    <SelectTrigger id="setor">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {uniqueSetores.map((setor) => (
                        <SelectItem key={setor} value={setor}>
                          {setor}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="regional">Regional</Label>
                  <Select value={regionalFilter} onValueChange={setRegionalFilter}>
                    <SelectTrigger id="regional">
                      <SelectValue placeholder="SEDE" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueRegionais.map((regional) => (
                        <SelectItem key={regional} value={regional}>
                          {regional}
                        </SelectItem>
                      ))}
                      <SelectItem value="todos">Todos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cargo">Cargo</Label>
                  <Dialog open={isCargoModalOpen} onOpenChange={setIsCargoModalOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full justify-between"
                      >
                        <span className="truncate">
                          {cargoFilter === "todos" ? "Todos" : cargoFilter}
                        </span>
                        <Search className="ml-2 h-4 w-4 shrink-0" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md mx-4">
                      <DialogHeader>
                        <DialogTitle className="text-base sm:text-lg">Selecionar Cargo</DialogTitle>
                        <DialogDescription className="text-sm">
                          Pesquise e selecione um cargo para filtrar
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Pesquisar cargo..."
                            value={cargoSearchQuery}
                            onChange={(e) => setCargoSearchQuery(e.target.value)}
                            className="pl-8 text-sm sm:text-base"
                          />
                        </div>
                        <div className="max-h-[50vh] sm:max-h-[300px] overflow-y-auto space-y-1">
                          <Button
                            variant={cargoFilter === "todos" ? "secondary" : "ghost"}
                            className="w-full justify-start"
                            onClick={() => selectCargo("todos")}
                          >
                            Todos
                          </Button>
                          {filteredCargos.map((cargo) => (
                            <Button
                              key={cargo}
                              variant={cargoFilter === cargo ? "secondary" : "ghost"}
                              className="w-full justify-start"
                              onClick={() => selectCargo(cargo)}
                            >
                              {cargo}
                            </Button>
                          ))}
                          {filteredCargos.length === 0 && cargoSearchQuery && (
                            <p className="text-center text-sm text-muted-foreground py-4">
                              Nenhum cargo encontrado
                            </p>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  {cargoFilter !== "todos" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearCargoFilter}
                      className="w-full mt-1"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Limpar filtro
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela - Desktop */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Tabela Desktop - oculta em mobile */}
              <Card className="rounded-lg overflow-hidden hidden lg:block">
                <CardContent className="p-0">
                  <div className="relative w-full overflow-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-[#00714B]">
                        <TableRow className="border-b-0 hover:bg-[#00714B]">
                          <TableHead 
                            className="text-white font-medium cursor-pointer hover:bg-emerald-700 transition-colors"
                            onClick={() => handleSort('chapa')}
                          >
                            <div className="flex items-center">
                              Chapa
                              {getSortIcon('chapa')}
                            </div>
                          </TableHead>
                          <TableHead 
                            className="text-white font-medium cursor-pointer hover:bg-emerald-700 transition-colors"
                            onClick={() => handleSort('nome')}
                          >
                            <div className="flex items-center">
                              Nome
                              {getSortIcon('nome')}
                            </div>
                          </TableHead>
                          <TableHead 
                            className="text-white font-medium cursor-pointer hover:bg-emerald-700 transition-colors"
                            onClick={() => handleSort('email')}
                          >
                            <div className="flex items-center">
                              Email
                              {getSortIcon('email')}
                            </div>
                          </TableHead>
                          <TableHead className="text-white font-medium text-center">
                            Setor
                          </TableHead>
                          <TableHead className="text-white font-medium">
                            Regional
                          </TableHead>
                          <TableHead className="text-white font-medium">
                            Cargo
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedFuncionarios.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              Nenhum funcionário encontrado
                            </TableCell>
                          </TableRow>
                        ) : (
                          sortedFuncionarios.map((funcionario, index) => (
                            <TableRow key={`${funcionario.chapa}-${index}`} className="hover:bg-gray-50">
                              <TableCell className="font-medium">{funcionario.chapa}</TableCell>
                              <TableCell>{funcionario.nome}</TableCell>
                              <TableCell className="break-all">{funcionario.email}</TableCell>
                              <TableCell className="text-center">
                                {!funcionario.setor || funcionario.setor.trim() === '' ? (
                                  <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                      <span className="inline-block cursor-help">
                                        <Badge variant="outline">-</Badge>
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent 
                                      side="top" 
                                      className="z-[100] bg-gray-900 text-white border-gray-700"
                                    >
                                      <p>Este funcionário não possui setor cadastrado</p>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <Badge variant="outline">{funcionario.setor}</Badge>
                                )}
                              </TableCell>
                              <TableCell>{funcionario.regional || "-"}</TableCell>
                              <TableCell className="text-sm">{funcionario.cargo}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Cards para mobile e tablet */}
          {!isLoading && (
            <div className="lg:hidden mt-4 space-y-3">
              {sortedFuncionarios.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Nenhum funcionário encontrado
                  </CardContent>
                </Card>
              ) : (
                sortedFuncionarios.map((funcionario, index) => (
                  <Card key={`mobile-${funcionario.chapa}-${index}`} className="rounded-lg">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base font-semibold leading-tight">{funcionario.nome}</CardTitle>
                        <Badge variant="outline" className="shrink-0">{funcionario.chapa}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-muted-foreground text-xs">Email</span>
                        <a 
                          href={`mailto:${funcionario.email}`}
                          className="text-primary break-all hover:underline"
                        >
                          {funcionario.email}
                        </a>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-muted-foreground text-xs">Setor</span>
                        <div>
                          {!funcionario.setor || funcionario.setor.trim() === '' ? (
                            <Tooltip delayDuration={0}>
                              <TooltipTrigger asChild>
                                <span className="cursor-help inline-block">
                                  <Badge variant="outline">-</Badge>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent 
                                side="top" 
                                className="z-[100] bg-gray-900 text-white border-gray-700"
                              >
                                <p>Este funcionário não possui setor cadastrado</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <Badge variant="outline">{funcionario.setor}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-muted-foreground text-xs">Regional</span>
                        <span>{funcionario.regional || "-"}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-muted-foreground text-xs">Cargo</span>
                        <span className="break-words">{funcionario.cargo}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
          </div>
        </TooltipProvider>
      </AuthenticatedLayout>
    </AuthRequired>
  )
}
