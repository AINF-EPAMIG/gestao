"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRightLeft,
  Package,
  Building2,
  Users,
  User,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Network,
  Monitor,
  Mouse
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { SidebarSistema } from "@/components/sidebar-sistema";
import { PageHeader } from "@/components/page-header";

// Tipos
interface Equipamento {
  id: number;
  nome: string;
  patrimonio: string;
  marca: string;
  tipo: "equipamento" | "periferico";
}


interface Unidade {
  id: number;
  nome: string;
}

interface Setor {
  id: number;
  nome: string;
  unidadeId: number;
}

interface Pessoa {
  id: number;
  nome: string;
  setorId: number;
}

// Dados de exemplo - substituir por chamadas à API
const equipamentosExemplo: Equipamento[] = [
  { id: 1, nome: 'Monitor Dell 24"', patrimonio: "PAT-00123", marca: "Dell", tipo: "equipamento" },
  { id: 2, nome: "Mouse sem fio", patrimonio: "PER-00456", marca: "Logitech", tipo: "periferico" },
  { id: 3, nome: "Teclado mecânico", patrimonio: "PER-00789", marca: "Redragon", tipo: "periferico" },
  { id: 4, nome: "Notebook Lenovo", patrimonio: "PAT-00234", marca: "Lenovo", tipo: "equipamento" },
  { id: 5, nome: "Headset USB", patrimonio: "PER-00321", marca: "HyperX", tipo: "periferico" }
];

const unidadesExemplo: Unidade[] = [
  { id: 1, nome: "Sede - Belo Horizonte" },
  { id: 2, nome: "Unidade Campo Experimental - Pitangui" },
  { id: 3, nome: "Unidade Regional - Uberaba" },
  { id: 4, nome: "Unidade Regional - Lavras" }
];

const setoresExemplo: Setor[] = [
  { id: 1, nome: "ASTI - Assessoria de Tecnologia da Informação", unidadeId: 1 },
  { id: 2, nome: "Administração", unidadeId: 1 },
  { id: 3, nome: "Recursos Humanos", unidadeId: 1 },
  { id: 4, nome: "Financeiro", unidadeId: 1 },
  { id: 5, nome: "Pesquisa", unidadeId: 2 },
  { id: 6, nome: "Administração", unidadeId: 2 },
  { id: 7, nome: "Laboratório", unidadeId: 3 },
  { id: 8, nome: "Campo Experimental", unidadeId: 3 },
  { id: 9, nome: "Pesquisa", unidadeId: 4 },
  { id: 10, nome: "Administração", unidadeId: 4 }
];

const pessoasExemplo: Pessoa[] = [
  { id: 1, nome: "João Silva", setorId: 1 },
  { id: 2, nome: "Maria Santos", setorId: 1 },
  { id: 3, nome: "Carlos Oliveira", setorId: 2 },
  { id: 4, nome: "Ana Paula", setorId: 3 },
  { id: 5, nome: "Pedro Lima", setorId: 4 },
  { id: 6, nome: "Fernanda Costa", setorId: 5 },
  { id: 7, nome: "Roberto Alves", setorId: 6 },
  { id: 8, nome: "Juliana Martins", setorId: 7 },
  { id: 9, nome: "Lucas Pereira", setorId: 8 },
  { id: 10, nome: "Camila Souza", setorId: 9 }
];

type TabType = "equipamento" | "periferico";

interface FormData {
  equipamentoId: string;
  unidadeId: string;
  setorId: string;
  pessoaId: string;
  quantidade: string;
  chamadoNumero: string;
  movimentoTipo: "entrada" | "saida";
  motivo: string;
  tipo: TabType;
}

const initialFormData: FormData = {
  equipamentoId: "",
  unidadeId: "",
  setorId: "",
  pessoaId: "",
  quantidade: "1",
  chamadoNumero: "",
  movimentoTipo: "entrada",
  motivo: "",
  tipo: "equipamento"
};

export default function MovimentarEstoquePage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [activeTab, setActiveTab] = useState<TabType>("equipamento");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [lastMovimentacao, setLastMovimentacao] = useState<{
    equipamento: Equipamento | null;
    unidade: Unidade | null;
    setor: Setor | null;
    pessoa: Pessoa | null;
    quantidade?: string;
    chamadoNumero?: string;
    movimentoTipo?: string;
    motivo?: string;
  } | null>(null);

  // Filtrar setores pela unidade selecionada
  const setoresFiltrados = useMemo(() => {
    if (!formData.unidadeId) return [];
    return setoresExemplo.filter((setor) => setor.unidadeId === Number(formData.unidadeId));
  }, [formData.unidadeId]);

  // Filtrar pessoas pelo setor selecionado
  const pessoasFiltradas = useMemo(() => {
    if (!formData.setorId) return [];
    return pessoasExemplo.filter((pessoa) => pessoa.setorId === Number(formData.setorId));
  }, [formData.setorId]);

  // Itens filtrados pelo tipo selecionado (equipamento / periferico)
  const itensFiltradosPorTipo = useMemo(() => {
    return equipamentosExemplo.filter((item) => item.tipo === activeTab);
  }, [activeTab]);

  // Obter equipamento selecionado
  const equipamentoSelecionado = useMemo(() => {
    if (!formData.equipamentoId) return null;
    return equipamentosExemplo.find((eq) => eq.id === Number(formData.equipamentoId)) || null;
  }, [formData.equipamentoId]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.equipamentoId) {
      newErrors.equipamentoId = "Selecione um equipamento";
    }

    if (!formData.unidadeId) {
      newErrors.unidadeId = "Selecione uma unidade";
    }

    if (!formData.setorId) {
      newErrors.setorId = "Selecione um setor";
    }

    if (!formData.movimentoTipo) {
      newErrors.movimentoTipo = "Selecione o tipo de movimentação";
    }

    // pessoaId é opcional, não precisa validar
    const qtd = Number(formData.quantidade);
    if (!formData.quantidade || Number.isNaN(qtd) || qtd < 1) {
      newErrors.quantidade = "Informe uma quantidade válida (mínimo 1)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // Limpar campos dependentes
      if (field === "unidadeId") {
        newData.setorId = "";
        newData.pessoaId = "";
      }
      if (field === "setorId") {
        newData.pessoaId = "";
      }

      return newData;
    });

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Simulação de envio – substituir por chamada real à API futuramente
      await new Promise((resolve) => setTimeout(resolve, 800));

      const equipamento = equipamentosExemplo.find((eq) => eq.id === Number(formData.equipamentoId)) || null;
      const unidade = unidadesExemplo.find((u) => u.id === Number(formData.unidadeId)) || null;
      const setor = setoresExemplo.find((s) => s.id === Number(formData.setorId)) || null;
      const pessoa = formData.pessoaId
        ? pessoasExemplo.find((p) => p.id === Number(formData.pessoaId)) || null
        : null;

      // Salvar dados da última movimentação para o modal
      setLastMovimentacao({
        equipamento,
        unidade,
        setor,
        pessoa,
        quantidade: formData.quantidade,
        chamadoNumero: formData.chamadoNumero,
        movimentoTipo: formData.movimentoTipo,
        motivo: formData.motivo
      });

      setFormData(initialFormData);
      
      // Abrir modal de sucesso
      setIsSuccessModalOpen(true);
    } catch (err) {
      console.error(err);
      // Erro será tratado pelo feedback visual
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setIsSuccessModalOpen(false);
    setLastMovimentacao(null);
  };

  const handleAtribuirIP = () => {
    setIsSuccessModalOpen(false);
    // Redirecionar para a página de associação de IP
    router.push("/asti/gestao-ips/associar");
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setErrors({});
    setActiveTab("equipamento");
  };


  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 overflow-x-hidden">
      <SidebarSistema />

      <main className="flex-1 min-w-0 w-full min-h-screen flex flex-col">
        <div className="px-4 py-8 lg:px-6">
          <div className="mx-auto max-w-3xl space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <Link
                href="/asti/home"
                className="inline-flex justify-center items-center hover:text-gray-700/80 transition-colors duration-200 w-10 h-10 p-2"
              >
                <ArrowLeft />
              </Link>
              <PageHeader title="Movimentar Item" subtitle="Controle de Estoque" />
            </div>

            {/* Formulário */}
            <Card className="rounded-3xl border-gray-100 shadow-lg">
              <div className="px-4 pt-4">
                <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as TabType); setFormData((prev) => ({ ...prev, tipo: v as TabType, equipamentoId: "" })); }} className="w-full">
                  <TabsList className="grid grid-cols-2 w-full rounded-xl bg-gray-100 p-1">
                      <TabsTrigger value="equipamento" className="flex items-center justify-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Monitor className="h-4 w-4" /> Equipamento
                      </TabsTrigger>
                      <TabsTrigger value="periferico" className="flex items-center justify-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Mouse className="h-4 w-4" /> Periférico
                      </TabsTrigger>
                    </TabsList>
                </Tabs>
              </div>
              <CardHeader className="space-y-2 pb-4 pt-1">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="h-5 w-5 text-emerald-600" />
                  <div>
                    <CardTitle className="text-xl">Registrar Movimentação</CardTitle>
                    <CardDescription>Selecione o item e o destino para registrar a movimentação.</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Equipamento / Periférico */}
                  <div className="space-y-2">
                    <Label htmlFor="equipamento" className="flex items-center gap-2 text-sm font-medium">
                      <Package className="h-4 w-4 text-gray-400" />
                      {activeTab === "equipamento" ? "Equipamento" : "Periférico"} <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.equipamentoId}
                      onValueChange={(value) => handleChange("equipamentoId", value)}
                    >
                      <SelectTrigger
                        className={`rounded-xl ${errors.equipamentoId ? "border-red-300 focus-visible:ring-red-200" : ""}`}
                      >
                        <SelectValue placeholder={activeTab === "equipamento" ? "Selecione um equipamento" : "Selecione um periférico"} />
                      </SelectTrigger>
                      <SelectContent>
                        {itensFiltradosPorTipo.map((equipamento) => (
                          <SelectItem key={equipamento.id} value={String(equipamento.id)}>
                            {equipamento.nome} ({equipamento.patrimonio})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.equipamentoId && (
                      <p className="flex items-center gap-1 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3" /> {errors.equipamentoId}
                      </p>
                    )}
                  </div>

                  {/* Quantidade e Tipo de Movimentação (lado a lado) */}
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="quantidade" className="flex items-center gap-2 text-sm font-medium">
                        <FileText className="h-4 w-4 text-gray-400" />
                        Quantidade <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="quantidade"
                        type="number"
                        min={1}
                        value={formData.quantidade}
                        onChange={(e) => handleChange("quantidade", e.target.value)}
                        className={`rounded-xl ${errors.quantidade ? "border-red-300 focus-visible:ring-red-200" : ""}`}
                      />
                      {errors.quantidade && (
                        <p className="flex items-center gap-1 text-xs text-red-500">
                          <AlertCircle className="h-3 w-3" /> {errors.quantidade}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="movimentoTipo" className="flex items-center gap-2 text-sm font-medium">
                        <ArrowRightLeft className="h-4 w-4 text-gray-400" />
                        Tipo de Movimentação <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.movimentoTipo}
                        onValueChange={(value) => handleChange("movimentoTipo", value)}
                      >
                        <SelectTrigger
                          className={`rounded-xl ${errors.movimentoTipo ? "border-red-300 focus-visible:ring-red-200" : ""}`}
                        >
                          <SelectValue placeholder="Selecione o tipo de movimentação" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entrada">Entrada</SelectItem>
                          <SelectItem value="saida">Saída</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.movimentoTipo && (
                        <p className="flex items-center gap-1 text-xs text-red-500">
                          <AlertCircle className="h-3 w-3" /> {errors.movimentoTipo}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Unidade e Número do Chamado (lado a lado) */}
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="unidade" className="flex items-center gap-2 text-sm font-medium">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        Unidade <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.unidadeId}
                        onValueChange={(value) => handleChange("unidadeId", value)}
                      >
                        <SelectTrigger
                          className={`rounded-xl ${errors.unidadeId ? "border-red-300 focus-visible:ring-red-200" : ""}`}
                        >
                          <SelectValue placeholder="Selecione uma unidade" />
                        </SelectTrigger>
                        <SelectContent>
                          {unidadesExemplo.map((unidade) => (
                            <SelectItem key={unidade.id} value={String(unidade.id)}>
                              {unidade.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.unidadeId && (
                        <p className="flex items-center gap-1 text-xs text-red-500">
                          <AlertCircle className="h-3 w-3" /> {errors.unidadeId}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="chamadoNumero" className="flex items-center gap-2 text-sm font-medium">
                        <FileText className="h-4 w-4 text-gray-400" />
                        Número do Chamado <span className="text-gray-400">(opcional)</span>
                      </Label>
                      <Input
                        id="chamadoNumero"
                        placeholder="Ex: 123456"
                        value={formData.chamadoNumero}
                        onChange={(e) => handleChange("chamadoNumero", e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Detalhes do equipamento selecionado */}
                  {equipamentoSelecionado && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
                      <p className="text-sm font-medium text-emerald-800 mb-2">Item Selecionado</p>
                      <div className="grid grid-cols-2 gap-2 text-sm text-emerald-700">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>Patrimônio: {equipamentoSelecionado.patrimonio}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          <span>Marca: {equipamentoSelecionado.marca}</span>
                        </div>
                      </div>
                    </div>
                  )}


                  {/* Setor e Responsável (lado a lado) */}
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="setor" className="flex items-center gap-2 text-sm font-medium">
                        <Users className="h-4 w-4 text-gray-400" />
                        Setor <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.setorId}
                        onValueChange={(value) => handleChange("setorId", value)}
                        disabled={!formData.unidadeId}
                      >
                        <SelectTrigger
                          className={`rounded-xl ${errors.setorId ? "border-red-300 focus-visible:ring-red-200" : ""}`}
                        >
                          <SelectValue
                            placeholder={
                              formData.unidadeId
                                ? "Selecione um setor"
                                : "Selecione uma unidade primeiro"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {setoresFiltrados.map((setor) => (
                            <SelectItem key={setor.id} value={String(setor.id)}>
                              {setor.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.setorId && (
                        <p className="flex items-center gap-1 text-xs text-red-500">
                          <AlertCircle className="h-3 w-3" /> {errors.setorId}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pessoa" className="flex items-center gap-2 text-sm font-medium">
                        <User className="h-4 w-4 text-gray-400" />
                        Responsável <span className="text-gray-400">(opcional)</span>
                      </Label>
                      <Select
                        value={formData.pessoaId}
                        onValueChange={(value) => handleChange("pessoaId", value)}
                        disabled={!formData.setorId}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue
                            placeholder={
                              formData.setorId
                                ? "Selecione um responsável (opcional)"
                                : "Selecione um setor primeiro"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {pessoasFiltradas.map((pessoa) => (
                            <SelectItem key={pessoa.id} value={String(pessoa.id)}>
                              {pessoa.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Motivo (último campo, sozinho) */}
                  <div className="space-y-2">
                    <Label htmlFor="motivo" className="flex items-center gap-2 text-sm font-medium">
                      <FileText className="h-4 w-4 text-gray-400" />
                      Motivo <span className="text-gray-400">(opcional)</span>
                    </Label>
                    <textarea
                      id="motivo"
                      value={formData.motivo}
                      onChange={(e) => handleChange("motivo", e.target.value)}
                      className="w-full rounded-xl border px-3 py-2 resize-none h-28"
                    />
                  </div>

                  {/* Botões */}
                  <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleReset}
                      disabled={isSubmitting}
                      className="rounded-xl"
                    >
                      Limpar
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="gap-2 rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Registrando...
                        </>
                      ) : (
                        <>
                          <ArrowRightLeft className="h-4 w-4" /> Registrar Movimentação
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Modal de Sucesso */}
      <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
              Movimentação Registrada
            </DialogTitle>
            <DialogDescription>
              A movimentação foi registrada com sucesso. Deseja atribuir um IP a este equipamento?
            </DialogDescription>
          </DialogHeader>

          {lastMovimentacao?.equipamento && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
              <p className="font-medium text-emerald-800">{lastMovimentacao.equipamento.nome}</p>
              <p className="text-sm text-emerald-600 mt-1">
                Patrimônio: {lastMovimentacao.equipamento.patrimonio}
              </p>
              {lastMovimentacao.quantidade && (
                <p className="text-sm text-emerald-600">
                  Quantidade: {lastMovimentacao.quantidade}
                </p>
              )}
              {lastMovimentacao.chamadoNumero && (
                <p className="text-sm text-emerald-600">
                  Chamado: {lastMovimentacao.chamadoNumero}
                </p>
              )}
              {lastMovimentacao.movimentoTipo && (
                <p className="text-sm text-emerald-600">
                  Tipo: {lastMovimentacao.movimentoTipo === 'entrada' ? 'Entrada' : 'Saída'}
                </p>
              )}
              {lastMovimentacao.motivo && (
                <p className="text-sm text-emerald-600">
                  Motivo: {lastMovimentacao.motivo}
                </p>
              )}
              <p className="text-sm text-emerald-600">
                Destino: {lastMovimentacao.setor?.nome} - {lastMovimentacao.unidade?.nome}
              </p>
              {lastMovimentacao.pessoa && (
                <p className="text-sm text-emerald-600">
                  Responsável: {lastMovimentacao.pessoa.nome}
                </p>
              )}
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleCloseSuccessModal}
              className="rounded-xl"
            >
              Fechar
            </Button>
            <Button
              onClick={handleAtribuirIP}
              className="gap-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
            >
              <Network className="h-4 w-4" />
              Atribuir IP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
