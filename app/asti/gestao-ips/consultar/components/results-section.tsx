"use client"

import { ChevronLeft, ChevronRight, LayoutGrid, MonitorSmartphone, Table as TableIcon } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

import { STATUS_STYLES } from "../constants"
import type { FaixaItem, IpRegistro } from "../types"

type ViewMode = "cards" | "table"

interface ResultsSectionProps {
	consultaModo: "ip" | "faixa"
	viewMode: ViewMode
	onViewModeChange: (mode: ViewMode) => void
	isLoading: boolean
	error: string | null
	totalResults: number
	loadingMessage: string
	emptyMessage: string
	showingRangeStart: number
	showingRangeEnd: number
	itemsPerPage: number
	onItemsPerPageChange: (value: number) => void
	currentPage: number
	totalPages: number
	onPrevPage: () => void
	onNextPage: () => void
	paginatedIps: IpRegistro[]
	paginatedFaixas: FaixaItem[]
	formatDate: (value: string) => string
	formatValue: (value?: string | null) => string
	obterSetorLabel: (value?: string | null) => string | undefined
	obterFaixaLabel: (ip?: IpRegistro | null) => string | undefined
	onOpenAdvancedView: (ip: IpRegistro) => void
	onOpenFaixaView: (faixa: FaixaItem) => void
}

export function ResultsSection({
	consultaModo,
	viewMode,
	onViewModeChange,
	isLoading,
	error,
	totalResults,
	loadingMessage,
	emptyMessage,
	showingRangeStart,
	showingRangeEnd,
	itemsPerPage,
	onItemsPerPageChange,
	currentPage,
	totalPages,
	onPrevPage,
	onNextPage,
	paginatedIps,
	paginatedFaixas,
	formatDate,
	formatValue,
	obterSetorLabel,
	obterFaixaLabel,
	onOpenAdvancedView,
	onOpenFaixaView
}: ResultsSectionProps) {
	const isConsultaFaixa = consultaModo === "faixa"

	const handleItemsPerPageChange = (value: string) => {
		onItemsPerPageChange(Number(value))
	}

	return (
		<Card>
			<CardHeader className="flex flex-wrap items-center justify-between gap-4 sm:flex-nowrap">
				<div className="flex items-center gap-3">
					<span className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-900 text-white">
						<MonitorSmartphone className="h-5 w-5" />
					</span>
					<div>
						<CardTitle className="text-xl">Resultados</CardTitle>
						<p className="text-sm text-muted-foreground">
							{totalResults} {isConsultaFaixa ? "Faixa(s)" : "IP(s)"} encontrado(s)
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => onViewModeChange("cards")}
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
						onClick={() => onViewModeChange("table")}
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
						{loadingMessage}
					</div>
				) : error ? (
					<div className="rounded-md border border-dashed border-red-300 bg-red-50 p-10 text-center text-red-600">
						{error}
					</div>
				) : totalResults === 0 ? (
					<div className="rounded-md border border-dashed border-gray-300 p-10 text-center text-muted-foreground">
						{emptyMessage}
					</div>
				) : isConsultaFaixa ? (
					<div className="space-y-4">
						<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
							<p className="text-sm text-muted-foreground">
								Mostrando {showingRangeStart}-{showingRangeEnd} de {totalResults} faixa(s)
							</p>
							<div className="flex items-center gap-2">
								<Label htmlFor="items-per-page" className="text-xs uppercase text-muted-foreground">
									Por página
								</Label>
								<Select value={String(itemsPerPage)} onValueChange={handleItemsPerPageChange}>
									<SelectTrigger id="items-per-page" className="h-8 w-24">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="6">6</SelectItem>
										<SelectItem value="8">8</SelectItem>
										<SelectItem value="10">10</SelectItem>
										<SelectItem value="12">12</SelectItem>
										<SelectItem value="15">15</SelectItem>
										<SelectItem value="20">20</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
						{viewMode === "cards" ? (
							<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
								{paginatedFaixas.map((faixa) => (
									<div
										key={faixa.id}
										className="group relative overflow-hidden rounded-lg border bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
									>
										<div className="flex items-start justify-between">
											<div>
												<p className="text-xs uppercase tracking-wide text-muted-foreground">Faixa de IP</p>
												<p className="text-lg font-semibold text-gray-900">{faixa.faixa}</p>
											</div>
											<span className="text-xs text-muted-foreground">#{faixa.id}</span>
										</div>
										<div className="mt-4 text-sm text-muted-foreground">
											<p className="font-medium text-gray-700">Descrição</p>
											<p className="line-clamp-2">{formatValue(faixa.descricao)}</p>
										</div>
										<div className="mt-4 flex items-center justify-end">
											<Button type="button" variant="outline" size="sm" onClick={() => onOpenFaixaView(faixa)}>
												Visualização
											</Button>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="overflow-x-auto rounded-lg border">
								<table className="min-w-full divide-y divide-gray-200">
									<thead className="bg-gray-50 sticky top-0">
										<tr>
											<th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
												ID
											</th>
											<th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
												Faixa de IP
											</th>
											<th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
												Descrição
											</th>
											<th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
												Ações
											</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-gray-200 bg-white">
										{paginatedFaixas.map((faixa) => (
											<tr key={faixa.id} className="hover:bg-gray-50">
												<td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">#{faixa.id}</td>
												<td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{faixa.faixa}</td>
												<td className="px-4 py-3 text-sm text-gray-700">
													<div className="max-w-md truncate">{formatValue(faixa.descricao)}</div>
												</td>
												<td className="whitespace-nowrap px-4 py-3 text-right">
													<Button type="button" variant="outline" size="sm" onClick={() => onOpenFaixaView(faixa)}>
														Ver mais
													</Button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
						<div className="flex flex-col items-center justify-between gap-3 border-t border-dashed border-gray-200 pt-4 sm:flex-row">
							<div className="flex items-center gap-2">
								<Button
									type="button"
									variant="outline"
									size="icon"
									onClick={onPrevPage}
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
									onClick={onNextPage}
									disabled={currentPage === totalPages}
									aria-label="Próxima página"
								>
									<ChevronRight className="h-4 w-4" />
								</Button>
							</div>
							<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
								<span>Utilize a busca para localizar faixas específicas.</span>
							</div>
						</div>
					</div>
				) : viewMode === "cards" ? (
					<div className="space-y-4">
						<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
							<p className="text-sm text-muted-foreground">
								Mostrando {showingRangeStart}-{showingRangeEnd} de {totalResults} resultado(s)
							</p>
							<div className="flex items-center gap-2">
								<Label htmlFor="items-per-page" className="text-xs uppercase text-muted-foreground">
									Por página
								</Label>
								<Select value={String(itemsPerPage)} onValueChange={handleItemsPerPageChange}>
									<SelectTrigger id="items-per-page" className="h-8 w-24">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="6">6</SelectItem>
										<SelectItem value="8">8</SelectItem>
										<SelectItem value="10">10</SelectItem>
										<SelectItem value="12">12</SelectItem>
										<SelectItem value="15">15</SelectItem>
										<SelectItem value="20">20</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
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
											<p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-900">{ip.descricao}</p>
										)}
										<div className="mt-4 flex items-center justify-between">
											<span className="text-xs text-muted-foreground">#{ip.id}</span>
											<Button type="button" variant="outline" size="sm" onClick={() => onOpenAdvancedView(ip)}>
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
									onClick={onPrevPage}
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
									onClick={onNextPage}
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
					<div className="overflow-x-auto rounded-lg border">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50 sticky top-0">
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
								{paginatedIps.map((ip) => {
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
												<Button type="button" variant="outline" size="sm" onClick={() => onOpenAdvancedView(ip)}>
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
	)
}
