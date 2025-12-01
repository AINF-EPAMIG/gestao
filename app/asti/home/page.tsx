"use client"

import { SidebarSistema } from "@/components/sidebar-sistema";
import { PageHeader } from "@/components/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Notebook, Package, Receipt, ShoppingCart, Monitor, ClipboardPen, Mail, Globe } from "lucide-react";
import Link from "next/link";

type ModuleCard = {
  title: string;
  description: string;
  icon: typeof Notebook;
  actions: {
    label: string;
    href: string;
    variant: "primary" | "secondary";
  }[];
};

const modules: ModuleCard[] = [
  {
    title: "Área de conhecimento",
    description: "Reúne e organiza informações e procedimentos do setor.",
    icon: Notebook,
    actions: [
      { label: "Dashboard", href: "/asti/area-conhecimento/dashboard", variant: "primary" },
      { label: "Cadastrar Tutoriais", href: "/asti/area-conhecimento/cadastrar", variant: "secondary" },
      { label: "Consultar Tutoriais", href: "/asti/area-conhecimento/consultar", variant: "secondary" },
    ],
  },
  {
    title: "Contratos",
    description: "Controla dados, prazos e status de contratos.",
    icon: ClipboardPen,
    actions: [
      { label: "Cadastrar Contrato", href: "/asti/contratos/cadastrar", variant: "primary" },
      { label: "Consultar Contrato", href: "/asti/contratos/consultar", variant: "secondary" },
      { label: "Próximos Vencimentos", href: "/asti/contratos/proximos-vencimentos", variant: "secondary" },
      { label: "Aditivar Contrato", href: "/asti/contratos/aditivar", variant: "secondary" },
    ],
  },
  {
    title: "Controle de estoque",
    description: "Registra entradas, saídas e quantidades de itens.",
    icon: Package,
    actions: [
      { label: "Cadastrar Estoque", href: "/asti/controle-estoque/cadastrar", variant: "primary" },
      { label: "Consultar Estoque", href: "/asti/controle-estoque/consultar", variant: "secondary" },
      { label: "Movimentação", href: "/asti/controle-estoque/movimentacao", variant: "secondary" },
    ],
  },
  {
    title: "E-mails",
    description: "Consulta e filtra funcionários com emails e informações.",
    icon: Mail,
    actions: [
      { label: "Cadastrar", href: "/asti/email/cadastrar", variant: "primary" },
      { label: "Consultar", href: "/asti/email/consultar", variant: "secondary" },
    ],
  },
  {
    title: "Faturamento",
    description: "Gera e gerencia cobranças e notas fiscais.",
    icon: Receipt,
    actions: [
      { label: "Atualizar Status", href: "/asti/faturamento/atualizar", variant: "primary" },
      { label: "Cadastrar Faturamento", href: "/asti/faturamento/cadastrar", variant: "secondary" },
      { label: "Consultar Faturamento", href: "/asti/faturamento/consultar", variant: "secondary" },
    ],
  },
  {
    title: "Gestão de compras",
    description: "Registra solicitações e pedidos de compra.",
    icon: ShoppingCart,
    actions: [
      { label: "Cadastrar Orçamento", href: "/asti/compras/cadastrar", variant: "primary" },
      { label: "Consultar Orçamento", href: "/asti/compras/consultar", variant: "secondary" },
    ],
  },
  {
    title: "Gestão de IPs",
    description: "Administra a distribuição e uso de endereços de rede.",
    icon: Monitor,
    actions: [
      { label: "Home", href: "/asti/gestao-ips", variant: "primary" },
      { label: "Cadastrar IPs", href: "/asti/gestao-ips/ip", variant: "secondary" },
      { label: "Consultar IPs", href: "/asti/gestao-ips/consultar", variant: "secondary" },
      { label: "Associar IPs", href: "/asti/gestao-ips/associar", variant: "secondary" },
      { label: "Cadastrar Faixa", href: "/asti/gestao-ips/faixa/cadastrar", variant: "secondary" },
    ],
  },
  {
    title: "Gestão de Projetos",
    description: "Gerencia projetos, sistemas e demandas da organização.",
    icon: Globe,
    actions: [
      { label: "Cadastrar Projeto", href: "/asti/gestao-sistema/cadastrar", variant: "primary" },
      { label: "Consultar Projeto", href: "/asti/gestao-sistema/consultar", variant: "secondary" },
    ],
  },
];

function ModuleCard({ module }: { module: ModuleCard }) {
  const Icon = module.icon;

  return (
    <div className="group relative overflow-hidden bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all duration-300">
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-500 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors mb-1">
            {module.title}
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            {module.description}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mt-4">
        {module.actions.map((action, idx) => (
          <Link
            key={idx}
            href={action.href}
            className={`
              inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${
                action.variant === "primary"
                  ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow"
                  : "border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50"
              }
            `}
          >
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function SistemaAsti() {
  // Organizar módulos em ordem alfabética
  const sortedModules = [...modules].sort((a, b) => a.title.localeCompare(b.title));

  // Criar slugs para cada módulo
  const getModuleSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-');
  };

  return (
    <div className="flex min-h-screen bg-white overflow-x-hidden">
      <SidebarSistema />
      <main className="flex-1 min-w-0 w-full">
        <div className="p-3 sm:p-4 pt-16 lg:pt-4 w-full">
          <PageHeader title="Sistema ASTI" />
          
          <Tabs defaultValue={getModuleSlug(sortedModules[0]?.title)} className="w-full mt-8">
            {/* Tabs Navigation - Responsiva com quebra de linha */}
            <div className="relative mb-8">
              <div className="w-full">
                <TabsList className="flex flex-wrap w-full h-auto p-0 bg-transparent border-b border-gray-200 rounded-none gap-0 justify-start">
                  {sortedModules.map((module) => {
                    const Icon = module.icon;
                    return (
                      <TabsTrigger
                        key={module.title}
                        value={getModuleSlug(module.title)}
                        className="group relative flex items-center gap-2 px-4 py-3 rounded-none border-b-2 border-transparent 
                                   data-[state=active]:border-emerald-600 data-[state=active]:bg-emerald-50/50
                                   hover:bg-gray-50 transition-all duration-200 whitespace-nowrap
                                   focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2
                                   data-[state=active]:shadow-none
                                   flex-shrink-0 flex-grow-0
                                   text-xs sm:text-sm
                                   min-w-[calc(50%-0.5rem)] sm:min-w-[calc(33.333%-0.5rem)] lg:min-w-[calc(25%-0.5rem)] xl:min-w-0
                                   max-w-[calc(50%-0.5rem)] sm:max-w-[calc(33.333%-0.5rem)] lg:max-w-[calc(25%-0.5rem)] xl:max-w-none"
                        aria-label={`Acessar módulo ${module.title}`}
                      >
                        <Icon className="h-4 w-4 text-gray-500 group-data-[state=active]:text-emerald-600 transition-colors flex-shrink-0" 
                              aria-hidden="true" />
                        <span className="font-medium text-gray-700 group-data-[state=active]:text-emerald-700 
                                       group-data-[state=active]:font-semibold transition-all truncate">
                          {module.title}
                        </span>
                        {/* Indicador visual de aba ativa */}
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 scale-x-0 
                                      group-data-[state=active]:scale-x-100 transition-transform duration-200" 
                             aria-hidden="true" />
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </div>
            </div>

            {/* Conteúdo das Tabs */}
            {sortedModules.map((module) => (
              <TabsContent 
                key={module.title} 
                value={getModuleSlug(module.title)} 
                className="mt-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 rounded-lg animate-in fade-in-0 slide-in-from-bottom-4 duration-300"
              >
                <div className="max-w-4xl mx-auto">
                  <ModuleCard module={module} />
                </div>
            </TabsContent>
          ))}
        </Tabs>
        </div>
      </main>
    </div>
  );
}