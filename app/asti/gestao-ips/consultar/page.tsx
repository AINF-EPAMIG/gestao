"use client"

import { useMemo, useState, useEffect } from "react"

import Link from "next/link"
import {
	ArrowLeft,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Eye,
	LayoutGrid,
	MonitorSmartphone,
	RefreshCcw,
	Table as TableIcon
} from "lucide-react"

import { SidebarSistema } from "@/components/sidebar-sistema"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type IpStatus = "Disponível" | "Em Uso" | "Reservado" | "Manutenção"

interface IpRegistro {
	id: number
	endereco_ip: string
	status: IpStatus
	descricao?: string | null
	responsavel?: string | null
	setor?: string | null
	equipamento?: string | null
	data_cadastro: string
}

interface SetorItem {
	id: number
	nome?: string | null
	sigla?: string | null
}

interface FaixaItem {
	id: number
	faixa: string
	descricao: string
}

const STATUS_STYLES: Record<IpStatus, string> = {
	Disponível: "bg-green-100 text-green-800",
	"Em Uso": "bg-blue-100 text-blue-800",
	Reservado: "bg-yellow-100 text-yellow-800",
	Manutenção: "bg-red-100 text-red-800"
}

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
	const [status, setStatus] = useState<IpStatus | "todos">("todos")
	const [ips, setIps] = useState<IpRegistro[]>([])
	const [isLoading, setIsLoading] = useState<boolean>(false)
	const [erro, setErro] = useState<string | null>(null)
	const [viewMode, setViewMode] = useState<"cards" | "table">("cards")
	const [selectedIp, setSelectedIp] = useState<IpRegistro | null>(null)
	const [isDialogOpen, setIsDialogOpen] = useState(false)
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
	const [itemsPerPage, setItemsPerPage] = useState<number>(8)

	useEffect(() => {
		const fetchIps = async () => {
			try {
				setIsLoading(true)
				const response = await fetch("/api/gestao-ip")
				if (!response.ok) {
					throw new Error("Falha ao carregar IPs")
				}
				const data = (await response.json()) as IpRegistro[]
				setIps(data)
				setErro(null)
			} catch (error) {
				console.error("Erro ao carregar IPs:", error)
				setErro("Não foi possível carregar os IPs.")
			} finally {
				setIsLoading(false)
			}
		}

		const fetchSetores = async () => {
			try {
				setIsLoadingSetores(true)
				const response = await fetch("/api/setor")
				if (!response.ok) {
					throw new Error("Falha ao carregar setores")
				}
				const data = (await response.json()) as SetorItem[]
				setSetores(data)
				setErroSetores(null)
			} catch (error) {
				console.error("Erro ao carregar setores:", error)
				setErroSetores("Não foi possível carregar os setores.")
			} finally {
				setIsLoadingSetores(false)
			}
		}

		const fetchFaixas = async () => {
			try {
				setIsLoadingFaixas(true)
				const response = await fetch("/api/gestao-ip/faixa")
				if (!response.ok) {
					throw new Error("Falha ao carregar faixas")
				}
				const data = (await response.json()) as FaixaItem[]
				setFaixas(data)
				setErroFaixas(null)
			} catch (error) {
				console.error("Erro ao carregar faixas:", error)
				setErroFaixas("Não foi possível carregar as faixas.")
			} finally {
				setIsLoadingFaixas(false)
			}
		}

		fetchIps()
		fetchSetores()
		fetchFaixas()
	}, [])

	const statusOptions = useMemo(() => {
		const unique = new Set<IpStatus>()
		ips.forEach((ip) => {
			if (ip.status) {
				unique.add(ip.status)
			}
		})
		return unique.size ? Array.from(unique).sort((a, b) => a.localeCompare(b)) : (Object.keys(STATUS_STYLES) as IpStatus[])
	}, [ips])

	const setorLabelMap = useMemo(() => {
		const map = new Map<string, string>()
		setores.forEach((setor) => {
			const key = String(setor.id)
			const label = setor.sigla || setor.nome || key
			map.set(key, label)
		})
		return map
	}, [setores])

	const setoresFiltrados = useMemo(() => {
		const termo = setorBusca.trim().toLowerCase()
		if (!termo) {
			return setores
		}
		return setores.filter((setor) => {
			const sigla = setor.sigla?.toLowerCase() ?? ""
			const nome = setor.nome?.toLowerCase() ?? ""
			return sigla.includes(termo) || nome.includes(termo)
		})
	}, [setorBusca, setores])

	const setorFiltroLabel = useMemo(() => {
		if (setorFiltro === "todos") {
			return null
		}
		const key = String(setorFiltro)
		return setorLabelMap.get(key) ?? key
	}, [setorFiltro, setorLabelMap])

	const faixaOptions = useMemo(() => {
		return faixas
			.map((faixa) => ({
				value: String(faixa.id),
				label: faixa.descricao ? `${faixa.descricao} (${faixa.faixa})` : faixa.faixa
			}))
			.sort((a, b) => a.label.localeCompare(b.label))
	}, [faixas])

	const faixaSelecionada = useMemo(() => {
		return faixaFiltro === "todos" ? null : faixas.find((item) => String(item.id) === faixaFiltro) ?? null
	}, [faixaFiltro, faixas])

	const equipamentoOptions = useMemo(() => {
		const unique = new Set<string>()
		ips.forEach((ip) => {
			if (ip.equipamento) {
				unique.add(ip.equipamento)
			}
		})
		return Array.from(unique).sort((a, b) => a.localeCompare(b))
	}, [ips])

	const ipsFiltrados = useMemo(() => {
		const responsavelFiltroNormalizado = responsavelFiltro.trim().toLowerCase()
		const setorFiltroLabelLower = setorFiltroLabel?.toLowerCase()

		return ips.filter((ip) => {
			const correspondeBusca = ip.endereco_ip.toLowerCase().includes(busca.toLowerCase())
			const correspondeStatus = status === "todos" || ip.status === status
			const correspondeResponsavel =
				!responsavelFiltroNormalizado ||
				(ip.responsavel ? ip.responsavel.toLowerCase().includes(responsavelFiltroNormalizado) : false)

			const setorLabel = ip.setor ? setorLabelMap.get(String(ip.setor)) ?? ip.setor : null
			const correspondeSetor =
				setorFiltro === "todos" ||
				(ip.setor ? String(ip.setor) === setorFiltro : false) ||
				(setorLabel && setorFiltroLabelLower
					? setorLabel.toLowerCase() === setorFiltroLabelLower
					: false)

			const correspondeEquipamento =
				equipamentoFiltro === "todos" || (ip.equipamento ? ip.equipamento === equipamentoFiltro : false)
			const correspondeFaixa =
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
		status,
		responsavelFiltro,
		setorFiltro,
		setorFiltroLabel,
		setorLabelMap,
		equipamentoFiltro,
		faixaSelecionada,
		ips
	])

	useEffect(() => {
		setCurrentPage(1)
	}, [busca, status, responsavelFiltro, setorFiltro, equipamentoFiltro, faixaFiltro, ipsFiltrados.length])

	const totalPages = useMemo(() => {
		return Math.max(1, Math.ceil(ipsFiltrados.length / itemsPerPage))
	}, [ipsFiltrados.length, itemsPerPage])

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

	const showingRangeStart = useMemo(() => {
		if (!ipsFiltrados.length) return 0
		return (currentPage - 1) * itemsPerPage + 1
	}, [currentPage, itemsPerPage, ipsFiltrados.length])

	const showingRangeEnd = useMemo(() => {
		return Math.min(currentPage * itemsPerPage, ipsFiltrados.length)
	}, [currentPage, itemsPerPage, ipsFiltrados.length])

	const obterSetorLabel = (valor?: string | null) => {
		if (!valor) return undefined
		const key = String(valor)
		return setorLabelMap.get(key) ?? valor
	}

	const obterFaixaLabel = (ip?: IpRegistro | null) => {
		if (!ip) return undefined
		const faixaEncontrada = faixas.find((item) => ip.endereco_ip.toLowerCase().startsWith(item.faixa.toLowerCase()))
		if (!faixaEncontrada) return undefined
		return faixaEncontrada.descricao ? `${faixaEncontrada.descricao} (${faixaEncontrada.faixa})` : faixaEncontrada.faixa
	}

	const handleOpenAdvancedView = (ip: IpRegistro) => {
		setSelectedIp(ip)
		setIsDialogOpen(true)
	}

	const handleModalChange = (open: boolean) => {
		setIsDialogOpen(open)
		if (!open) {
			setSelectedIp(null)
		}
	}

	return (
		<div className="flex min-h-screen">
			<SidebarSistema />

			<main className="flex-1 bg-gray-50">
				<div className="p-8">
					<div className="mb-8 flex flex-col gap-2">
						<Link
							href="/asti/gestao-ips"
							className="inline-flex items-center text-gray-600 transition-colors hover:text-gray-900"
							aria-label="Voltar para a página de gestão de IPs"
						>
							<ArrowLeft className="mr-2 h-5 w-5" />
							Voltar
						</Link>
						<h1 className="text-3xl font-bold text-gray-900">Consulta de IPs</h1>
						<p className="text-gray-600">
							Utilize os filtros para localizar rapidamente endereços IP e verificar seus respectivos status.
						</p>
					</div>

					<Card className="mb-6">
						<CardHeader>
							<CardTitle>Filtros</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
								<div className="space-y-2">
									<Label htmlFor="busca">Busca por IP</Label>
									<Input
										id="busca"
										placeholder="Ex.: 10.0.0.10"
										value={busca}
										onChange={(event) => setBusca(event.target.value)}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="status">Status</Label>
									<Select value={status} onValueChange={(value: IpStatus | "todos") => setStatus(value)}>
										<SelectTrigger id="status">
											<SelectValue placeholder="Filtrar por status" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="todos">Todos</SelectItem>
											{statusOptions.map((option) => (
												<SelectItem key={option} value={option}>
													{option}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<Label htmlFor="responsavel">Responsável</Label>
									<Input
										id="responsavel"
										placeholder="Digite para filtrar"
										value={responsavelFiltro}
										onChange={(event) => setResponsavelFiltro(event.target.value)}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="setor">Setor</Label>
									<button
										type="button"
										id="setor"
										className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
										onClick={() => setIsSetorDialogOpen(true)}
										disabled={isLoadingSetores}
									>
										<span className={
											setorFiltro === "todos" && !isLoadingSetores ? "text-muted-foreground" : "text-foreground"
										}>
											{isLoadingSetores
												? "Carregando setores..."
												: erroSetores
													? "Erro ao carregar setores"
													: setorFiltro === "todos"
														? "Todos os setores"
														: setorFiltroLabel ?? "Selecione um setor"}
										</span>
										<ChevronDown className="h-4 w-4 opacity-50" />
									</button>
									{erroSetores && <p className="text-sm text-red-600">{erroSetores}</p>}
								</div>

								<div className="space-y-2">
									<Label htmlFor="equipamento">Equipamento</Label>
									<Select value={equipamentoFiltro} onValueChange={setEquipamentoFiltro}>
										<SelectTrigger id="equipamento">
											<SelectValue placeholder="Filtrar por equipamento" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="todos">Todos</SelectItem>
											{equipamentoOptions.map((option) => (
												<SelectItem key={option} value={option}>
													{option}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<Label htmlFor="faixa">Faixa</Label>
									<Select value={faixaFiltro} onValueChange={setFaixaFiltro}>
										<SelectTrigger id="faixa" disabled={isLoadingFaixas}>
											<SelectValue
												placeholder={isLoadingFaixas ? "Carregando faixas..." : "Filtrar por faixa"}
											/>
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="todos">Todas</SelectItem>
											{faixaOptions.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													{option.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{erroFaixas && <p className="text-sm text-red-600">{erroFaixas}</p>}
								</div>

								<div className="flex items-end">
									<Button
										type="button"
										variant="outline"
										onClick={() => {
											setBusca("")
											setStatus("todos")
											setResponsavelFiltro("")
											setSetorFiltro("todos")
											setEquipamentoFiltro("todos")
											setFaixaFiltro("todos")
										}}
										className="w-full"
									>
										<RefreshCcw className="mr-2 h-4 w-4" />
										Limpar filtros
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-wrap items-center justify-between gap-4 sm:flex-nowrap">
							<div className="flex items-center gap-3">
								<span className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-900 text-white">
									<MonitorSmartphone className="h-5 w-5" />
								</span>
								<div>
									<CardTitle className="text-xl">Resultados</CardTitle>
									<p className="text-sm text-muted-foreground">
										{ipsFiltrados.length} IP(s) encontrado(s)
									</p>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => setViewMode("cards")}
									aria-pressed={viewMode === "cards"}
									className={viewMode === "cards" ? "bg-emerald-900 text-white hover:bg-emerald-800" : undefined}
								>
									<LayoutGrid className="mr-2 h-4 w-4" />
									Cartões
								</Button>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => setViewMode("table")}
									aria-pressed={viewMode === "table"}
									className={viewMode === "table" ? "bg-emerald-900 text-white hover:bg-emerald-800" : undefined}
								>
									<TableIcon className="mr-2 h-4 w-4" />
									Tabela
								</Button>
							</div>
						</CardHeader>

						<CardContent>
							{isLoading ? (
								<div className="rounded-md border border-dashed border-gray-300 p-10 text-center text-muted-foreground">
									Carregando IPs...
								</div>
							) : erro ? (
								<div className="rounded-md border border-dashed border-red-300 bg-red-50 p-10 text-center text-red-600">
									{erro}
								</div>
							) : ipsFiltrados.length === 0 ? (
								<div className="rounded-md border border-dashed border-gray-300 p-10 text-center text-muted-foreground">
									Nenhum IP corresponde aos filtros aplicados.
								</div>
							) : viewMode === "cards" ? (
								<div className="space-y-4">
									<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
										<p className="text-sm text-muted-foreground">
											Mostrando {showingRangeStart}-{showingRangeEnd} de {ipsFiltrados.length} resultado(s)
										</p>
										<div className="flex items-center gap-2">
											<Label htmlFor="items-per-page" className="text-xs uppercase text-muted-foreground">
												Por página
											</Label>
											<Select
												value={String(itemsPerPage)}
												onValueChange={(value) => {
													setItemsPerPage(Number(value))
													setCurrentPage(1)
												}}
											>
												<SelectTrigger id="items-per-page" className="h-8 w-24">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="6">6</SelectItem>
													<SelectItem value="8">8</SelectItem>
													<SelectItem value="12">12</SelectItem>
													<SelectItem value="16">16</SelectItem>
												</SelectContent>
											</Select>
										</div>
									</div>
									<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
										{paginatedIps.map((ip) => {
											const setorLabel = obterSetorLabel(ip.setor)
											const faixaLabel = obterFaixaLabel(ip)
											return (
												<div
													key={ip.id}
													className="group relative overflow-hidden rounded-lg border bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
												>
													<div className="flex items-start justify-between">
														<div>
															<p className="text-xs uppercase tracking-wide text-muted-foreground">Endereço IP</p>
															<p className="text-lg font-semibold text-gray-900">{ip.endereco_ip}</p>
														</div>
														<span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[ip.status]}`}>
															{ip.status}
														</span>
													</div>

													<div className="mt-4 grid gap-3 text-sm text-muted-foreground">
														<div className="flex items-center justify-between border-b border-dashed border-gray-200 pb-2">
															<span className="font-medium text-gray-700">Equipamento</span>
															<span>{formatValue(ip.equipamento)}</span>
														</div>
														<div className="flex items-center justify-between border-b border-dashed border-gray-200 pb-2">
															<span className="font-medium text-gray-700">Responsável</span>
															<span>{formatValue(ip.responsavel)}</span>
														</div>
														<div className="flex items-center justify-between border-b border-dashed border-gray-200 pb-2">
															<span className="font-medium text-gray-700">Setor</span>
															<span>{formatValue(setorLabel)}</span>
														</div>
														<div className="flex items-center justify-between border-b border-dashed border-gray-200 pb-2">
															<span className="font-medium text-gray-700">Faixa</span>
															<span>{formatValue(faixaLabel)}</span>
														</div>
														<div className="flex items-center justify-between">
															<span className="font-medium text-gray-700">Cadastrado em</span>
															<span>{formatDate(ip.data_cadastro)}</span>
														</div>
													</div>

													{ip.descricao && (
														<p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
															{ip.descricao}
														</p>
													)}

													<div className="mt-4 flex items-center justify-between">
														<span className="text-xs text-muted-foreground">#{ip.id}</span>
														<Button type="button" variant="outline" size="sm" onClick={() => handleOpenAdvancedView(ip)}>
															<Eye className="mr-2 h-4 w-4" />
															Visualização
														</Button>
													</div>
												</div>
											)
										})}
									</div>
									<div className="flex flex-col items-center justify-between gap-3 border-t border-dashed border-gray-200 pt-4 sm:flex-row">
										<div className="flex items-center gap-2">
											<Button
												type="button"
												variant="outline"
												size="icon"
												onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
												disabled={currentPage === 1}
												aria-label="Página anterior"
											>
												<ChevronLeft className="h-4 w-4" />
											</Button>
											<span className="text-sm text-muted-foreground">
												Página {currentPage} de {totalPages}
											</span>
											<Button
												type="button"
												variant="outline"
												size="icon"
												onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
												disabled={currentPage === totalPages}
												aria-label="Próxima página"
											>
												<ChevronRight className="h-4 w-4" />
											</Button>
										</div>
										<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
											<span>Use os filtros para refinar os resultados.</span>
										</div>
									</div>
								</div>
							) : (
								<div className="max-h-[480px] overflow-auto rounded-lg border">
									<table className="min-w-full divide-y divide-gray-200">
										<thead className="bg-gray-50">
											<tr>
												<th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
													Endereço IP
												</th>
												<th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
													Status
												</th>
												<th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
													Responsável
												</th>
												<th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
													Setor
												</th>
												<th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
													Equipamento
												</th>
												<th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
													Cadastrado em
												</th>
												<th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
													Ações
												</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-gray-200 bg-white">
											{ipsFiltrados.map((ip) => {
												const setorLabel = obterSetorLabel(ip.setor)
												return (
													<tr key={ip.id}>
														<td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{ip.endereco_ip}</td>
														<td className="whitespace-nowrap px-4 py-3">
															<span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[ip.status]}`}>
																{ip.status}
															</span>
														</td>
														<td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{formatValue(ip.responsavel)}</td>
														<td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{formatValue(setorLabel)}</td>
														<td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{formatValue(ip.equipamento)}</td>
														<td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{formatDate(ip.data_cadastro)}</td>
														<td className="whitespace-nowrap px-4 py-3 text-right">
															<Button type="button" variant="outline" size="sm" onClick={() => handleOpenAdvancedView(ip)}>
																<Eye className="mr-2 h-4 w-4" />
																Ver mais
															</Button>
														</td>
													</tr>
												)
											})}
										</tbody>
									</table>
								</div>
							)}
					</CardContent>
					</Card>

					<Dialog
						open={isSetorDialogOpen}
						onOpenChange={(open) => {
							setIsSetorDialogOpen(open)
							if (!open) {
								setSetorBusca("")
							}
						}}
					>
						<DialogContent className="sm:max-w-md">
							<DialogHeader>
								<DialogTitle>Selecionar setor</DialogTitle>
							</DialogHeader>
							<div className="space-y-4">
								<Input
									placeholder="Pesquisar setor..."
									value={setorBusca}
									onChange={(event) => setSetorBusca(event.target.value)}
									disabled={isLoadingSetores}
								/>
								{isLoadingSetores ? (
									<p className="text-sm text-muted-foreground">Carregando setores...</p>
								) : erroSetores ? (
									<p className="text-sm text-red-600">{erroSetores}</p>
								) : setores.length === 0 ? (
									<p className="text-sm text-muted-foreground">Nenhum setor disponível.</p>
								) : (
									<div className="space-y-2">
										<Button
											type="button"
											variant={setorFiltro === "todos" ? "default" : "outline"}
											onClick={() => {
												setSetorFiltro("todos")
												setSetorBusca("")
												setIsSetorDialogOpen(false)
											}}
											className="w-full justify-start"
										>
											Todos os setores
										</Button>
										<div className="max-h-64 space-y-2 overflow-y-auto">
											{setoresFiltrados.length === 0 ? (
												<p className="px-2 text-sm text-muted-foreground">Nenhum setor corresponde à busca.</p>
											) : (
												setoresFiltrados.map((setor) => {
													const valor = String(setor.id)
													const label = setor.sigla || setor.nome || `Setor ${valor}`
													return (
														<Button
															key={valor}
															type="button"
															variant={setorFiltro === valor ? "default" : "outline"}
															className="w-full justify-start"
															onClick={() => {
																setSetorFiltro(valor)
																setSetorBusca("")
																setIsSetorDialogOpen(false)
															}}
														>
															{label}
														</Button>
													)
												})
											)}
										</div>
									</div>
								)}
							</div>
						</DialogContent>
					</Dialog>

					<Dialog open={isDialogOpen} onOpenChange={handleModalChange}>
						<DialogContent className="sm:max-w-lg">
							<DialogHeader>
								<DialogTitle>Visualização avançada</DialogTitle>
								<DialogDescription>Detalhes completos do endereço IP selecionado.</DialogDescription>
							</DialogHeader>
							{selectedIp && (
								<div className="space-y-4 text-sm text-gray-700">
									<div>
										<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Endereço IP</p>
										<p className="text-base font-semibold text-gray-900">{selectedIp.endereco_ip}</p>
									</div>
									<div className="grid gap-3 sm:grid-cols-2">
										<div>
											<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</p>
											<span className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[selectedIp.status]}`}>
												{selectedIp.status}
											</span>
										</div>
										<div>
											<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Responsável</p>
											<p className="mt-1 text-sm">{formatValue(selectedIp.responsavel)}</p>
										</div>
										<div>
											<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Setor</p>
											<p className="mt-1 text-sm">{formatValue(obterSetorLabel(selectedIp.setor))}</p>
										</div>
										<div>
											<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Equipamento</p>
											<p className="mt-1 text-sm">{formatValue(selectedIp.equipamento)}</p>
										</div>
										<div>
											<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Faixa</p>
											<p className="mt-1 text-sm">{formatValue(obterFaixaLabel(selectedIp))}</p>
										</div>
										<div>
											<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cadastrado em</p>
											<p className="mt-1 text-sm">{formatDate(selectedIp.data_cadastro)}</p>
										</div>
									</div>
									<div>
										<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Descrição</p>
										<p className="mt-1 text-sm">{formatValue(selectedIp.descricao)}</p>
									</div>
								</div>
							)}
						</DialogContent>
					</Dialog>
				</div>
			</main>
		</div>
	)
}
