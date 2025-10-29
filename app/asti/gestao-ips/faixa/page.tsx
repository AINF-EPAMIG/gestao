"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { ArrowLeft, Network } from "lucide-react"

import { SidebarSistema } from "@/components/sidebar-sistema"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"

interface FaixaIp {
	id: string
	nome: string
	intervaloInicial: string
	intervaloFinal: string
	descricao?: string
}

const faixasMock: FaixaIp[] = [
	{
		id: "1",
		nome: "Rede interna - Bloco A",
		intervaloInicial: "10.0.0.1",
		intervaloFinal: "10.0.0.50",
		descricao: "Faixa dedicada aos servidores e equipamentos críticos do bloco A."
	},
	{
		id: "2",
		nome: "Rede interna - Bloco B",
		intervaloInicial: "10.0.1.1",
		intervaloFinal: "10.0.1.50",
		descricao: "Faixa utilizada para estações de trabalho do bloco B."
	},
	{
		id: "3",
		nome: "Rede IPv6",
		intervaloInicial: "2001:db8::1",
		intervaloFinal: "2001:db8::ffff",
		descricao: "Faixa experimental para equipamentos com suporte a IPv6."
	}
]

export default function ListarFaixasPage() {
	const [busca, setBusca] = useState<string>("")

	const faixasFiltradas = useMemo(() => {
		return faixasMock.filter((faixa) =>
			faixa.nome.toLowerCase().includes(busca.toLowerCase()) ||
			faixa.intervaloInicial.includes(busca) ||
			faixa.intervaloFinal.includes(busca)
		)
	}, [busca])

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
						<div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
							<div>
								<h1 className="text-3xl font-bold text-gray-900">Faixas de IP cadastradas</h1>
								<p className="text-gray-600">
									Consulte e gerencie os intervalos de IP disponíveis na sua rede.
								</p>
							</div>

							<Button asChild className="bg-emerald-900 text-white hover:bg-emerald-800">
								<Link href="/asti/gestao-ips/faixa/cadastrar">Cadastrar nova faixa</Link>
							</Button>
						</div>
					</div>

					<Card className="mb-6">
						<CardHeader>
							<CardTitle>Buscar faixa</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="busca">Termo de busca</Label>
									<Input
										id="busca"
										placeholder="Digite o nome ou parte do intervalo"
										value={busca}
										onChange={(event) => setBusca(event.target.value)}
									/>
								</div>

								<div className="flex items-end">
									<Button
										type="button"
										variant="outline"
										onClick={() => setBusca("")}
										className="w-full"
									>
										Limpar filtros
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center gap-3">
							<span className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-900 text-white">
								<Network className="h-5 w-5" />
							</span>
							<div>
								<CardTitle className="text-xl">Resultados</CardTitle>
								<p className="text-sm text-muted-foreground">
									{faixasFiltradas.length} faixa(s) encontrada(s)
								</p>
							</div>
						</CardHeader>
						<CardContent>
							{faixasFiltradas.length === 0 ? (
								<div className="rounded-md border border-dashed border-gray-300 p-10 text-center text-muted-foreground">
									Nenhuma faixa encontrada com os filtros selecionados.
								</div>
							) : (
								<ScrollArea className="max-h-[480px]">
									<div className="grid gap-4 md:grid-cols-2">
										{faixasFiltradas.map((faixa) => (
											<div key={faixa.id} className="rounded-lg border bg-white p-4 shadow-sm">
												<h2 className="text-lg font-semibold text-gray-900">{faixa.nome}</h2>
												<div className="mt-3 space-y-1 text-sm text-muted-foreground">
													<p>
														<span className="font-medium text-gray-700">Intervalo:</span> {faixa.intervaloInicial} - {faixa.intervaloFinal}
													</p>
													<p>
														<span className="font-medium text-gray-700">Descrição:</span> {faixa.descricao ?? "Sem descrição"}
													</p>
												</div>
												<div className="mt-4 flex justify-end">
													<Button variant="ghost" className="text-emerald-900 hover:text-emerald-800">
														Ver detalhes
													</Button>
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
