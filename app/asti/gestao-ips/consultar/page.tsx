"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { SidebarSistema } from "@/components/sidebar-sistema"

import { AdvancedViewDialog } from "./components/advanced-view-dialog"
import { FaixaDetailsDialog } from "./components/faixa-details-dialog"
import { FilterPanel } from "./components/filter-panel"
import { ResultsSection } from "./components/results-section"
import { SetorSelectDialog } from "./components/setor-select-dialog"
import { ALL_STATUSES } from "./constants"
import type { EditFormState, FaixaItem, IpRegistro, IpStatus, SetorItem } from "./types"

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) {
    return "Data inválida"
  }
  return date.toLocaleDateString("pt-BR")
}

const formatValue = (value?: string | null) => value || "Não informado"

export default function ConsultarIpsPage() {
  const [busca, setBusca] = useState<string>("")
  const [buscaFaixa, setBuscaFaixa] = useState<string>("")
  const [buscaDescricao, setBuscaDescricao] = useState<string>("")
  const [status, setStatus] = useState<IpStatus | "todos">("todos")
  const [ips, setIps] = useState<IpRegistro[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [erro, setErro] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards")
  const [consultaModo, setConsultaModo] = useState<"ip" | "faixa">("ip")
  const [selectedIp, setSelectedIp] = useState<IpRegistro | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedFaixa, setSelectedFaixa] = useState<FaixaItem | null>(null)
  const [isFaixaDialogOpen, setIsFaixaDialogOpen] = useState(false)
  const [responsavelFiltro, setResponsavelFiltro] = useState<string>("")
  const [setorFiltro, setSetorFiltro] = useState<string>("todos")
  const [equipamentoFiltro, setEquipamentoFiltro] = useState<string>("todos")
  const [faixaFiltro, setFaixaFiltro] = useState<string>("todos")
  const [setores, setSetores] = useState<SetorItem[]>([])
  const [isLoadingSetores, setIsLoadingSetores] = useState<boolean>(false)
  const [erroSetores, setErroSetores] = useState<string | null>(null)
  const [isSetorDialogOpen, setIsSetorDialogOpen] = useState(false)
  const [setorBusca, setSetorBusca] = useState("")
  const [faixas, setFaixas] = useState<FaixaItem[]>([])
  const [isLoadingFaixas, setIsLoadingFaixas] = useState<boolean>(false)
  const [erroFaixas, setErroFaixas] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [itemsPerPage, setItemsPerPage] = useState<number>(10)
  const [editForm, setEditForm] = useState<EditFormState>({
    status: "Disponível",
    descricao: "",
    responsavel: "",
    setor: "",
    equipamento: ""
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [isDeletingIp, setIsDeletingIp] = useState(false)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false

    const carregarIps = async () => {
      try {
        setIsLoading(true)
        setErro(null)

        const response = await fetch("/api/gestao-ip")
        if (!response.ok) {
          throw new Error("Não foi possível carregar os IPs.")
        }

        const data = (await response.json()) as IpRegistro[]
        if (!ignore) {
          setIps(data)
        }
      } catch (error) {
        console.error("Erro ao carregar IPs:", error)
        if (!ignore) {
          setErro("Não foi possível carregar os IPs cadastrados.")
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    carregarIps()

    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    let ignore = false

    const carregarSetores = async () => {
      try {
        setIsLoadingSetores(true)
        setErroSetores(null)

        const response = await fetch("/api/setor")
        if (!response.ok) {
          throw new Error("Não foi possível carregar os setores.")
        }

        const data = (await response.json()) as SetorItem[]
        if (!ignore) {
          setSetores(data)
        }
      } catch (error) {
        console.error("Erro ao carregar setores:", error)
        if (!ignore) {
          setErroSetores("Não foi possível carregar os setores disponíveis.")
        }
      } finally {
        if (!ignore) {
          setIsLoadingSetores(false)
        }
      }
    }

    carregarSetores()

    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    let ignore = false

    const carregarFaixas = async () => {
      try {
        setIsLoadingFaixas(true)
        setErroFaixas(null)

        const response = await fetch("/api/gestao-ip/faixa")
        if (!response.ok) {
          throw new Error("Não foi possível carregar as faixas.")
        }

        const data = (await response.json()) as FaixaItem[]
        if (!ignore) {
          setFaixas(data)
        }
      } catch (error) {
        console.error("Erro ao carregar faixas:", error)
        if (!ignore) {
          setErroFaixas("Não foi possível carregar as faixas cadastradas.")
        }
      } finally {
        if (!ignore) {
          setIsLoadingFaixas(false)
        }
      }
    }

    carregarFaixas()

    return () => {
      ignore = true
    }
  }, [])

  const setorLabelMap = useMemo(() => {
    const map = new Map<string, string>()
    setores.forEach((setor) => {
      const key = String(setor.id)
      const label = setor.sigla || setor.nome || `Setor ${setor.id}`
      map.set(key, label)
    })
    return map
  }, [setores])

  const setorFiltroLabel = useMemo(() => {
    if (setorFiltro === "todos") {
      return null
    }
    return setorLabelMap.get(setorFiltro) ?? null
  }, [setorFiltro, setorLabelMap])

  const setoresFiltrados = useMemo(() => {
    const termo = setorBusca.trim().toLowerCase()
    if (!termo) {
      return setores
    }
    return setores.filter((setor) => {
      const idTexto = String(setor.id)
      const nomeTexto = (setor.nome ?? "").toLowerCase()
      const siglaTexto = (setor.sigla ?? "").toLowerCase()
      return (
        idTexto.includes(termo) ||
        nomeTexto.includes(termo) ||
        siglaTexto.includes(termo)
      )
    })
  }, [setorBusca, setores])

  const faixaOptions = useMemo(() => {
    return faixas.map((faixa) => ({
      value: String(faixa.id),
      label: faixa.descricao ? `${faixa.descricao} (${faixa.faixa})` : faixa.faixa
    }))
  }, [faixas])

  const faixaSelecionada = useMemo(() => {
    if (faixaFiltro === "todos") {
      return undefined
    }
    return faixas.find((faixa) => String(faixa.id) === faixaFiltro)
  }, [faixas, faixaFiltro])

  const faixasFiltradas = useMemo(() => {
    const termoFaixa = buscaFaixa.trim().toLowerCase()
    const termoDescricao = buscaDescricao.trim().toLowerCase()
    
    if (!termoFaixa && !termoDescricao) {
      return faixas
    }
    
    return faixas.filter((faixa) => {
      const faixaTexto = faixa.faixa.toLowerCase()
      const descricaoTexto = (faixa.descricao ?? "").toLowerCase()
      
      const correspondeFaixa = !termoFaixa || faixaTexto.includes(termoFaixa)
      const correspondeDescricao = !termoDescricao || descricaoTexto.includes(termoDescricao)
      
      return correspondeFaixa && correspondeDescricao
    })
  }, [buscaFaixa, buscaDescricao, faixas])

  const equipamentoOptions = useMemo(() => {
    const unique = new Set<string>()
    ips.forEach((ip) => {
      if (ip.equipamento) {
        unique.add(ip.equipamento)
      }
    })
    return Array.from(unique).sort((a, b) => a.localeCompare(b))
  }, [ips])

  const setorOptions = useMemo(() => {
    return setores
      .map((setor) => {
        const label = setor.sigla || setor.nome || `Setor ${setor.id}`
        return {
          value: String(setor.id),
          label
        }
      })
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [setores])

  // Helper para obter o label da faixa de um IP
  const obterFaixaLabel = useCallback((ip?: IpRegistro | null) => {
    if (!ip) return undefined
    const faixaEncontrada = faixas.find((item) =>
      ip.endereco_ip.toLowerCase().startsWith(item.faixa.toLowerCase())
    )
    if (!faixaEncontrada) return undefined
    return faixaEncontrada.descricao
      ? `${faixaEncontrada.descricao} (${faixaEncontrada.faixa})`
      : faixaEncontrada.faixa
  }, [faixas])

  const ipsFiltrados = useMemo(() => {
    const buscaNormalizada = busca.trim().toLowerCase()
    const responsavelFiltroNormalizado = responsavelFiltro.trim().toLowerCase()
    const setorFiltroLabelLower = setorFiltroLabel?.toLowerCase()
    const aplicarFiltrosAvancados = consultaModo === "ip"

    return ips.filter((ip) => {
      let correspondeBusca = true
      if (consultaModo === "faixa") {
        if (buscaNormalizada === "") {
          correspondeBusca = true
        } else {
          const faixaLabel = obterFaixaLabel(ip)
          correspondeBusca = faixaLabel ? faixaLabel.toLowerCase().includes(buscaNormalizada) : false
        }
      } else {
        correspondeBusca = ip.endereco_ip.toLowerCase().includes(buscaNormalizada)
      }

      const correspondeStatus = !aplicarFiltrosAvancados || status === "todos" || ip.status === status
      const correspondeResponsavel =
        !aplicarFiltrosAvancados ||
        responsavelFiltroNormalizado === "" ||
        (ip.responsavel ? ip.responsavel.toLowerCase().includes(responsavelFiltroNormalizado) : false)

      const setorLabel = ip.setor ? setorLabelMap.get(String(ip.setor)) ?? ip.setor : null
      const correspondeSetor =
        !aplicarFiltrosAvancados ||
        setorFiltro === "todos" ||
        (ip.setor ? String(ip.setor) === setorFiltro : false) ||
        (setorLabel && setorFiltroLabelLower ? setorLabel.toLowerCase() === setorFiltroLabelLower : false)

      const correspondeEquipamento =
        !aplicarFiltrosAvancados ||
        equipamentoFiltro === "todos" ||
        (ip.equipamento ? ip.equipamento === equipamentoFiltro : false)

      const correspondeFaixa =
        !aplicarFiltrosAvancados ||
        !faixaSelecionada ||
        ip.endereco_ip.toLowerCase().startsWith(faixaSelecionada.faixa.toLowerCase())

      return (
        correspondeBusca &&
        correspondeStatus &&
        correspondeResponsavel &&
        correspondeSetor &&
        correspondeEquipamento &&
        correspondeFaixa
      )
    })
  }, [
    busca,
    consultaModo,
    status,
    responsavelFiltro,
    setorFiltro,
    setorFiltroLabel,
    setorLabelMap,
    equipamentoFiltro,
    faixaSelecionada,
    ips,
    obterFaixaLabel
  ])

  const isConsultaFaixa = consultaModo === "faixa"
  const totalResultados = isConsultaFaixa ? faixasFiltradas.length : ipsFiltrados.length

  useEffect(() => {
    if (selectedIp) {
      setEditForm({
        status: selectedIp.status,
        descricao: selectedIp.descricao ?? "",
        responsavel: selectedIp.responsavel ?? "",
        setor: selectedIp.setor ?? "",
        equipamento: selectedIp.equipamento ?? ""
      })
      setIsEditing(false)
      setIsConfirmingDelete(false)
      setActionError(null)
    }
  }, [selectedIp])

  useEffect(() => {
    setCurrentPage(1)
  }, [
    busca,
    buscaFaixa,
    buscaDescricao,
    consultaModo,
    status,
    responsavelFiltro,
    setorFiltro,
    equipamentoFiltro,
    faixaFiltro,
    ipsFiltrados.length,
    faixasFiltradas.length
  ])

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalResultados / itemsPerPage))
  }, [totalResultados, itemsPerPage])

  useEffect(() => {
    setCurrentPage((previous) => {
      if (previous > totalPages) {
        return totalPages
      }
      return previous
    })
  }, [totalPages])

  const paginatedIps = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return ipsFiltrados.slice(start, start + itemsPerPage)
  }, [currentPage, itemsPerPage, ipsFiltrados])

  const paginatedFaixas = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return faixasFiltradas.slice(start, start + itemsPerPage)
  }, [currentPage, itemsPerPage, faixasFiltradas])

  const showingRangeStart = useMemo(() => {
    if (!totalResultados) return 0
    return (currentPage - 1) * itemsPerPage + 1
  }, [currentPage, itemsPerPage, totalResultados])

  const showingRangeEnd = useMemo(() => {
    return Math.min(currentPage * itemsPerPage, totalResultados)
  }, [currentPage, itemsPerPage, totalResultados])

  const obterSetorLabel = (valor?: string | null) => {
    if (!valor) return undefined
    const key = String(valor)
    return setorLabelMap.get(key) ?? valor
  }


  const handleChangeConsultaModo = (mode: "ip" | "faixa") => {
    if (mode === consultaModo) {
      return
    }
    setConsultaModo(mode)
    setBusca("")
    setBuscaFaixa("")
    setBuscaDescricao("")
  }

  const handleOpenAdvancedView = (ip: IpRegistro) => {
    setSelectedIp(ip)
    setIsDialogOpen(true)
  }

  const handleOpenFaixaView = (faixa: FaixaItem) => {
    setSelectedFaixa(faixa)
    setIsFaixaDialogOpen(true)
  }

  const handleModalChange = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      setIsEditing(false)
      setIsConfirmingDelete(false)
      setActionError(null)
      setSelectedIp(null)
    }
  }

  const handleStartEditing = () => {
    setActionError(null)
    setIsConfirmingDelete(false)
    setIsEditing(true)
  }

  const handleCancelEditing = () => {
    if (selectedIp) {
      setEditForm({
        status: selectedIp.status,
        descricao: selectedIp.descricao ?? "",
        responsavel: selectedIp.responsavel ?? "",
        setor: selectedIp.setor ?? "",
        equipamento: selectedIp.equipamento ?? ""
      })
    }
    setIsEditing(false)
    setActionError(null)
  }

  const handleStartDelete = () => {
    setActionError(null)
    setIsEditing(false)
    setIsConfirmingDelete(true)
  }

  const handleCancelDelete = () => {
    setIsConfirmingDelete(false)
    setActionError(null)
  }

  const handleEditFormChange = (field: keyof EditFormState, value: string) => {
    setEditForm((previous) => ({
      ...previous,
      [field]: value
    }))
  }

  const handleSaveChanges = async () => {
    if (!selectedIp) {
      return
    }

    setIsSavingEdit(true)
    setActionError(null)

    const normalizeField = (value: string) => value.trim()

    const payload = {
      id: selectedIp.id,
      status: editForm.status,
      descricao: normalizeField(editForm.descricao),
      responsavel: normalizeField(editForm.responsavel),
      setor: normalizeField(editForm.setor),
      equipamento: normalizeField(editForm.equipamento)
    }

    try {
      const response = await fetch("/api/gestao-ip", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })

      const responseBody = (await response.json().catch(() => null)) as IpRegistro | { error?: string } | null

      if (!response.ok || !responseBody || "error" in responseBody) {
        const message =
          responseBody && "error" in responseBody && responseBody.error
            ? responseBody.error
            : "Não foi possível salvar as alterações."
        throw new Error(message)
      }

      const updatedIp = responseBody as IpRegistro

      setIps((previousIps) => previousIps.map((ip) => (ip.id === updatedIp.id ? updatedIp : ip)))
      setSelectedIp(updatedIp)
      setIsEditing(false)
      setIsConfirmingDelete(false)
    } catch (error) {
      console.error("Erro ao salvar alterações do IP:", error)
      const message = error instanceof Error ? error.message : "Não foi possível salvar as alterações."
      setActionError(message)
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedIp) {
      return
    }

    setIsDeletingIp(true)
    setActionError(null)

    try {
      const response = await fetch(`/api/gestao-ip?id=${selectedIp.id}`, {
        method: "DELETE"
      })

      const data = (await response.json().catch(() => null)) as { error?: string } | null

      if (!response.ok) {
        const message = data?.error ?? "Não foi possível excluir o IP."
        throw new Error(message)
      }

      setIps((previousIps) => previousIps.filter((ip) => ip.id !== selectedIp.id))
      setIsDialogOpen(false)
      setSelectedIp(null)
      setIsConfirmingDelete(false)
    } catch (error) {
      console.error("Erro ao excluir IP:", error)
      const message = error instanceof Error ? error.message : "Não foi possível excluir o IP."
      setActionError(message)
    } finally {
      setIsDeletingIp(false)
    }
  }

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value)
    setCurrentPage(1)
  }

  const handlePrevPage = () => {
    setCurrentPage((previous) => Math.max(1, previous - 1))
  }

  const handleNextPage = () => {
    setCurrentPage((previous) => Math.min(totalPages, previous + 1))
  }

  const handleClearFilters = () => {
    setBusca("")
    setBuscaFaixa("")
    setBuscaDescricao("")
    setStatus("todos")
    setResponsavelFiltro("")
    setSetorFiltro("todos")
    setEquipamentoFiltro("todos")
    setFaixaFiltro("todos")
  }

  const handleStatusChange = (value: IpStatus | "todos") => {
    setStatus(value)
  }

  const handleEquipamentoChange = (value: string) => {
    setEquipamentoFiltro(value)
  }

  const handleFaixaChange = (value: string) => {
    setFaixaFiltro(value)
  }

  const handleOpenSetorDialog = () => {
    setSetorBusca("")
    setIsSetorDialogOpen(true)
  }

  const handleSetorDialogChange = (open: boolean) => {
    setIsSetorDialogOpen(open)
    if (!open) {
      setSetorBusca("")
    }
  }

  const handleSelectTodosSetores = () => {
    setSetorFiltro("todos")
    setIsSetorDialogOpen(false)
    setSetorBusca("")
  }

  const handleSelectSetor = (value: string) => {
    setSetorFiltro(value)
    setIsSetorDialogOpen(false)
    setSetorBusca("")
  }

  const isLoadingResultados = isConsultaFaixa ? isLoadingFaixas : isLoading
  const erroResultados = isConsultaFaixa ? erroFaixas : erro
  const loadingMessage = isConsultaFaixa ? "Carregando faixas cadastradas..." : "Carregando IPs cadastrados..."
  const emptyMessage = isConsultaFaixa
    ? "Nenhuma faixa corresponde à busca informada."
    : "Nenhum IP encontrado com os filtros selecionados."

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-x-hidden">
      <SidebarSistema />
      <main className="flex-1 min-w-0 overflow-x-hidden pt-16 lg:pt-0">
        <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Link
              href="/asti/gestao-ips"
              className="inline-flex w-fit items-center gap-2 text-sm font-medium text-emerald-900 transition hover:text-emerald-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-gray-900">Consulta de IPs</h1>
              <p className="text-sm text-muted-foreground">Gerencie os endereços IP cadastrados no Gestão de Projetos.</p>
            </div>
          </div>

          <FilterPanel
            consultaModo={consultaModo}
            onChangeConsultaModo={handleChangeConsultaModo}
            busca={busca}
            onBuscaChange={setBusca}
            buscaFaixa={buscaFaixa}
            onBuscaFaixaChange={setBuscaFaixa}
            buscaDescricao={buscaDescricao}
            onBuscaDescricaoChange={setBuscaDescricao}
            status={status}
            onStatusChange={handleStatusChange}
            statusOptions={ALL_STATUSES}
            responsavelFiltro={responsavelFiltro}
            onResponsavelChange={setResponsavelFiltro}
            onOpenSetorDialog={handleOpenSetorDialog}
            setorFiltro={setorFiltro}
            setorFiltroLabel={setorFiltroLabel}
            isLoadingSetores={isLoadingSetores}
            erroSetores={erroSetores}
            equipamentoFiltro={equipamentoFiltro}
            onEquipamentoChange={handleEquipamentoChange}
            equipamentoOptions={equipamentoOptions}
            faixaFiltro={faixaFiltro}
            onFaixaChange={handleFaixaChange}
            faixaOptions={faixaOptions}
            isLoadingFaixas={isLoadingFaixas}
            erroFaixas={erroFaixas}
            onClearFilters={handleClearFilters}
          />

          <ResultsSection
            consultaModo={consultaModo}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            isLoading={isLoadingResultados}
            error={erroResultados}
            totalResults={totalResultados}
            loadingMessage={loadingMessage}
            emptyMessage={emptyMessage}
            showingRangeStart={showingRangeStart}
            showingRangeEnd={showingRangeEnd}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={handleItemsPerPageChange}
            currentPage={currentPage}
            totalPages={totalPages}
            onPrevPage={handlePrevPage}
            onNextPage={handleNextPage}
            paginatedIps={paginatedIps}
            paginatedFaixas={paginatedFaixas}
            formatDate={formatDate}
            formatValue={formatValue}
            obterSetorLabel={obterSetorLabel}
            obterFaixaLabel={obterFaixaLabel}
            onOpenAdvancedView={handleOpenAdvancedView}
            onOpenFaixaView={handleOpenFaixaView}
          />
        </div>
      </main>

      <SetorSelectDialog
        open={isSetorDialogOpen}
        onOpenChange={handleSetorDialogChange}
        setorBusca={setorBusca}
        onSetorBuscaChange={setSetorBusca}
        isLoadingSetores={isLoadingSetores}
        erroSetores={erroSetores}
        setores={setores}
        setoresFiltrados={setoresFiltrados}
        selectedSetor={setorFiltro}
        onSelectTodos={handleSelectTodosSetores}
        onSelectSetor={handleSelectSetor}
      />

      <AdvancedViewDialog
        isOpen={isDialogOpen}
        onOpenChange={handleModalChange}
        selectedIp={selectedIp}
        actionError={actionError}
        isEditing={isEditing}
        onStartEditing={handleStartEditing}
        onCancelEditing={handleCancelEditing}
        onSaveChanges={handleSaveChanges}
        isSavingEdit={isSavingEdit}
        editForm={editForm}
        onEditFormChange={handleEditFormChange}
        setorOptions={setorOptions}
        isConfirmingDelete={isConfirmingDelete}
        onStartDelete={handleStartDelete}
        onCancelDelete={handleCancelDelete}
        onConfirmDelete={handleConfirmDelete}
        isDeletingIp={isDeletingIp}
        formatDate={formatDate}
        formatValue={formatValue}
        obterSetorLabel={obterSetorLabel}
        obterFaixaLabel={obterFaixaLabel}
      />

      <FaixaDetailsDialog
        isOpen={isFaixaDialogOpen}
        onOpenChange={setIsFaixaDialogOpen}
        selectedFaixa={selectedFaixa}
        formatValue={formatValue}
      />
    </div>
  )
}
