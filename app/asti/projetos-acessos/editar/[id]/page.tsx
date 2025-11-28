"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import { SidebarSistema } from '@/components/sidebar-sistema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function EditarAcessoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  type Acesso = {
    id: number
    projeto_id: number
    tipo?: string | null
    nome_amigavel?: string | null
    descricao?: string | null
    status?: number | null
    created_at?: string | null
    updated_at?: string | null
    [key: string]: unknown
  }
  const [item, setItem] = useState<Acesso | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const res = await fetch(`/api/projetos-acessos?id=${id}`)
      const data = await res.json()
      setItem(Array.isArray(data) ? data[0] : data)
      setLoading(false)
    }
    load()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch('/api/projetos-acessos', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) })
    router.push('/asti/projetos-acessos')
  }

  if (loading) return <div className="flex min-h-screen"><SidebarSistema /><main className="flex-1 p-6 pt-16">Carregando...</main></div>

  if (!item) return <div className="flex min-h-screen"><SidebarSistema /><main className="flex-1 p-6 pt-16">Registro não encontrado</main></div>

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 overflow-x-hidden">
      <SidebarSistema />
      <main className="flex-1 p-6 pt-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Editar Acesso #{item.id}</h1>
          <Card>
            <CardHeader>
              <CardTitle>Dados</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Projeto ID</Label>
                  <Input value={item.projeto_id} onChange={e => setItem({...item, projeto_id: Number(e.target.value)})} />
                </div>
                <div>
                  <Label>Nome amigável</Label>
                  <Input value={item.nome_amigavel || ''} onChange={e => setItem({...item, nome_amigavel: e.target.value})} />
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Input value={item.tipo || ''} onChange={e => setItem({...item, tipo: e.target.value})} />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea value={item.descricao || ''} onChange={e => setItem({...item, descricao: e.target.value})} />
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
