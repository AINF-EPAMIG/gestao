"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SidebarSistema } from "@/components/sidebar-sistema"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Check } from "lucide-react"
import Link from "next/link"

export default function CadastroIPPage() {
  const [faixa, setFaixa] = useState("")
  const [ip, setIp] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Cadastrando IP:", { faixa, ip })
    // Add your submission logic here
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
            <h1 className="text-3xl font-bold text-gray-900">Cadastro de IP</h1>
            <p className="text-gray-600">
              Registre um novo endereço e associe-o a uma faixa para manter o controle atualizado.
            </p>
          </div>

          <Card className="mx-auto w-full max-w-3xl">
            <CardHeader className="flex flex-row items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-900 text-white">
                <Check className="h-5 w-5" />
              </span>
              <div>
                <CardTitle className="text-xl">Formulário de cadastro de IP</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Informe os dados necessários para disponibilizar o endereço no catálogo da rede.
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Faixa Field */}
                  <div className="space-y-2">
                    <Label htmlFor="faixa">Faixa</Label>
                    <Select value={faixa} onValueChange={setFaixa}>
                      <SelectTrigger id="faixa">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="faixa1">Faixa 1</SelectItem>
                        <SelectItem value="faixa2">Faixa 2</SelectItem>
                        <SelectItem value="faixa3">Faixa 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* IP Field */}
                  <div className="space-y-2">
                    <Label htmlFor="ip">IP</Label>
                    <Input
                      id="ip"
                      type="text"
                      placeholder="Digite o Ip"
                      value={ip}
                      onChange={(e) => setIp(e.target.value)}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                  <Button type="submit" className="bg-emerald-900 text-white hover:bg-emerald-800">
                    <Check className="h-4 w-4 mr-2" />
                    Cadastrar
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
