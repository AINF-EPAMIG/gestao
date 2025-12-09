"use client";

import { useState } from "react";
import {
  Save,
  Package,
  Calendar,
  Hash,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Monitor,
  Mouse,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { SidebarSistema } from "@/components/sidebar-sistema";
import { PageHeader } from "@/components/page-header";
import Link from "next/link";

type TabType = "equipamento" | "periferico";

interface FormData {
  nome: string;
  quantidade: string;
  patrimonio: string;
  dataAquisicao: string;
  marca: string;
}

const initialFormData: FormData = {
  nome: "",
  quantidade: "1",
  patrimonio: "",
  dataAquisicao: "",
  marca: ""
};

const placeholders: Record<TabType, { nome: string; patrimonio: string; marca: string }> = {
  equipamento: {
    nome: 'Ex: Monitor Dell 24"',
    patrimonio: "Ex: PAT-00123",
    marca: "Ex: Dell, HP, Lenovo"
  },
  periferico: {
    nome: "Ex: Mouse sem fio, Teclado USB",
    patrimonio: "Ex: PER-00456",
    marca: "Ex: Logitech, Microsoft (opcional)"
  }
};

const tabLabels: Record<TabType, { title: string; description: string }> = {
  equipamento: {
    title: "Dados do Equipamento",
    description: "Preencha as informações do equipamento a ser adicionado no estoque."
  },
  periferico: {
    title: "Dados do Periférico",
    description: "Preencha as informações do periférico a ser adicionado no estoque."
  }
};

export default function CadastroEstoquePage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>("equipamento");
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.nome.trim()) {
      newErrors.nome = "Nome do item é obrigatório";
    }

    const qtd = Number(formData.quantidade);
    if (!formData.quantidade || Number.isNaN(qtd) || qtd < 1) {
      newErrors.quantidade = "Informe uma quantidade válida (mínimo 1)";
    }

    if (!formData.dataAquisicao) {
      newErrors.dataAquisicao = "Data de aquisição é obrigatória";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    setFeedback(null);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as TabType);
    setFormData(initialFormData);
    setErrors({});
    setFeedback(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Simulação de envio – substituir por chamada real à API futuramente
      await new Promise((resolve) => setTimeout(resolve, 800));

      const itemType = activeTab === "equipamento" ? "Equipamento" : "Periférico";
      toast({
        title: `${itemType} cadastrado`,
        description: `"${formData.nome}" foi adicionado ao estoque.`
      });

      setFeedback({ type: "success", message: `${itemType} cadastrado com sucesso!` });
      setFormData(initialFormData);
    } catch (err) {
      console.error(err);
      setFeedback({ type: "error", message: "Falha ao cadastrar item. Tente novamente." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setErrors({});
    setFeedback(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <SidebarSistema />

      <div className="px-4 py-8 lg:px-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link href="/asti/home" className="inline-flex justify-center items-center hover:text-gray-700/80 transition-colors duration-200 w-10 h-10 p-2">
              <ArrowLeft/>
            </Link>
            <PageHeader title="Cadastrar Item" subtitle="Controle de Estoque" />
          </div>

          {/* Feedback */}
          {feedback && (
            <div
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${
                feedback.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0" />
              )}
              {feedback.message}
            </div>
          )}

          {/* Formulário */}
          <Card className="rounded-3xl border-gray-100 shadow-lg">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <CardHeader className="space-y-4 pb-4">
                <TabsList className="grid w-full grid-cols-2 rounded-xl bg-gray-100 p-1">
                  <TabsTrigger
                    value="equipamento"
                    className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <Monitor className="h-4 w-4" />
                    Equipamento
                  </TabsTrigger>
                  <TabsTrigger
                    value="periferico"
                    className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <Mouse className="h-4 w-4" />
                    Periférico
                  </TabsTrigger>
                </TabsList>
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <FileText className="h-5 w-5 text-emerald-600" />
                    {tabLabels[activeTab].title}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {tabLabels[activeTab].description}
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Nome */}
                  <div className="space-y-2">
                    <Label htmlFor="nome" className="flex items-center gap-2 text-sm font-medium">
                      <Package className="h-4 w-4 text-gray-400" />
                      {activeTab === "equipamento" ? "Nome do equipamento" : "Nome do periférico"}{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="nome"
                      placeholder={placeholders[activeTab].nome}
                      value={formData.nome}
                      onChange={(e) => handleChange("nome", e.target.value)}
                      className={`rounded-xl ${errors.nome ? "border-red-300 focus-visible:ring-red-200" : ""}`}
                    />
                    {errors.nome && (
                      <p className="flex items-center gap-1 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3" /> {errors.nome}
                      </p>
                    )}
                  </div>

                  {/* Marca */}
                  <div className="space-y-2">
                    <Label htmlFor="marca" className="flex items-center gap-2 text-sm font-medium">
                      <FileText className="h-4 w-4 text-gray-400" />
                      Marca{" "}
                      {activeTab === "periferico" ? (
                        <span className="text-gray-400">(opcional)</span>
                      ) : (
                        <span className="text-gray-400">(opcional)</span>
                      )}
                    </Label>
                    <Input
                      id="marca"
                      placeholder={placeholders[activeTab].marca}
                      value={formData.marca}
                      onChange={(e) => handleChange("marca", e.target.value)}
                      className="rounded-xl"
                    />
                  </div>

                  {/* Quantidade + Patrimônio (side-by-side em telas maiores) */}
                  <div className="grid gap-6 sm:grid-cols-2">
                    {/* Quantidade */}
                    <div className="space-y-2">
                      <Label htmlFor="quantidade" className="flex items-center gap-2 text-sm font-medium">
                        <Hash className="h-4 w-4 text-gray-400" />
                        Quantidade <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="quantidade"
                        type="number"
                        min={1}
                        placeholder="1"
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

                    {/* Patrimônio */}
                    <div className="space-y-2">
                      <Label htmlFor="patrimonio" className="flex items-center gap-2 text-sm font-medium">
                        <FileText className="h-4 w-4 text-gray-400" />
                        Patrimônio <span className="text-gray-400">(opcional)</span>
                      </Label>
                      <Input
                        id="patrimonio"
                        placeholder={placeholders[activeTab].patrimonio}
                        value={formData.patrimonio}
                        onChange={(e) => handleChange("patrimonio", e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Data de Aquisição */}
                  <div className="space-y-2">
                    <Label htmlFor="dataAquisicao" className="flex items-center gap-2 text-sm font-medium">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      Data de Aquisição <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="dataAquisicao"
                      type="date"
                      value={formData.dataAquisicao}
                      onChange={(e) => handleChange("dataAquisicao", e.target.value)}
                      className={`rounded-xl ${errors.dataAquisicao ? "border-red-300 focus-visible:ring-red-200" : ""}`}
                    />
                    {errors.dataAquisicao && (
                      <p className="flex items-center gap-1 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3" /> {errors.dataAquisicao}
                      </p>
                    )}
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
                          <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />{" "}
                          {activeTab === "equipamento" ? "Cadastrar Equipamento" : "Cadastrar Periférico"}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}
