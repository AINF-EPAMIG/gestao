"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Link2, ChevronDown } from "lucide-react"

import { SidebarSistema } from "@/components/sidebar-sistema"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface IpDisponivel {
	id: number
	endereco_ip: string
}

interface SetorItem {
	id: number
	nome: string
	sigla: string
}

const equipamentosMock = [
	{ id: "1", nome: "Servidor ASTI" },
	{ id: "2", nome: "Switch Principal" },
	{ id: "3", nome: "Notebook Suporte" },
	{ id: "outros", nome: "Outros" }
]

export default function AssociarIpPage() {
	const [equipamentoSelecionado, setEquipamentoSelecionado] = useState<string>("")
	const [ipSelecionado, setIpSelecionado] = useState<string>("")
	const [responsavel, setResponsavel] = useState<string>("")
	const [setorSelecionado, setSetorSelecionado] = useState<string>("")
	const [ipsDisponiveis, setIpsDisponiveis] = useState<IpDisponivel[]>([])
	const [setores, setSetores] = useState<SetorItem[]>([])
	const [isLoadingIps, setIsLoadingIps] = useState<boolean>(false)
	const [isLoadingSetores, setIsLoadingSetores] = useState<boolean>(false)
	const [erroCarregarIps, setErroCarregarIps] = useState<string | null>(null)
	const [erroCarregarSetores, setErroCarregarSetores] = useState<string | null>(null)
	const [isEquipamentoDialogOpen, setIsEquipamentoDialogOpen] = useState(false)
	const [isSetorDialogOpen, setIsSetorDialogOpen] = useState(false)
	const [isIpDialogOpen, setIsIpDialogOpen] = useState(false)
	const [equipamentoBusca, setEquipamentoBusca] = useState("")
	const [setorBusca, setSetorBusca] = useState("")
	const [ipBusca, setIpBusca] = useState("")
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [submitError, setSubmitError] = useState<string | null>(null)
	const [submitSuccess, setSubmitSuccess] = useState(false)
	const [outroEquipamento, setOutroEquipamento] = useState("")

	useEffect(() => {
		const fetchIps = async () => {
			try {
				setIsLoadingIps(true)
				const response = await fetch("/api/gestao-ip?status=Disponível")
				if (!response.ok) {
					throw new Error("Falha ao carregar IPs")
				}
				const data = (await response.json()) as IpDisponivel[]
				setIpsDisponiveis(data)
				setErroCarregarIps(null)
			} catch (error) {
				console.error("Erro ao carregar IPs disponíveis:", error)
				setErroCarregarIps("Não foi possível carregar os IPs disponíveis.")
			} finally {
				setIsLoadingIps(false)
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
				setErroCarregarSetores(null)
			} catch (error) {
				console.error("Erro ao carregar setores:", error)
				setErroCarregarSetores("Não foi possível carregar os setores.")
			} finally {
				setIsLoadingSetores(false)
			}
		}

		fetchIps()
		fetchSetores()
	}, [])

	const equipamentosFiltrados = useMemo(() => {
		const termo = equipamentoBusca.trim().toLowerCase()
		if (!termo) return equipamentosMock
		return equipamentosMock.filter((equipamento) => equipamento.nome.toLowerCase().includes(termo))
	}, [equipamentoBusca])

	const setoresFiltrados = useMemo(() => {
		const termo = setorBusca.trim().toLowerCase()
		if (!termo) return setores
		return setores.filter((setor) => {
			const sigla = setor.sigla?.toLowerCase() ?? ""
			const nome = setor.nome?.toLowerCase() ?? ""
			return sigla.includes(termo) || nome.includes(termo)
		})
	}, [setorBusca, setores])

	const ipsFiltrados = useMemo(() => {
		const termo = ipBusca.trim().toLowerCase()
		if (!termo) return ipsDisponiveis
		return ipsDisponiveis.filter((ip) => ip.endereco_ip.toLowerCase().includes(termo))
	}, [ipBusca, ipsDisponiveis])

	const equipamentoSelecionadoLabel = useMemo(() => {
		const equipamento = equipamentosMock.find((equipamento) => equipamento.id === equipamentoSelecionado)
		if (equipamento?.id === "outros" && outroEquipamento) {
			return outroEquipamento
		}
		return equipamento?.nome ?? ""
	}, [equipamentoSelecionado, outroEquipamento])

	const setorSelecionadoLabel = useMemo(() => {
		const setor = setores.find((item) => String(item.id) === setorSelecionado)
		if (!setor) return ""
		return setor.sigla || setor.nome || `Setor ${setor.id}`
	}, [setorSelecionado, setores])

	const ipSelecionadoLabel = useMemo(() => {
		return ipsDisponiveis.find((ip) => String(ip.id) === ipSelecionado)?.endereco_ip ?? ""
	}, [ipSelecionado, ipsDisponiveis])

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setSubmitError(null)

		if (!equipamentoSelecionado || !ipSelecionado || !setorSelecionado) {
			setSubmitError("Selecione um equipamento, um setor e um IP disponível antes de continuar.")
			return
		}

		if (equipamentoSelecionado === "outros" && !outroEquipamento.trim()) {
			setSubmitError("Digite o nome do equipamento quando selecionar 'Outros'.")
			return
		}

		try {
			setIsSubmitting(true)
			
			const response = await fetch("/api/gestao-ip/associar", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					id: ipSelecionado,
					responsavel,
					setor: setorSelecionadoLabel,
					equipamento: equipamentoSelecionado === "outros" ? outroEquipamento : equipamentoSelecionadoLabel,
				}),
			})

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.error || "Erro ao associar IP")
			}

			setSubmitSuccess(true)
			
			// Redirecionar após 2 segundos
			setTimeout(() => {
				window.location.href = "/asti/gestao-ips"
			}, 2000)

		} catch (error) {
			console.error("Erro ao associar IP:", error)
			setSubmitError(error instanceof Error ? error.message : "Erro desconhecido")
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<div className="flex min-h-screen overflow-x-hidden">
			<SidebarSistema />

			<main className="flex-1 min-w-0 bg-gray-50 pt-16 lg:pt-0">
				<div className="p-4 sm:p-6 lg:p-8">
					<div className="mb-8 flex flex-col gap-2">
						<Link
							href="/asti/gestao-ips"
							className="inline-flex items-center text-gray-600 transition-colors hover:text-gray-900"
							aria-label="Voltar para a página de gestão de IPs"
						>
							<ArrowLeft className="mr-2 h-5 w-5" />
							Voltar
						</Link>
						<h1 className="text-3xl font-bold text-gray-900">Associação de IPs</h1>
						<p className="text-gray-600">
							Relacione IPs disponíveis aos equipamentos do setor para manter o controle atualizado.
						</p>
					</div>

					<Card className="mx-auto w-full max-w-3xl">
						<CardHeader className="flex flex-row items-center gap-3">
							<span className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-900 text-white">
								<Link2 className="h-5 w-5" />
							</span>
							<div>
								<CardTitle className="text-xl">Associar IP a equipamento</CardTitle>
								<p className="text-sm text-muted-foreground">
									Preencha as informações abaixo para registrar a alocação do endereço IP.
								</p>
							</div>
						</CardHeader>

						<CardContent>
							<form className="space-y-6" onSubmit={handleSubmit}>
								<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
									<div className="space-y-2">
										<Label htmlFor="equipamento">Equipamento</Label>
										<button
											type="button"
											className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
											onClick={() => setIsEquipamentoDialogOpen(true)}
										>
											<span className={equipamentoSelecionadoLabel ? "text-foreground" : "text-muted-foreground"}>
												{equipamentoSelecionadoLabel || "Selecione um equipamento"}
											</span>
											<ChevronDown className="h-4 w-4 opacity-50" />
										</button>
									</div>

									{equipamentoSelecionado === "outros" && (
										<div className="space-y-2 md:col-span-2">
											<Label htmlFor="outroEquipamento">Nome do equipamento</Label>
											<Input
												id="outroEquipamento"
												placeholder="Ex: Desktop Dell, Impressora HP 2° Andar, Roteador TP-Link..."
												value={outroEquipamento}
												onChange={(event) => setOutroEquipamento(event.target.value)}
											/>
										</div>
									)}

									<div className="space-y-2">
										<Label htmlFor="ip">IP disponível</Label>
										<button
											type="button"
											className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
											disabled={isLoadingIps || !!erroCarregarIps || ipsDisponiveis.length === 0}
											onClick={() => setIsIpDialogOpen(true)}
										>
											<span className={ipSelecionadoLabel ? "text-foreground" : "text-muted-foreground"}>
												{ipSelecionadoLabel || (isLoadingIps ? "Carregando IPs..." : "Selecione um IP")}
											</span>
											<ChevronDown className="h-4 w-4 opacity-50" />
										</button>
										{erroCarregarIps && <p className="text-sm text-red-600">{erroCarregarIps}</p>}
									</div>

									<div className="space-y-2">
										<Label htmlFor="setor">Setor</Label>
										<button
											type="button"
											className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
											disabled={isLoadingSetores || !!erroCarregarSetores || setores.length === 0}
											onClick={() => setIsSetorDialogOpen(true)}
										>
											<span className={setorSelecionadoLabel ? "text-foreground" : "text-muted-foreground"}>
												{setorSelecionadoLabel || (isLoadingSetores ? "Carregando setores..." : "Selecione um setor")}
											</span>
											<ChevronDown className="h-4 w-4 opacity-50" />
										</button>
										{erroCarregarSetores && <p className="text-sm text-red-600">{erroCarregarSetores}</p>}
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="responsavel">Responsável</Label>
									<Input
										id="responsavel"
										placeholder="Nome do responsável pela máquina"
										value={responsavel}
										onChange={(event) => setResponsavel(event.target.value)}
									/>
								</div>

								{submitError && (
									<div className="rounded-md bg-red-50 p-4">
										<p className="text-sm text-red-600">{submitError}</p>
									</div>
								)}

								{submitSuccess && (
									<div className="rounded-md bg-green-50 p-4">
										<p className="text-sm text-green-600">
											IP associado com sucesso! Redirecionando...
										</p>
									</div>
								)}

								<div className="flex justify-end">
									<Button 
										type="submit" 
										className="bg-emerald-900 text-white hover:bg-emerald-800"
										disabled={isSubmitting}
									>
										{isSubmitting ? "Salvando..." : "Registrar associação"}
									</Button>
								</div>
							</form>
						</CardContent>
					</Card>
				</div>
			</main>

			{/* Modal Equipamento */}
			<Dialog open={isEquipamentoDialogOpen} onOpenChange={setIsEquipamentoDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Selecionar Equipamento</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<Input
							placeholder="Pesquisar equipamento..."
							value={equipamentoBusca}
							onChange={(e) => setEquipamentoBusca(e.target.value)}
						/>
						<div className="max-h-64 overflow-y-auto space-y-2">
							{equipamentosFiltrados.map((equipamento) => (
								<Button
									key={equipamento.id}
									type="button"
									variant={equipamentoSelecionado === equipamento.id ? "default" : "outline"}
									className="w-full justify-start"
									onClick={() => {
										setEquipamentoSelecionado(equipamento.id)
										setIsEquipamentoDialogOpen(false)
										setEquipamentoBusca("")
										if (equipamento.id !== "outros") {
											setOutroEquipamento("")
										}
									}}
								>
									{equipamento.nome}
								</Button>
							))}
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Modal Setor */}
			<Dialog open={isSetorDialogOpen} onOpenChange={setIsSetorDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Selecionar Setor</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<Input
							placeholder="Pesquisar setor..."
							value={setorBusca}
							onChange={(e) => setSetorBusca(e.target.value)}
						/>
						<div className="max-h-64 overflow-y-auto space-y-2">
							{setoresFiltrados.map((setor) => (
								<Button
									key={setor.id}
									type="button"
									variant={setorSelecionado === String(setor.id) ? "default" : "outline"}
									className="w-full justify-start"
									onClick={() => {
										setSetorSelecionado(String(setor.id))
										setIsSetorDialogOpen(false)
										setSetorBusca("")
									}}
								>
									{setor.sigla || setor.nome}
								</Button>
							))}
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Modal IP */}
			<Dialog open={isIpDialogOpen} onOpenChange={setIsIpDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Selecionar IP</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<Input
							placeholder="Pesquisar IP..."
							value={ipBusca}
							onChange={(e) => setIpBusca(e.target.value)}
						/>
						<div className="max-h-64 overflow-y-auto space-y-2">
							{ipsFiltrados.map((ip) => (
								<Button
									key={ip.id}
									type="button"
									variant={ipSelecionado === String(ip.id) ? "default" : "outline"}
									className="w-full justify-start"
									onClick={() => {
										setIpSelecionado(String(ip.id))
										setIsIpDialogOpen(false)
										setIpBusca("")
									}}
								>
									{ip.endereco_ip}
								</Button>
							))}
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	)
}
