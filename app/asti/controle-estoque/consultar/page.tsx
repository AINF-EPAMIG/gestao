"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Eye,
  Pencil,
  Trash2,
  Package,
  Calendar,
  Hash,
  FileText,
  User,
  Loader2,
  AlertCircle,
  X,
  Filter,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { SidebarSistema } from "@/components/sidebar-sistema";
import { PageHeader } from "@/components/page-header";

// Tipos
interface ItemEstoque {
  id: number;
  nome: string;
  quantidade: number;
  patrimonio: string;
  marca: string;
  dataAquisicao: string;
  quemCadastrou: string;
  dataCadastro: string;
}

// Dados de exemplo
const dadosExemplo: ItemEstoque[] = [
  {
    id: 1,
    nome: 'Monitor Dell 24"',
    quantidade: 5,
    patrimonio: "PAT-00123",
    marca: "Dell",
    dataAquisicao: "2024-01-15",
    quemCadastrou: "João Silva",
    dataCadastro: "2024-01-20"
  },
  {
    id: 2,
    nome: "Mouse sem fio",
    quantidade: 15,
    patrimonio: "PER-00456",
    marca: "Logitech",
    dataAquisicao: "2024-02-10",
    quemCadastrou: "Maria Santos",
    dataCadastro: "2024-02-12"
  },
  {
    id: 3,
    nome: "Teclado mecânico",
    quantidade: 8,
    patrimonio: "PER-00789",
    marca: "Redragon",
    dataAquisicao: "2024-03-05",
    quemCadastrou: "João Silva",
    dataCadastro: "2024-03-06"
  },
  {
    id: 4,
    nome: "Notebook Lenovo",
    quantidade: 3,
    patrimonio: "PAT-00234",
    marca: "Lenovo",
    dataAquisicao: "2024-04-01",
    quemCadastrou: "Carlos Oliveira",
    dataCadastro: "2024-04-02"
  },
  {
    id: 5,
    nome: "Headset USB",
    quantidade: 10,
    patrimonio: "PER-00321",
    marca: "HyperX",
    dataAquisicao: "2024-05-20",
    quemCadastrou: "Maria Santos",
    dataCadastro: "2024-05-21"
  }
];

// Função para formatar data
const formatDate = (dateString: string) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Data inválida";
  return date.toLocaleDateString("pt-BR");
};

export default function ConsultarEstoquePage() {
  const { toast } = useToast();

  // Estados de dados
  const [itens, setItens] = useState<ItemEstoque[]>(dadosExemplo);
  const [isLoading] = useState(false);

  // Estados de filtros
  const [filtroNome, setFiltroNome] = useState("");
  const [filtroPatrimonio, setFiltroPatrimonio] = useState("");
  const [filtroMarca, setFiltroMarca] = useState("");
  const [filtroDataAquisicaoInicio, setFiltroDataAquisicaoInicio] = useState("");
  const [filtroDataAquisicaoFim, setFiltroDataAquisicaoFim] = useState("");
  const [filtroDataCadastroInicio, setFiltroDataCadastroInicio] = useState("");
  const [filtroDataCadastroFim, setFiltroDataCadastroFim] = useState("");
  const [filtroQuemCadastrou, setFiltroQuemCadastrou] = useState("todos");

  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Estados de modais
  const [selectedItem, setSelectedItem] = useState<ItemEstoque | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Estado de edição
  const [editForm, setEditForm] = useState<Partial<ItemEstoque>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Lista de quem cadastrou (para o filtro)
  const cadastradores = useMemo(() => {
    const unique = [...new Set(itens.map((item) => item.quemCadastrou))];
    return unique.sort();
  }, [itens]);

  // Filtragem dos itens
  const itensFiltrados = useMemo(() => {
    return itens.filter((item) => {
      // Filtro por nome
      if (filtroNome && !item.nome.toLowerCase().includes(filtroNome.toLowerCase())) {
        return false;
      }

      // Filtro por patrimônio
      if (filtroPatrimonio && !item.patrimonio.toLowerCase().includes(filtroPatrimonio.toLowerCase())) {
        return false;
      }

      // Filtro por marca
      if (filtroMarca && !item.marca.toLowerCase().includes(filtroMarca.toLowerCase())) {
        return false;
      }

      // Filtro por quem cadastrou
      if (filtroQuemCadastrou !== "todos" && item.quemCadastrou !== filtroQuemCadastrou) {
        return false;
      }

      // Filtro por data de aquisição (início)
      if (filtroDataAquisicaoInicio && item.dataAquisicao < filtroDataAquisicaoInicio) {
        return false;
      }

      // Filtro por data de aquisição (fim)
      if (filtroDataAquisicaoFim && item.dataAquisicao > filtroDataAquisicaoFim) {
        return false;
      }

      // Filtro por data de cadastro (início)
      if (filtroDataCadastroInicio && item.dataCadastro < filtroDataCadastroInicio) {
        return false;
      }

      // Filtro por data de cadastro (fim)
      if (filtroDataCadastroFim && item.dataCadastro > filtroDataCadastroFim) {
        return false;
      }

      return true;
    });
  }, [
    itens,
    filtroNome,
    filtroPatrimonio,
    filtroMarca,
    filtroQuemCadastrou,
    filtroDataAquisicaoInicio,
    filtroDataAquisicaoFim,
    filtroDataCadastroInicio,
    filtroDataCadastroFim
  ]);

  // Paginação
  const totalPages = Math.ceil(itensFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const itensPaginados = itensFiltrados.slice(startIndex, startIndex + itemsPerPage);

  // Limpar filtros
  const limparFiltros = () => {
    setFiltroNome("");
    setFiltroPatrimonio("");
    setFiltroMarca("");
    setFiltroDataAquisicaoInicio("");
    setFiltroDataAquisicaoFim("");
    setFiltroDataCadastroInicio("");
    setFiltroDataCadastroFim("");
    setFiltroQuemCadastrou("todos");
    setCurrentPage(1);
  };

  // Ações de modal
  const openViewModal = (item: ItemEstoque) => {
    setSelectedItem(item);
    setIsViewModalOpen(true);
  };

  const openEditModal = (item: ItemEstoque) => {
    setSelectedItem(item);
    setEditForm({
      nome: item.nome,
      quantidade: item.quantidade,
      patrimonio: item.patrimonio,
      marca: item.marca,
      dataAquisicao: item.dataAquisicao
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (item: ItemEstoque) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const closeModals = () => {
    setIsViewModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedItem(null);
    setEditForm({});
  };

  // Salvar edição
  const handleSaveEdit = async () => {
    if (!selectedItem) return;

    setIsSaving(true);
    try {
      // Simulação de API - substituir por chamada real
      await new Promise((resolve) => setTimeout(resolve, 800));

      setItens((prev) =>
        prev.map((item) =>
          item.id === selectedItem.id
            ? { ...item, ...editForm }
            : item
        )
      );

      toast({
        title: "Item atualizado",
        description: `"${editForm.nome}" foi atualizado com sucesso.`
      });

      closeModals();
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o item.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Excluir item
  const handleDelete = async () => {
    if (!selectedItem) return;

    setIsDeleting(true);
    try {
      // Simulação de API - substituir por chamada real
      await new Promise((resolve) => setTimeout(resolve, 800));

      setItens((prev) => prev.filter((item) => item.id !== selectedItem.id));

      toast({
        title: "Item excluído",
        description: `"${selectedItem.nome}" foi removido do estoque.`
      });

      closeModals();
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o item.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 overflow-x-hidden">
      <SidebarSistema />

      <main className="flex-1 min-w-0 w-full min-h-screen flex flex-col">
        <div className="px-4 py-8 lg:px-6">
          <div className="mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link
              href="/asti/home"
              className="inline-flex justify-center items-center hover:text-gray-700/80 transition-colors duration-200 w-10 h-10 p-2"
            >
              <ArrowLeft />
            </Link>
            <PageHeader title="Consultar Estoque" subtitle="Controle de Estoque" />
          </div>

          {/* Filtros */}
          <Card className="rounded-3xl border-gray-100 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-5 w-5 text-emerald-600" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Linha 1: Nome, Patrimônio, Marca */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="filtroNome" className="flex items-center gap-2 text-sm font-medium">
                    <Package className="h-4 w-4 text-gray-400" />
                    Nome
                  </Label>
                  <Input
                    id="filtroNome"
                    placeholder="Buscar por nome..."
                    value={filtroNome}
                    onChange={(e) => {
                      setFiltroNome(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filtroPatrimonio" className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="h-4 w-4 text-gray-400" />
                    Patrimônio
                  </Label>
                  <Input
                    id="filtroPatrimonio"
                    placeholder="Buscar por patrimônio..."
                    value={filtroPatrimonio}
                    onChange={(e) => {
                      setFiltroPatrimonio(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filtroMarca" className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="h-4 w-4 text-gray-400" />
                    Marca
                  </Label>
                  <Input
                    id="filtroMarca"
                    placeholder="Buscar por marca..."
                    value={filtroMarca}
                    onChange={(e) => {
                      setFiltroMarca(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="rounded-xl"
                  />
                </div>
              </div>

              {/* Linha 2: Datas de Aquisição e Cadastro */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="filtroDataAquisicaoInicio" className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    Aquisição (De)
                  </Label>
                  <Input
                    id="filtroDataAquisicaoInicio"
                    type="date"
                    value={filtroDataAquisicaoInicio}
                    onChange={(e) => {
                      setFiltroDataAquisicaoInicio(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filtroDataAquisicaoFim" className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    Aquisição (Até)
                  </Label>
                  <Input
                    id="filtroDataAquisicaoFim"
                    type="date"
                    value={filtroDataAquisicaoFim}
                    onChange={(e) => {
                      setFiltroDataAquisicaoFim(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filtroDataCadastroInicio" className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    Cadastro (De)
                  </Label>
                  <Input
                    id="filtroDataCadastroInicio"
                    type="date"
                    value={filtroDataCadastroInicio}
                    onChange={(e) => {
                      setFiltroDataCadastroInicio(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filtroDataCadastroFim" className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    Cadastro (Até)
                  </Label>
                  <Input
                    id="filtroDataCadastroFim"
                    type="date"
                    value={filtroDataCadastroFim}
                    onChange={(e) => {
                      setFiltroDataCadastroFim(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="rounded-xl"
                  />
                </div>
              </div>

              {/* Linha 3: Quem cadastrou + Botão limpar */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end">
                <div className="space-y-2 lg:col-span-3">
                  <Label htmlFor="filtroQuemCadastrou" className="flex items-center gap-2 text-sm font-medium">
                    <User className="h-4 w-4 text-gray-400" />
                    Quem Cadastrou
                  </Label>
                  <Select
                    value={filtroQuemCadastrou}
                    onValueChange={(value) => {
                      setFiltroQuemCadastrou(value);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {cadastradores.map((cadastrador) => (
                        <SelectItem key={cadastrador} value={cadastrador}>
                          {cadastrador}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={limparFiltros}
                  className="rounded-xl gap-2 w-full"
                >
                  <X className="h-4 w-4" />
                  Limpar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Resultados */}
          <Card className="rounded-3xl border-gray-100 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Search className="h-5 w-5 text-emerald-600" />
                  Resultados
                  <span className="text-sm font-normal text-gray-500">
                    ({itensFiltrados.length} {itensFiltrados.length === 1 ? "item" : "itens"})
                  </span>
                </CardTitle>

                <div className="flex items-center gap-2">
                  <Label htmlFor="itemsPerPage" className="text-sm whitespace-nowrap">
                    Itens por página:
                  </Label>
                  <Select
                    value={String(itemsPerPage)}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-20 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                </div>
              ) : itensFiltrados.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <AlertCircle className="h-12 w-12 mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Nenhum item encontrado</p>
                  <p className="text-sm">Tente ajustar os filtros de busca</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-xl border border-gray-100">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/50">
                          <TableHead className="font-semibold">Nome</TableHead>
                          <TableHead className="font-semibold text-center">Qtde</TableHead>
                          <TableHead className="font-semibold">Patrimônio</TableHead>
                          <TableHead className="font-semibold">Marca</TableHead>
                          <TableHead className="font-semibold">Data Aquisição</TableHead>
                          <TableHead className="font-semibold">Cadastrado por</TableHead>
                          <TableHead className="font-semibold">Data Cadastro</TableHead>
                          <TableHead className="font-semibold text-center">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {itensPaginados.map((item) => (
                          <TableRow key={item.id} className="hover:bg-emerald-50/30">
                            <TableCell className="font-medium">{item.nome}</TableCell>
                            <TableCell className="text-center">
                              <span className="inline-flex items-center justify-center min-w-[2rem] rounded-full bg-emerald-100 px-2 py-0.5 text-sm font-semibold text-emerald-700">
                                {item.quantidade}
                              </span>
                            </TableCell>
                            <TableCell>{item.patrimonio || "—"}</TableCell>
                            <TableCell>{item.marca || "—"}</TableCell>
                            <TableCell>{formatDate(item.dataAquisicao)}</TableCell>
                            <TableCell>{item.quemCadastrou}</TableCell>
                            <TableCell>{formatDate(item.dataCadastro)}</TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openViewModal(item)}
                                  className="h-8 w-8 p-0 hover:bg-blue-50"
                                  title="Visualizar"
                                >
                                  <Eye className="h-4 w-4 text-blue-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditModal(item)}
                                  className="h-8 w-8 p-0 hover:bg-yellow-50"
                                  title="Editar"
                                >
                                  <Pencil className="h-4 w-4 text-yellow-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openDeleteModal(item)}
                                  className="h-8 w-8 p-0 hover:bg-red-50"
                                  title="Excluir"
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Paginação */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm text-gray-500">
                        Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, itensFiltrados.length)} de{" "}
                        {itensFiltrados.length} itens
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="rounded-xl"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium px-2">
                          {currentPage} / {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="rounded-xl"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
        </div>
      </main>

      {/* Modal de Visualização */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              Detalhes do Item
            </DialogTitle>
            <DialogDescription>Informações completas do item no estoque.</DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Nome</p>
                    <p className="text-sm">{selectedItem.nome}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Hash className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Quantidade</p>
                    <p className="text-sm">{selectedItem.quantidade}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Patrimônio</p>
                    <p className="text-sm">{selectedItem.patrimonio || "Não informado"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Marca</p>
                    <p className="text-sm">{selectedItem.marca || "Não informada"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Data de Aquisição</p>
                    <p className="text-sm">{formatDate(selectedItem.dataAquisicao)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Cadastrado por</p>
                    <p className="text-sm">{selectedItem.quemCadastrou}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Data de Cadastro</p>
                    <p className="text-sm">{formatDate(selectedItem.dataCadastro)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeModals} className="rounded-xl">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-yellow-600" />
              Editar Item
            </DialogTitle>
            <DialogDescription>Atualize as informações do item.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editNome">Nome</Label>
              <Input
                id="editNome"
                value={editForm.nome || ""}
                onChange={(e) => setEditForm((prev) => ({ ...prev, nome: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editQuantidade">Quantidade</Label>
                <Input
                  id="editQuantidade"
                  type="number"
                  min={1}
                  value={editForm.quantidade || ""}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, quantidade: Number(e.target.value) }))}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPatrimonio">Patrimônio</Label>
                <Input
                  id="editPatrimonio"
                  value={editForm.patrimonio || ""}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, patrimonio: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editMarca">Marca</Label>
              <Input
                id="editMarca"
                value={editForm.marca || ""}
                onChange={(e) => setEditForm((prev) => ({ ...prev, marca: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDataAquisicao">Data de Aquisição</Label>
              <Input
                id="editDataAquisicao"
                type="date"
                value={editForm.dataAquisicao || ""}
                onChange={(e) => setEditForm((prev) => ({ ...prev, dataAquisicao: e.target.value }))}
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={closeModals} disabled={isSaving} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={isSaving}
              className="gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Exclusão */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Excluir Item
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este item do estoque?
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="rounded-xl bg-red-50 border border-red-100 p-4">
              <p className="font-medium text-red-800">{selectedItem.nome}</p>
              <p className="text-sm text-red-600 mt-1">
                Patrimônio: {selectedItem.patrimonio || "Não informado"}
              </p>
              <p className="text-sm text-red-600">Quantidade: {selectedItem.quantidade}</p>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={closeModals} disabled={isDeleting} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="gap-2 rounded-xl"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
