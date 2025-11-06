"use client"

import type { ChangeEvent } from "react"

import { ChevronDown, Globe, Network, RefreshCcw } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import type { IpStatus } from "../types"

interface FilterPanelProps {
	consultaModo: "ip" | "faixa"
	onChangeConsultaModo: (mode: "ip" | "faixa") => void
	busca: string
	onBuscaChange: (value: string) => void
	buscaFaixa: string
	onBuscaFaixaChange: (value: string) => void
	buscaDescricao: string
	onBuscaDescricaoChange: (value: string) => void
	status: IpStatus | "todos"
	onStatusChange: (value: IpStatus | "todos") => void
	statusOptions: IpStatus[]
	responsavelFiltro: string
	onResponsavelChange: (value: string) => void
	onOpenSetorDialog: () => void
	setorFiltro: string
	setorFiltroLabel: string | null
	isLoadingSetores: boolean
	erroSetores: string | null
	equipamentoFiltro: string
	onEquipamentoChange: (value: string) => void
	equipamentoOptions: string[]
	faixaFiltro: string
	onFaixaChange: (value: string) => void
	faixaOptions: Array<{ value: string; label: string }>
	isLoadingFaixas: boolean
	erroFaixas: string | null
	onClearFilters: () => void
}

export function FilterPanel({
	consultaModo,
	onChangeConsultaModo,
	busca,
	onBuscaChange,
	buscaFaixa,
	onBuscaFaixaChange,
	buscaDescricao,
	onBuscaDescricaoChange,
	status,
	onStatusChange,
	statusOptions,
	responsavelFiltro,
	onResponsavelChange,
	onOpenSetorDialog,
	setorFiltro,
	setorFiltroLabel,
	isLoadingSetores,
	erroSetores,
	equipamentoFiltro,
	onEquipamentoChange,
	equipamentoOptions,
	faixaFiltro,
	onFaixaChange,
	faixaOptions,
	isLoadingFaixas,
	erroFaixas,
	onClearFilters
}: FilterPanelProps) {
	const isConsultaFaixa = consultaModo === "faixa"

	// Removido handleBuscaChange não utilizado

	const handleResponsavelChange = (event: ChangeEvent<HTMLInputElement>) => {
		onResponsavelChange(event.target.value)
	}

	return (
		<Card className="mb-6">
			<CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<CardTitle>Filtros</CardTitle>
				<div className="flex flex-col items-start gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center">
					<span className="text-xs font-semibold uppercase tracking-wide">Modo de consulta</span>
					<div className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white p-1 shadow-sm">
						<button
							type="button"
							onClick={() => onChangeConsultaModo("ip")}
							className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
								consultaModo === "ip"
									? "bg-emerald-900 text-white shadow"
									: "text-emerald-900 hover:bg-emerald-50"
							}`}
							aria-pressed={consultaModo === "ip"}
						>
							<Globe className="h-4 w-4" />
							IP
						</button>
						<button
							type="button"
							onClick={() => onChangeConsultaModo("faixa")}
							className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
								consultaModo === "faixa"
									? "bg-emerald-900 text-white shadow"
									: "text-emerald-900 hover:bg-emerald-50"
							}`}
							aria-pressed={consultaModo === "faixa"}
						>
							<Network className="h-4 w-4" />
							Faixa
						</button>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className={isConsultaFaixa ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" : "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6"}>
					{isConsultaFaixa ? (
						<>
							<div className="space-y-2">
								<Label htmlFor="busca-faixa">Busca por Faixa IP</Label>
								<Input
									id="busca-faixa"
									placeholder="Ex.: 10.0.0"
									value={buscaFaixa}
									onChange={(event) => onBuscaFaixaChange(event.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="busca-descricao">Busca por Descrição</Label>
								<Input
									id="busca-descricao"
									placeholder="Digite parte da descrição"
									value={buscaDescricao}
									onChange={(event) => onBuscaDescricaoChange(event.target.value)}
								/>
							</div>
							<div className="flex items-end">
								<Button type="button" variant="outline" onClick={onClearFilters} className="w-full sm:w-auto sm:min-w-[160px]">
									<RefreshCcw className="mr-2 h-4 w-4" />
									Limpar filtros
								</Button>
							</div>
						</>
					) : (
						<>
							<div className="space-y-2">
								<Label htmlFor="busca">Busca por IP</Label>
								<Input
									id="busca"
									placeholder="Ex.: 10.0.0.10"
									value={busca}
									onChange={(event) => onBuscaChange(event.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="status">Status</Label>
								<Select value={status} onValueChange={onStatusChange}>
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
									onChange={handleResponsavelChange}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="setor">Setor</Label>
								<button
									type="button"
									id="setor"
									className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
									onClick={onOpenSetorDialog}
									disabled={isLoadingSetores}
								>
									<span className={setorFiltro === "todos" && !isLoadingSetores ? "text-muted-foreground" : "text-foreground"}>
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
								<Select value={equipamentoFiltro} onValueChange={onEquipamentoChange}>
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
								<Select value={faixaFiltro} onValueChange={onFaixaChange}>
									<SelectTrigger id="faixa" disabled={isLoadingFaixas}>
										<SelectValue placeholder={isLoadingFaixas ? "Carregando faixas..." : "Filtrar por faixa"} />
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
								<Button type="button" variant="outline" onClick={onClearFilters} className="w-full sm:w-auto sm:min-w-[160px]">
									<RefreshCcw className="mr-2 h-4 w-4" />
									Limpar filtros
								</Button>
							</div>
						</>
					)}
				</div>
			</CardContent>
		</Card>
	)
}
