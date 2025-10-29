"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Link2 } from "lucide-react"

import { SidebarSistema } from "@/components/sidebar-sistema"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

const equipamentosMock = [
	{ id: "1", nome: "Servidor ASTI" },
	{ id: "2", nome: "Switch Principal" },
	{ id: "3", nome: "Notebook Suporte" }
]

const ipsDisponiveisMock = [
	{ id: "ip-1", endereco: "10.0.0.15" },
	{ id: "ip-2", endereco: "10.0.0.27" },
	{ id: "ip-3", endereco: "2001:db8::1" }
]

export default function AssociarIpPage() {
	const [equipamentoSelecionado, setEquipamentoSelecionado] = useState<string>("")
	const [ipSelecionado, setIpSelecionado] = useState<string>("")
	const [responsavel, setResponsavel] = useState<string>("")

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()

		if (!equipamentoSelecionado || !ipSelecionado) {
			console.warn("Selecione um equipamento e um IP disponível antes de continuar.")
			return
		}

		console.log("Associando IP ao equipamento", {
			equipamento: equipamentoSelecionado,
			ip: ipSelecionado,
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
										<Label htmlFor="ip">IP disponível</Label>
										<Select value={ipSelecionado} onValueChange={setIpSelecionado}>
											<SelectTrigger id="ip">
												<SelectValue placeholder="Selecione um IP" />
											</SelectTrigger>
											<SelectContent>
												{ipsDisponiveisMock.map((ip) => (
													<SelectItem key={ip.id} value={ip.id}>
														{ip.endereco}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
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
