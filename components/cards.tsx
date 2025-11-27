import { Notebook, Package, Receipt, ShoppingCart, Monitor, ClipboardPen, Book, Mail, Globe } from "lucide-react"
import Link from "next/link"

type Card = {
    title: string
    description: string
    hrefCadastrar: string
    hrefConsultar: string
}

const cards: Card[] = [
    { 
        title: 'Área de conhecimento', 
        description: 'Reúne e organiza informações e procedimentos do setor.', 
        hrefCadastrar: '/asti/area-conhecimento/cadastrar',
        hrefConsultar: '/asti/area-conhecimento/consultar'
    },
    { 
        title: 'Contratos', 
        description: 'Controla dados, prazos e status de contratos.', 
        hrefCadastrar: '/asti/contratos/cadastrar',
        hrefConsultar: '/asti/contratos/consultar'
    },
    { 
        title: 'Controle de estoque', 
        description: 'Registra entradas, saídas e quantidades de itens.', 
        hrefCadastrar: '/asti/controle-estoque/cadastrar',
        hrefConsultar: '/asti/controle-estoque/consultar'
    },
    { 
        title: 'Gestão de IPs', 
        description: 'Administra a distribuição e uso de endereços de rede.', 
        hrefCadastrar: '/asti/gestao-ips/cadastrar',
        hrefConsultar: '/asti/gestao-ips/consultar'
    },
    { 
        title: 'Faturamento', 
        description: 'Gera e gerencia cobranças e notas fiscais.', 
        hrefCadastrar: '/asti/faturamento/cadastrar',
        hrefConsultar: '/asti/faturamento/consultar'
    },
    { 
        title: 'Gestão de compras', 
        description: 'Registra solicitações e pedidos de compra.', 
        hrefCadastrar: '/asti/compras/cadastrar',
        hrefConsultar: '/asti/compras/consultar'
    },
    { 
        title: 'E-mails', 
        description: 'Consulta e filtra funcionários com emails e informações.', 
        hrefCadastrar: '/asti/email/cadastrar',
        hrefConsultar: '/asti/email/consultar'
    },
    { 
        title: 'Gestão de Projetos', 
        description: 'Gerencia projetos, sistemas e demandas da organização.', 
        hrefCadastrar: '/asti/gestao-sistema/cadastrar',
        hrefConsultar: '/asti/gestao-sistema/consultar'
    },
]

export default function Cards() {
    return (
        <div className="max-w-full mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((c) => {
                    const Icon = (
                        title => {
                            if (title.includes('Área')) return Notebook
                            if (title.includes('Contrato')) return ClipboardPen
                            if (title.includes('estoque')) return Package
                            if (title.includes('IP')) return Monitor
                            if (title.includes('Faturamento')) return Receipt
                            if (title.includes('compras')) return ShoppingCart
                            if (title.includes('E-mail')) return Mail
                            if (title.includes('Projetos')) return Globe
                            return Book
                        }
                    )(c.title)

                    return (
                        <div key={c.title} className="group relative overflow-hidden bg-white text-foreground rounded-xl p-5 shadow-md border border-gray-100 hover:border-emerald-200 hover:shadow-lg transition-all duration-200">
                            {/* Header: Ícone + Título lado a lado */}
                            <div className="flex items-center gap-3 mb-3">
                                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-800 to-emerald-600 flex items-center justify-center text-white flex-shrink-0">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors">
                                    {c.title}
                                </h3>
                            </div>
                            
                            {/* Descrição */}
                            <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                                {c.description}
                            </p>
                            
                            {/* Botões: Cadastrar e Consultar */}
                            <div className="flex gap-3">
                                <Link 
                                    href={c.hrefCadastrar} 
                                    className="flex-1 inline-flex justify-center items-center rounded-full bg-emerald-600 text-white py-2.5 text-sm font-medium hover:bg-emerald-700 transition-colors"
                                >
                                    Cadastrar
                                </Link>
                                <Link 
                                    href={c.hrefConsultar} 
                                    className="flex-1 inline-flex justify-center items-center rounded-full border-2 border-emerald-600 text-emerald-700 py-2.5 text-sm font-medium hover:bg-emerald-50 transition-colors"
                                >
                                    Consultar
                                </Link>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}