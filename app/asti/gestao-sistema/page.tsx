'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, ExternalLink, Eye, Search, Filter, Table as TableIcon } from 'lucide-react';
import { Sistema } from '@/types/sistema';
import { SistemaDetailsDialog } from '@/components/sistema-details-dialog';
import { SidebarSistema } from '@/components/sidebar-sistema';
import Link from 'next/link';
import { getTipoLabel, getStatusLabel } from '@/lib/sistema-utils';

const statusColors: Record<number, string> = {
  1: 'bg-green-500',      // Produção
  2: 'bg-blue-500',       // Em Desenvolvimento
  3: 'bg-yellow-500',     // Manutenção
  4: 'bg-red-500',        // Descontinuado
};

const tipoColors: Record<number, string> = {
  1: 'bg-purple-500',     // Sistema
  2: 'bg-cyan-500',       // Site
  3: 'bg-orange-500',     // API
  4: 'bg-indigo-500',     // Mobile
  5: 'bg-pink-500',       // Rotina
  6: 'bg-gray-500',       // Infraestrutura
  7: 'bg-slate-500',      // Outros
};

export default function GestaoSistemaPage() {
  const [sistemas, setSistemas] = useState<Sistema[]>([]);
  const [filteredSistemas, setFilteredSistemas] = useState<Sistema[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSistema, setEditingSistema] = useState<Sistema | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [filterStatus, setFilterStatus] = useState<string>('todos');

  const [formData, setFormData] = useState({
    nome: '',
    sigla: '',
    tipo: 1 as Sistema['tipo'], // 1 = Sistema
    status: 2 as Sistema['status'], // 2 = Em Desenvolvimento
    objetivo: '',
    setor_id: 1,
    tecnologia_principal: '',
    repositorio_git: '',
    url_producao: '',
    url_homologacao: '',
    servidor: '',
    banco_dados: '',
    sistemas_integrados: '',
    rotinas_principais: '',
    url_documentacao: '',
    observacoes: '',
    data_inicio: '',
  });

  useEffect(() => {
    fetchSistemas();
  }, []);

  useEffect(() => {
    filterSistemas();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sistemas, searchTerm, filterTipo, filterStatus]);

  const fetchSistemas = async () => {
    try {
      const response = await fetch('/api/projetos?type=full');
      if (response.ok) {
        const data = await response.json();
        setSistemas(data);
        setFilteredSistemas(data);
      }
    } catch (error) {
      console.error('Erro ao buscar sistemas:', error);
      alert('Erro: Não foi possível carregar os sistemas');
    }
  };

  const filterSistemas = () => {
    let filtered = [...sistemas];

    // Filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(sistema =>
        sistema.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sistema.sigla?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sistema.tecnologia_principal?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por tipo
    if (filterTipo !== 'todos') {
      filtered = filtered.filter(sistema => sistema.tipo === Number(filterTipo));
    }

    // Filtro por status
    if (filterStatus !== 'todos') {
      filtered = filtered.filter(sistema => sistema.status === Number(filterStatus));
    }

    setFilteredSistemas(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = '/api/projetos';
      const method = editingSistema ? 'PUT' : 'POST';
      const body = editingSistema
        ? { ...formData, id: editingSistema.id }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        alert(`✓ Sistema ${editingSistema ? 'atualizado' : 'criado'} com sucesso`);
        setIsDialogOpen(false);
        resetForm();
        fetchSistemas();
      } else {
        throw new Error('Erro ao salvar sistema');
      }
    } catch {
      alert('❌ Erro: Não foi possível salvar o sistema');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (sistema: Sistema) => {
    setEditingSistema(sistema);
    setFormData({
      nome: sistema.nome,
      sigla: sistema.sigla || '',
      tipo: sistema.tipo,
      status: sistema.status,
      objetivo: sistema.objetivo || '',
      setor_id: sistema.setor_id || 1,
      tecnologia_principal: sistema.tecnologia_principal || '',
      repositorio_git: sistema.repositorio_git || '',
      url_producao: sistema.url_producao || '',
      url_homologacao: sistema.url_homologacao || '',
      servidor: sistema.servidor || '',
      banco_dados: sistema.banco_dados || '',
      sistemas_integrados: sistema.sistemas_integrados || '',
      rotinas_principais: sistema.rotinas_principais || '',
      url_documentacao: sistema.url_documentacao || '',
      observacoes: sistema.observacoes || '',
      data_inicio: sistema.data_inicio || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este sistema?')) return;

    try {
      const response = await fetch(`/api/projetos?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('✓ Sistema excluído com sucesso');
        fetchSistemas();
      }
    } catch {
      alert('❌ Erro: Não foi possível excluir o sistema');
    }
  };

  const resetForm = () => {
    setEditingSistema(null);
    setFormData({
      nome: '',
      sigla: '',
      tipo: 1, // 1 = Sistema
      status: 2, // 2 = Em Desenvolvimento
      objetivo: '',
      setor_id: 1,
      tecnologia_principal: '',
      repositorio_git: '',
      url_producao: '',
      url_homologacao: '',
      servidor: '',
      banco_dados: '',
      sistemas_integrados: '',
      rotinas_principais: '',
      url_documentacao: '',
      observacoes: '',
      data_inicio: '',
    });
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <SidebarSistema />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col gap-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Gestão de Projetos</h1>
            <p className="text-muted-foreground">
              Cadastro e gerenciamento de projetos da organização
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/asti/gestao-sistema/consultar">
              <Button variant="outline">
                <TableIcon className="mr-2 h-4 w-4" />
                Consultar Projetos
              </Button>
            </Link>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Projeto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSistema ? 'Editar Projeto' : 'Novo Projeto'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="sigla">Sigla</Label>
                  <Input
                    id="sigla"
                    value={formData.sigla}
                    onChange={(e) =>
                      setFormData({ ...formData, sigla: e.target.value })
                    }
                    maxLength={50}
                  />
                </div>

                <div>
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select
                    value={String(formData.tipo)}
                    onValueChange={(value) =>
                      setFormData({ ...formData, tipo: Number(value) as Sistema['tipo'] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Sistema</SelectItem>
                      <SelectItem value="2">Site</SelectItem>
                      <SelectItem value="3">API</SelectItem>
                      <SelectItem value="4">Mobile</SelectItem>
                      <SelectItem value="5">Rotina</SelectItem>
                      <SelectItem value="6">Infraestrutura</SelectItem>
                      <SelectItem value="7">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={String(formData.status)}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: Number(value) as Sistema['status'] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Produção</SelectItem>
                      <SelectItem value="2">Em Desenvolvimento</SelectItem>
                      <SelectItem value="3">Manutenção</SelectItem>
                      <SelectItem value="4">Descontinuado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tecnologia_principal">Tecnologia Principal</Label>
                  <Input
                    id="tecnologia_principal"
                    value={formData.tecnologia_principal}
                    onChange={(e) =>
                      setFormData({ ...formData, tecnologia_principal: e.target.value })
                    }
                    maxLength={200}
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="objetivo">Objetivo</Label>
                  <Textarea
                    id="objetivo"
                    value={formData.objetivo}
                    onChange={(e) =>
                      setFormData({ ...formData, objetivo: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="repositorio_git">Repositório Git</Label>
                  <Input
                    id="repositorio_git"
                    value={formData.repositorio_git}
                    onChange={(e) =>
                      setFormData({ ...formData, repositorio_git: e.target.value })
                    }
                    maxLength={500}
                  />
                </div>

                <div>
                  <Label htmlFor="url_producao">URL Produção</Label>
                  <Input
                    id="url_producao"
                    value={formData.url_producao}
                    onChange={(e) =>
                      setFormData({ ...formData, url_producao: e.target.value })
                    }
                    maxLength={500}
                  />
                </div>

                <div>
                  <Label htmlFor="url_homologacao">URL Homologação</Label>
                  <Input
                    id="url_homologacao"
                    value={formData.url_homologacao}
                    onChange={(e) =>
                      setFormData({ ...formData, url_homologacao: e.target.value })
                    }
                    maxLength={500}
                  />
                </div>

                <div>
                  <Label htmlFor="servidor">Servidor</Label>
                  <Input
                    id="servidor"
                    value={formData.servidor}
                    onChange={(e) =>
                      setFormData({ ...formData, servidor: e.target.value })
                    }
                    maxLength={200}
                  />
                </div>

                <div>
                  <Label htmlFor="banco_dados">Banco de Dados</Label>
                  <Input
                    id="banco_dados"
                    value={formData.banco_dados}
                    onChange={(e) =>
                      setFormData({ ...formData, banco_dados: e.target.value })
                    }
                    maxLength={300}
                  />
                </div>

                <div>
                  <Label htmlFor="data_inicio">Data de Início</Label>
                  <Input
                    id="data_inicio"
                    type="date"
                    value={formData.data_inicio}
                    onChange={(e) =>
                      setFormData({ ...formData, data_inicio: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="url_documentacao">URL Documentação</Label>
                  <Input
                    id="url_documentacao"
                    value={formData.url_documentacao}
                    onChange={(e) =>
                      setFormData({ ...formData, url_documentacao: e.target.value })
                    }
                    maxLength={500}
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="sistemas_integrados">Sistemas Integrados</Label>
                  <Textarea
                    id="sistemas_integrados"
                    value={formData.sistemas_integrados}
                    onChange={(e) =>
                      setFormData({ ...formData, sistemas_integrados: e.target.value })
                    }
                    rows={2}
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="rotinas_principais">Rotinas Principais</Label>
                  <Textarea
                    id="rotinas_principais"
                    value={formData.rotinas_principais}
                    onChange={(e) =>
                      setFormData({ ...formData, rotinas_principais: e.target.value })
                    }
                    rows={2}
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) =>
                      setFormData({ ...formData, observacoes: e.target.value })
                    }
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Barra de Filtros */}
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar por nome, sigla ou tecnologia..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
              
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Tipos</SelectItem>
                  <SelectItem value="1">Sistema</SelectItem>
                  <SelectItem value="2">Site</SelectItem>
                  <SelectItem value="3">API</SelectItem>
                  <SelectItem value="4">Mobile</SelectItem>
                  <SelectItem value="5">Rotina</SelectItem>
                  <SelectItem value="6">Infraestrutura</SelectItem>
                  <SelectItem value="7">Outros</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="1">Produção</SelectItem>
                  <SelectItem value="2">Em Desenvolvimento</SelectItem>
                  <SelectItem value="3">Manutenção</SelectItem>
                  <SelectItem value="4">Descontinuado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {filteredSistemas.length} projeto(s) encontrado(s)
                {(searchTerm || filterTipo !== 'todos' || filterStatus !== 'todos') && 
                  ` de ${sistemas.length} total`}
              </p>
              {(searchTerm || filterTipo !== 'todos' || filterStatus !== 'todos') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterTipo('todos');
                    setFilterStatus('todos');
                  }}
                >
                  Limpar Filtros
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSistemas.map((sistema) => (
          <Card key={sistema.id} className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-md">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg text-slate-900">{sistema.nome}</CardTitle>
                  {sistema.sigla && (
                    <Badge variant="outline" className="mt-2 rounded-full text-xs">
                      {sistema.sigla}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  <SistemaDetailsDialog sistema={sistema}>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-slate-200"
                      title="Visualizar"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </SistemaDetailsDialog>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-amber-100 hover:text-amber-700"
                    onClick={() => handleEdit(sistema)}
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-700"
                    onClick={() => handleDelete(sistema.id)}
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Badge className={`${tipoColors[sistema.tipo]} text-white rounded-full`}>
                  {getTipoLabel(sistema.tipo)}
                </Badge>
                <Badge className={`${statusColors[sistema.status]} text-white rounded-full`}>
                  {getStatusLabel(sistema.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {sistema.objetivo && (
                <p className="text-sm text-slate-600 mb-4 line-clamp-2 leading-relaxed">
                  {sistema.objetivo}
                </p>
              )}
              {sistema.tecnologia_principal && (
                <div className="text-sm mb-3 p-2 bg-slate-50 rounded-lg">
                  <span className="font-semibold text-slate-700">Tecnologia:</span>{' '}
                  <span className="text-slate-600">{sistema.tecnologia_principal}</span>
                </div>
              )}
              <div className="flex flex-col gap-2 mt-3">
                {sistema.url_producao && (
                  <a
                    href={sistema.url_producao}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-emerald-700 hover:text-emerald-800 font-medium"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Acessar Produção
                  </a>
                )}
                {sistema.repositorio_git && (
                  <a
                    href={sistema.repositorio_git}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-700 hover:text-blue-800 font-medium"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Repositório Git
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSistemas.length === 0 && sistemas.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Nenhum projeto cadastrado ainda. Clique em &quot;Novo Projeto&quot; para começar.
          </p>
        </div>
      )}

      {filteredSistemas.length === 0 && sistemas.length > 0 && (
        <div className="text-center py-12">
          <Filter className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Nenhum projeto encontrado com os filtros aplicados.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setSearchTerm('');
              setFilterTipo('todos');
              setFilterStatus('todos');
            }}
          >
            Limpar Filtros
          </Button>
        </div>
      )}
        </div>
      </main>
    </div>
  );
}
