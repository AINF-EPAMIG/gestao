"use client"

import { useState } from "react"

import Link from "next/link"
import { ArrowLeft, Network } from "lucide-react"

import { SidebarSistema } from "@/components/sidebar-sistema"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export default function CadastroFaixaPage() {
	const [nome, setNome] = useState<string>("")
	const [intervaloInicial, setIntervaloInicial] = useState<string>("")
	const [intervaloFinal, setIntervaloFinal] = useState<string>("")
	const [descricao, setDescricao] = useState<string>("")

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()

		console.log("Registrando faixa de IP", {
			nome,
			intervaloInicial,
			intervaloFinal,
			descricao
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
							aria-label="Voltar para a gestão de IPs"
						>
							<ArrowLeft className="mr-2 h-5 w-5" />
							Voltar
						</Link>
						<h1 className="text-3xl font-bold text-gray-900">Cadastro de faixa</h1>
						<p className="text-gray-600">
							Defina intervalos de IPs para organizar a alocação em redes distintas.
						</p>
					</div>

					<Card className="mx-auto w-full max-w-3xl">
						<CardHeader className="flex flex-row items-center gap-3">
							<span className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-900 text-white">
								<Network className="h-5 w-5" />
							</span>
							<div>
								<CardTitle className="text-xl">Registrar nova faixa de IP</CardTitle>
								<p className="text-sm text-muted-foreground">
									Informe o nome, o intervalo e uma descrição opcional da faixa.
								</p>
							</div>
						</CardHeader>

						<CardContent>
							<form className="space-y-6" onSubmit={handleSubmit}>
								<div className="space-y-2">
									<Label htmlFor="nome">Nome da faixa</Label>
									<Input
										id="nome"
										placeholder="Ex.: Rede interna - Bloco A"
										value={nome}
										onChange={(event) => setNome(event.target.value)}
										required
									/>
								</div>

								<div className="grid gap-4 md:grid-cols-2">
									<div className="space-y-2">
										<Label htmlFor="inicio">IP inicial</Label>
										<Input
											id="inicio"
											placeholder="Ex.: 10.0.0.1"
											value={intervaloInicial}
											onChange={(event) => setIntervaloInicial(event.target.value)}
											required
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="fim">IP final</Label>
										<Input
											id="fim"
											placeholder="Ex.: 10.0.0.50"
											value={intervaloFinal}
											onChange={(event) => setIntervaloFinal(event.target.value)}
											required
										/>
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="descricao">Descrição</Label>
									<Textarea
										id="descricao"
										placeholder="Detalhes adicionais ou observações sobre a faixa"
										value={descricao}
										onChange={(event) => setDescricao(event.target.value)}
										rows={4}
									/>
								</div>

								<div className="flex justify-end">
									<Button type="submit" className="bg-emerald-900 text-white hover:bg-emerald-800">
										Salvar faixa
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
