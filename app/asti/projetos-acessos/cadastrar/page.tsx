"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SidebarSistema } from '@/components/sidebar-sistema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function CadastrarAcesso() {
  const [projetoId, setProjetoId] = useState('')
  const [tipo, setTipo] = useState('')
  const [nomeAmigavel, setNomeAmigavel] = useState('')
  const [descricao, setDescricao] = useState('')
  const status = 1
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch('/api/projetos-acessos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projeto_id: Number(projetoId), tipo, nome_amigavel: nomeAmigavel, descricao, status })
    })
    router.push('/asti/projetos-acessos')
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 overflow-x-hidden">
      <SidebarSistema />
      <main className="flex-1 p-6 pt-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Cadastrar Acesso</h1>
          <Card>
            <CardHeader>
              <CardTitle>Dados</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Projeto ID</Label>
                  <Input value={projetoId} onChange={e => setProjetoId(e.target.value)} />
                </div>
                <div>
                  <Label>Nome amigável</Label>
                  <Input value={nomeAmigavel} onChange={e => setNomeAmigavel(e.target.value)} />
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Input value={tipo} onChange={e => setTipo(e.target.value)} />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} />
                </div>
                <div className="flex items-center gap-2">
                  <Button type="submit" className="bg-yellow-500 text-white">Salvar</Button>
                  <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
