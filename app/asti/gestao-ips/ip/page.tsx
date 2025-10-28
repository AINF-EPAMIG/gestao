"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SidebarSistema } from "@/components/sidebar-sistema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ArrowLeft,
  Check,
} from "lucide-react"
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
      {/* Main Content */}
      <main className="flex-1 bg-gray-50">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <Link href="/gestao-ips" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
              <ArrowLeft className="h-5 w-5 mr-2" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestão de Ip&apos;s</h1>
            <p className="text-gray-600">Cadastro de Ip&apos;s</p>
          </div>

          {/* Form Card */}
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="text-xl">Formulário de Cadastro</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Faixa Field */}
                  <div className="space-y-2">
                    <Label htmlFor="faixa">Faixa:</Label>
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
                    <Label htmlFor="ip">Ip:</Label>
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
                  <Button type="submit" className="bg-[#0d5f4e] hover:bg-[#0a4d3f]">
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
