"use client"

import { useMemo, useState } from "react"

import Link from "next/link"
import { ArrowLeft, MonitorSmartphone, RefreshCcw } from "lucide-react"

import { SidebarSistema } from "@/components/sidebar-sistema"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

type IpStatus = "Disponível" | "Em Uso" | "Reservado" | "Manutenção"

interface IpRegistro {
	id: string
	endereco: string
	status: IpStatus
	faixa?: string
	equipamentoAssociado?: string
}

const ipsMock: IpRegistro[] = [
	{ id: "1", endereco: "10.0.0.10", status: "Disponível", faixa: "Rede interna" },
	{ id: "2", endereco: "10.0.0.11", status: "Em Uso", faixa: "Rede interna", equipamentoAssociado: "Servidor ASTI" },
	{ id: "3", endereco: "10.0.0.15", status: "Reservado", faixa: "Rede interna" },
	{ id: "4", endereco: "2001:db8::1", status: "Disponível", faixa: "Rede IPv6" },
	{ id: "5", endereco: "2001:db8::2", status: "Manutenção", faixa: "Rede IPv6" }
]

export default function ConsultarIpsPage() {
	const [busca, setBusca] = useState<string>("")
	const [status, setStatus] = useState<IpStatus | "todos">("todos")

	const ipsFiltrados = useMemo(() => {
		return ipsMock.filter((ip) => {
			const correspondeBusca = ip.endereco.toLowerCase().includes(busca.toLowerCase())
			const correspondeStatus = status === "todos" || ip.status === status
			return correspondeBusca && correspondeStatus
		})
	}, [busca, status])

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
							<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
											<SelectItem value="Disponível">Disponível</SelectItem>
											<SelectItem value="Em Uso">Em uso</SelectItem>
											<SelectItem value="Reservado">Reservado</SelectItem>
											<SelectItem value="Manutenção">Manutenção</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className="flex items-end">
									<Button
										type="button"
										variant="outline"
										onClick={() => {
											setBusca("")
											setStatus("todos")
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
						<CardHeader className="flex flex-row items-center gap-3">
							<span className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-900 text-white">
								<MonitorSmartphone className="h-5 w-5" />
							</span>
							<div>
								<CardTitle className="text-xl">Resultados</CardTitle>
								<p className="text-sm text-muted-foreground">
									{ipsFiltrados.length} IP(s) encontrado(s)
								</p>
							</div>
						</CardHeader>

						<CardContent>
							{ipsFiltrados.length === 0 ? (
								<div className="rounded-md border border-dashed border-gray-300 p-10 text-center text-muted-foreground">
									Nenhum IP corresponde aos filtros aplicados.
								</div>
							) : (
								<ScrollArea className="max-h-[480px]">
									<div className="grid gap-4 md:grid-cols-2">
										{ipsFiltrados.map((ip) => (
											<div key={ip.id} className="rounded-lg border bg-white p-4 shadow-sm">
												<div className="flex items-center justify-between">
													<div>
														<p className="text-sm text-muted-foreground">Endereço IP</p>
														<p className="text-lg font-semibold text-gray-900">{ip.endereco}</p>
													</div>
													<span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
														{ip.status}
													</span>
												</div>

												<div className="mt-4 space-y-2 text-sm text-muted-foreground">
													<p>
														<span className="font-medium text-gray-700">Faixa:</span> {ip.faixa ?? "Não informada"}
													</p>
													<p>
														<span className="font-medium text-gray-700">Equipamento associado:</span> {ip.equipamentoAssociado ?? "Disponível"}
													</p>
												</div>
											</div>
										))}
									</div>
								</ScrollArea>
							)}
						</CardContent>
					</Card>
				</div>
			</main>
		</div>
	)
}
