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
				router.push("/asti/gestao-ips")
			}, 1500)
		} catch (error) {
			console.error("Erro ao cadastrar faixa:", error)
			setFeedback({ type: "error", message: "Erro inesperado ao cadastrar a faixa." })
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
									Informe a faixa e uma descrição para identificá-la com facilidade.
								</p>
							</div>
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

								<div className="flex justify-end">
									<Button
										type="submit"
										className="bg-emerald-900 text-white hover:bg-emerald-800"
										disabled={isSubmitting}
									>
										{isSubmitting ? "Salvando..." : "Salvar faixa"}
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
