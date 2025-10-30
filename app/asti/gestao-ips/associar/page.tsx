"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Link2 } from "lucide-react"

import { SidebarSistema } from "@/components/sidebar-sistema"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
	{ id: "3", nome: "Notebook Suporte" }
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

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()

		if (!equipamentoSelecionado || !ipSelecionado || !setorSelecionado) {
			console.warn("Selecione um equipamento, um setor e um IP disponível antes de continuar.")
			return
		}

		console.log("Associando IP ao equipamento", {
			equipamento: equipamentoSelecionado,
			ip: ipSelecionado,
			setor: setorSelecionado,
			responsavel
		})
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
										<Select value={equipamentoSelecionado} onValueChange={setEquipamentoSelecionado}>
											<SelectTrigger id="equipamento">
												<SelectValue placeholder="Selecione um equipamento" />
											</SelectTrigger>
											<SelectContent>
												{equipamentosMock.map((equipamento) => (
													<SelectItem key={equipamento.id} value={equipamento.id}>
														{equipamento.nome}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									<div className="space-y-2">
										<Label htmlFor="setor">Setor</Label>
										<div className="relative">
											<Select
												value={setorSelecionado}
												onValueChange={setSetorSelecionado}
												disabled={isLoadingSetores || !!erroCarregarSetores || setores.length === 0}
											>
												<SelectTrigger id="setor">
													<SelectValue
														placeholder={isLoadingSetores ? "Carregando setores..." : "Selecione um setor"}
													/>
												</SelectTrigger>
												<SelectContent className="max-h-64 overflow-y-auto">
													{setores.map((setor) => (
														<SelectItem key={setor.id} value={String(setor.id)}>
															{setor.sigla || setor.nome}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										{erroCarregarSetores && <p className="text-sm text-red-600">{erroCarregarSetores}</p>}
									</div>

									<div className="space-y-2">
										<Label htmlFor="ip">IP disponível</Label>
										<div className="relative">
											<Select
												value={ipSelecionado}
												onValueChange={setIpSelecionado}
												disabled={isLoadingIps || !!erroCarregarIps || ipsDisponiveis.length === 0}
											>
												<SelectTrigger id="ip">
													<SelectValue
														placeholder={isLoadingIps ? "Carregando IPs..." : "Selecione um IP"}
													/>
												</SelectTrigger>
												<SelectContent className="max-h-64 overflow-y-auto">
													{ipsDisponiveis.map((ip) => (
														<SelectItem key={ip.id} value={String(ip.id)}>
															{ip.endereco_ip}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										{erroCarregarIps && <p className="text-sm text-red-600">{erroCarregarIps}</p>}
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

								<div className="flex justify-end">
									<Button type="submit" className="bg-emerald-900 text-white hover:bg-emerald-800">
										Registrar associação
									</Button>
								</div>
							</form>
						</CardContent>
					</Card>
				</div>
			</main>
		</div>
	)
}
