"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Check } from "lucide-react"

import { SidebarSistema } from "@/components/sidebar-sistema"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface FaixaItem {
  id: number
  faixa: string
  descricao: string
}

export default function CadastroIPPage() {
  const router = useRouter()
  const [descricao, setDescricao] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [faixaSelecionada, setFaixaSelecionada] = useState<string>("")
  const [ipComplemento, setIpComplemento] = useState("")
  const [faixas, setFaixas] = useState<FaixaItem[]>([])
  const [isLoadingFaixas, setIsLoadingFaixas] = useState<boolean>(false)
  const [faixaErro, setFaixaErro] = useState<string | null>(null)
  const redirectTimeout = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const carregarFaixas = async () => {
      try {
        setIsLoadingFaixas(true)
        const response = await fetch("/api/gestao-ip/faixa")
        if (!response.ok) {
          throw new Error("Falha ao carregar faixas")
        }
        const data = (await response.json()) as FaixaItem[]
        setFaixas(data)
        setFaixaErro(null)
      } catch (error) {
        console.error("Erro ao carregar faixas:", error)
        setFaixaErro("Não foi possível carregar as faixas disponíveis.")
      } finally {
        setIsLoadingFaixas(false)
      }
    }

    carregarFaixas()
  }, [])

  useEffect(() => {
    return () => {
      if (redirectTimeout.current) {
        clearTimeout(redirectTimeout.current)
      }
    }
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const faixa = faixas.find((item) => String(item.id) === faixaSelecionada)
    if (!faixa) {
      setFeedback({ type: "error", message: "Selecione uma faixa de IP." })
      return
    }

    const complementoLimpo = ipComplemento.trim().replace(/^\.+/, "")
    if (!complementoLimpo) {
      setFeedback({ type: "error", message: "Informe o final do endereço IP." })
      return
    }

    const enderecoCompleto = `${faixa.faixa}${complementoLimpo}`

    if (faixa.faixa.includes(":") && complementoLimpo.includes("::")) {
      setFeedback({ type: "error", message: "Ajuste o sufixo IPv6 para evitar :: duplicado." })
      return
    }

    try {
      setIsSubmitting(true)
      setFeedback(null)

      const response = await fetch("/api/gestao-ip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endereco_ip: enderecoCompleto,
          status: "Disponível",
          descricao: descricao.trim()
        })
      })

      const payload = await response.json()

      if (!response.ok) {
        setFeedback({
          type: "error",
          message: payload?.error ?? "Não foi possível cadastrar o IP."
        })
        return
      }

      setFeedback({
        type: "success",
        message: `IP ${payload?.endereco_ip ?? enderecoCompleto} cadastrado com sucesso.`
      })
      setFaixaSelecionada("")
      setIpComplemento("")
      setDescricao("")
      redirectTimeout.current = setTimeout(() => {
        router.push("/asti/home")
      }, 1500)
    } catch (error) {
      console.error("Erro ao cadastrar IP:", error)
      setFeedback({ type: "error", message: "Erro inesperado ao cadastrar o IP." })
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
              <Check className="h-5 w-5 text-emerald-600" />
              <h1 className="text-lg font-semibold text-gray-900">Cadastro de IP</h1>
            </div>
          </div>

          <div className="max-w-7xl mx-auto">
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-xl">Formulário de cadastro de IP</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Informe os dados necessários para disponibilizar o endereço no catálogo da rede.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="faixa">Faixa</Label>
                    <Select
                      value={faixaSelecionada}
                      onValueChange={setFaixaSelecionada}
                      disabled={isLoadingFaixas || !!faixaErro}
                    >
                      <SelectTrigger id="faixa">
                        <SelectValue
                          placeholder={
                            isLoadingFaixas
                              ? "Carregando faixas..."
                              : faixas.length === 0
                                ? "Nenhuma faixa encontrada"
                                : "Selecione a faixa"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {faixas.length === 0 ? (
                          <SelectItem disabled value="__nenhuma_faixa__">
                            Nenhuma faixa encontrada
                          </SelectItem>
                        ) : (
                          faixas.map((faixaItem) => (
                            <SelectItem key={faixaItem.id} value={String(faixaItem.id)}>
                              {faixaItem.descricao}
                              {!!faixaItem.faixa && ` (${faixaItem.faixa})`}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {faixaErro && <p className="text-sm text-red-600">{faixaErro}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ip">Final do IP</Label>
                    <Input
                      id="ip"
                      type="text"
                      placeholder="Ex.: 25"
                      value={ipComplemento}
                      onChange={(event) => setIpComplemento(event.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    placeholder="Detalhes adicionais sobre o uso do IP (opcional)"
                    value={descricao}
                    onChange={(event) => setDescricao(event.target.value)}
                    rows={4}
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

                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    Endereço completo:&nbsp;
                    <strong>
                      {(() => {
                        const faixa = faixas.find((item) => String(item.id) === faixaSelecionada)
                        return faixa
                          ? `${faixa.faixa}${ipComplemento.trim().replace(/^\.+/, "") || "__"}`
                          : "Selecione a faixa"
                      })()}
                    </strong>
                  </p>
                </div>

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
                    <Check className="h-4 w-4 mr-2" />
                    {isSubmitting ? "Cadastrando..." : "Cadastrar"}
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
