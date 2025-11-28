"use client"

import { useEffect, useRef, useState } from "react"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Network } from "lucide-react"

import { SidebarSistema } from "@/components/sidebar-sistema"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function CadastroFaixaPage() {
	const router = useRouter()
	const [faixa, setFaixa] = useState<string>("")
	const [descricao, setDescricao] = useState<string>("")
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
	const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)
	const redirectTimeout = useRef<NodeJS.Timeout | null>(null)

	useEffect(() => {
		return () => {
			if (redirectTimeout.current) {
				clearTimeout(redirectTimeout.current)
			}
		}
	}, [])

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()

		const faixaNormalizada = faixa.trim()
		const descricaoNormalizada = descricao.trim()

		if (!faixaNormalizada) {
			setFeedback({ type: "error", message: "Informe a faixa de IP." })
			return
		}

		if (!descricaoNormalizada) {
			setFeedback({ type: "error", message: "Informe uma descrição para a faixa." })
			return
		}

		try {
			setIsSubmitting(true)
			setFeedback(null)

			const response = await fetch("/api/gestao-ip/faixa", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					faixa: faixaNormalizada,
					descricao: descricaoNormalizada
				})
			})

			const payload = await response.json()

			if (!response.ok) {
				setFeedback({
					type: "error",
					message: payload?.error ?? "Não foi possível cadastrar a faixa."
				})
				return
			}

			setFeedback({
				type: "success",
				message: `Faixa ${payload?.faixa ?? faixaNormalizada} cadastrada com sucesso.`
			})
			setFaixa("")
			setDescricao("")
			redirectTimeout.current = setTimeout(() => {
				router.push("/asti/home")
			}, 1500)
		} catch (error) {
			console.error("Erro ao cadastrar faixa:", error)
			setFeedback({ type: "error", message: "Erro inesperado ao cadastrar a faixa." })
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 overflow-x-hidden">
			<SidebarSistema />

			<main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
				<div className="w-full">
					<div className="mb-6 flex items-center gap-4">
						<Link
							href="/asti/home"
							className="inline-flex items-center text-gray-600 transition-colors hover:text-gray-900"
							aria-label="Voltar para a gestão de IPs"
						>
							<ArrowLeft className="mr-2 h-5 w-5" />
							Voltar
						</Link>
						<div className="h-6 w-px bg-gray-200" />
						<div className="flex items-center gap-2">
							<Network className="h-5 w-5 text-emerald-600" />
							<h1 className="text-lg font-semibold text-gray-900">Cadastro de faixa</h1>
						</div>
					</div>

					<div className="max-w-7xl mx-auto">
						<Card className="w-full">
							<CardHeader>
								<CardTitle className="text-xl">Registrar nova faixa de IP</CardTitle>
								<p className="text-sm text-muted-foreground">
									Informe a faixa e uma descrição para identificá-la com facilidade.
								</p>
							</CardHeader>

							<CardContent>
								<form className="space-y-6" onSubmit={handleSubmit}>
								<div className="space-y-2">
									<Label htmlFor="faixa">Faixa</Label>
									<Input
										id="faixa"
										placeholder="Ex.: 192.168.0.1 - 192.168.0.50 ou 192.168.0.0/24"
										value={faixa}
										onChange={(event) => setFaixa(event.target.value)}
										required
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="descricao">Descrição</Label>
									<Textarea
										id="descricao"
										placeholder="Detalhes adicionais ou observações sobre a faixa"
										value={descricao}
										onChange={(event) => setDescricao(event.target.value)}
										rows={4}
										required
									/>
								</div>

								{feedback && (
									<p
										className={
											feedback.type === "success"
												? "text-sm font-medium text-emerald-700"
												: "text-sm font-medium text-red-600"
										}
									>
										{feedback.message}
									</p>
								)}

								<div className="flex justify-end gap-3">
									<Button
										type="button"
										variant="destructive"
										onClick={() => router.push("/asti/home")}
										className="bg-red-600 hover:bg-red-700 text-white"
									>
										Cancelar
									</Button>
									<Button
										type="submit"
										className="bg-emerald-600 hover:bg-emerald-700 text-white"
										disabled={isSubmitting}
									>
										{isSubmitting ? "Salvando..." : "Salvar faixa"}
									</Button>
								</div>
							</form>
						</CardContent>
					</Card>
				</div>
			</div>
		</main>
	</div>
	)
}
