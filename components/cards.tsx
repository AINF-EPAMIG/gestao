import { Notebook, Package, Receipt, ShoppingCart, Monitor, ClipboardPen, ArrowRight, Book, Mail } from "lucide-react"
import Link from "next/link"

type Card = {
    title: string
    description: string
    href: string
}

const cards: Card[] = [
    { title: 'Área de conhecimento', description: 'Reúne e organiza informações e procedimentos do setor.', href: '/asti/area-conhecimento' },
    { title: 'Contratos', description: 'Controla dados, prazos e status de contratos.', href: '/asti/contratos' },
    { title: 'Controle de estoque', description: 'Registra entradas, saídas e quantidades de itens.', href: '/asti/controle-estoque' },
    { title: 'Gestão de IPs', description: 'Administra a distribuição e uso de endereços de rede.', href: '/asti/gestao-ips' },
    { title: 'Faturamento', description: 'Gera e gerencia cobranças e notas fiscais.', href: '/asti/faturamento' },
    { title: 'Gestão de compras', description: 'Registra solicitações e pedidos de compra.', href: '/asti/compras' },
    { title: 'E-mails', description: 'Consulta e filtra funcionários com emails e informações.', href: '/asti/email' },
]

export default function Cards() {
    return (
            <div className="max-w-full mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 gap-y-16">
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
                                            return Book
                                        }
                                    )(c.title)

                                    return (
                                        <div key={c.title} className="group relative overflow-hidden bg-white/95 text-foreground rounded-lg p-6 shadow-md border border-gray-100 hover:bg-gradient-to-br from-emerald-200/15 to-white/90 hover:border-emerald-200 transition-all duration-200 hover:-translate-y-1">
                                            <div className="flex flex-col gap-3">
                                                <div className="h-10 w-10 rounded-md bg-gradient-to-br from-emerald-900 to-emerald-700 flex items-center justify-center text-white self-start">
                                                    <Icon className="h-5 w-5" />
                                                </div>
                                                <h3 className="text-lg font-semibold text-foreground mb-0 group-hover:text-emerald-700">{c.title}</h3>
                                                <p className="text-sm text-muted-foreground text-grey-200 mb-4">{c.description}</p>
                                                <div>
                                                    <Link href={c.href} className="inline-flex justify-center items-center gap-2 rounded-md bg-emerald-50 text-emerald-900 w-full py-3 text-sm shadow-sm hover:bg-emerald-100">
                                                        Acessar
                                                        <ArrowRight className="h-4 w-4" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                </div>
            </div>

    )
}