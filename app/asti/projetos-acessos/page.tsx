"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SidebarSistema } from '@/components/sidebar-sistema'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Edit, Trash2, PlusCircle } from 'lucide-react'

type Acesso = {
  id: number
  projeto_id: number
  tipo?: string | null
  nome_amigavel?: string | null
  descricao?: string | null
  status?: number
  created_at?: string
  updated_at?: string
}

export default function ProjetosAcessosList() {
  const [items, setItems] = useState<Acesso[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const fetchList = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/projetos-acessos')
      const data = await res.json()
      setItems(data || [])
    } catch (e) {
      console.error(e)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchList() }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('Confirma exclusão?')) return
    await fetch(`/api/projetos-acessos?id=${id}`, { method: 'DELETE' })
    fetchList()
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 overflow-x-hidden">
      <SidebarSistema />
      <main className="flex-1 p-6 pt-16">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Acessos de Projetos</h1>
            <div className="flex gap-2">
              <Button className="bg-emerald-600 text-white" onClick={() => router.push('/asti/projetos-acessos/cadastrar')}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Novo Acesso
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lista</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div>Carregando...</div>
              ) : items.length === 0 ? (
                <div>Nenhum registro encontrado</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead className="text-left text-sm text-gray-600">
                      <tr>
                        <th className="py-2">ID</th>
                        <th className="py-2">Projeto</th>
                        <th className="py-2">Nome Amigável</th>
                        <th className="py-2">Tipo</th>
                        <th className="py-2">Status</th>
                        <th className="py-2 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(i => (
                        <tr key={i.id} className="border-t">
                          <td className="py-2">{i.id}</td>
                          <td className="py-2">{i.projeto_id}</td>
                          <td className="py-2">{i.nome_amigavel || '-'}</td>
                          <td className="py-2">{i.tipo || '-'}</td>
                          <td className="py-2">{i.status === 1 ? 'Ativo' : 'Inativo'}</td>
                          <td className="py-2 text-right">
                            <div className="inline-flex gap-2">
                              <Button size="sm" variant="default" onClick={() => router.push(`/asti/projetos-acessos/editar/${i.id}`)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="default" onClick={() => handleDelete(i.id)} className="bg-red-600 text-white">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
