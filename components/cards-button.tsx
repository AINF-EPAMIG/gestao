import { Plus, Search, Clock, FilePenLine, ArrowLeftRight, RefreshCw, ArrowRight, Network, Link2 } from "lucide-react"
import Link from "next/link"

export default function CardsButton({ type }: { type: string }) {
    if (type === 'ip') {
        return (
            <div className="max-w-full mx-auto">
                <div className="grid w-full max-w-4xl mx-auto grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="group relative overflow-hidden bg-white/95 text-foreground rounded-lg p-6 shadow-md border border-gray-100 hover:bg-gradient-to-br from-emerald-200/15 to-white/90 hover:border-emerald-200 transition-all duration-200 hover:-translate-y-1">
                        <div className="flex flex-col gap-3">
                            <div className="h-10 w-10 rounded-md bg-gradient-to-br from-emerald-900 to-emerald-700 flex items-center justify-center text-white self-start">
                                <Plus className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-0 group-hover:text-emerald-700">Cadastrar IP</h3>
                            <p className="text-sm text-muted-foreground text-grey-200 mb-4">Registre um novo endereço IP no sistema.</p>
                            <div>
                                <Link href="/asti/gestao-ips/ip" className="inline-flex justify-center items-center gap-2 rounded-md bg-emerald-50 text-emerald-900 w-full py-3 text-sm shadow-sm hover:bg-emerald-100">
                                    Acessar
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="group relative overflow-hidden bg-white/95 text-foreground rounded-lg p-6 shadow-md border border-gray-100 hover:bg-gradient-to-br from-emerald-200/15 to-white/90 hover:border-emerald-200 transition-all duration-200 hover:-translate-y-1">
                        <div className="flex flex-col gap-3">
                            <div className="h-10 w-10 rounded-md bg-gradient-to-br from-emerald-900 to-emerald-700 flex items-center justify-center text-white self-start">
                                <Search className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-0 group-hover:text-emerald-700">Consultar IP</h3>
                            <p className="text-sm text-muted-foreground text-grey-200 mb-4">Busque e visualize endereços IP cadastrados.</p>
                            <div>
                                <Link href="/asti/gestao-ips/consultar" className="inline-flex justify-center items-center gap-2 rounded-md bg-emerald-50 text-emerald-900 w-full py-3 text-sm shadow-sm hover:bg-emerald-100">
                                    Acessar
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="group relative overflow-hidden bg-white/95 text-foreground rounded-lg p-6 shadow-md border border-gray-100 hover:bg-gradient-to-br from-emerald-200/15 to-white/90 hover:border-emerald-200 transition-all duration-200 hover:-translate-y-1">
                        <div className="flex flex-col gap-3">
                            <div className="h-10 w-10 rounded-md bg-gradient-to-br from-emerald-900 to-emerald-700 flex items-center justify-center text-white self-start">
                                <Network className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-0 group-hover:text-emerald-700">Cadastrar faixa</h3>
                            <p className="text-sm text-muted-foreground text-grey-200 mb-4">Defina intervalos de IP para organização e alocação.</p>
                            <div>
                                <Link href="/asti/gestao-ips/faixa/cadastrar" className="inline-flex justify-center items-center gap-2 rounded-md bg-emerald-50 text-emerald-900 w-full py-3 text-sm shadow-sm hover:bg-emerald-100">
                                    Acessar
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="group relative overflow-hidden bg-white/95 text-foreground rounded-lg p-6 shadow-md border border-gray-100 hover:bg-gradient-to-br from-emerald-200/15 to-white/90 hover:border-emerald-200 transition-all duration-200 hover:-translate-y-1">
                        <div className="flex flex-col gap-3">
                            <div className="h-10 w-10 rounded-md bg-gradient-to-br from-emerald-900 to-emerald-700 flex items-center justify-center text-white self-start">
                                <Link2 className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-0 group-hover:text-emerald-700">Associar IP à máquina</h3>
                            <p className="text-sm text-muted-foreground text-grey-200 mb-4">Relacione IPs disponíveis aos equipamentos cadastrados.</p>
                            <div>
                                <Link href="/asti/gestao-ips/associar" className="inline-flex justify-center items-center gap-2 rounded-md bg-emerald-50 text-emerald-900 w-full py-3 text-sm shadow-sm hover:bg-emerald-100">
                                    Acessar
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )

    } else if (type === 'conhecimento') {
        return (
            <div className="max-w-full mx-auto">
                <div className="grid w-full max-w-3xl mx-auto grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="group relative overflow-hidden bg-white/95 text-foreground rounded-lg p-6 shadow-md border border-gray-100 hover:bg-gradient-to-br from-emerald-200/15 to-white/90 hover:border-emerald-200 transition-all duration-200 hover:-translate-y-1">
                        <div className="flex flex-col gap-3">
                            <div className="h-10 w-10 rounded-md bg-gradient-to-br from-emerald-900 to-emerald-700 flex items-center justify-center text-white self-start">
                                <Plus className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-0 group-hover:text-emerald-700">Cadastrar tutorial</h3>
                            <p className="text-sm text-muted-foreground text-grey-200 mb-4">Crie um novo tutorial ou documento de conhecimento.</p>
                            <div>
                                <Link href="/asti/area-conhecimento/cadastrar" className="inline-flex justify-center items-center gap-2 rounded-md bg-emerald-50 text-emerald-900 w-full py-3 text-sm shadow-sm hover:bg-emerald-100">
                                    Acessar
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="group relative overflow-hidden bg-white/95 text-foreground rounded-lg p-6 shadow-md border border-gray-100 hover:bg-gradient-to-br from-emerald-200/15 to-white/90 hover:border-emerald-200 transition-all duration-200 hover:-translate-y-1">
                        <div className="flex flex-col gap-3">
                            <div className="h-10 w-10 rounded-md bg-gradient-to-br from-emerald-900 to-emerald-700 flex items-center justify-center text-white self-start">
                                <Search className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-0 group-hover:text-emerald-700">Consultar tutoriais</h3>
                            <p className="text-sm text-muted-foreground text-grey-200 mb-4">Busque e visualize documentos da base de conhecimento.</p>
                            <div>
                                <Link href="/asti/area-conhecimento/consultar" className="inline-flex justify-center items-center gap-2 rounded-md bg-emerald-50 text-emerald-900 w-full py-3 text-sm shadow-sm hover:bg-emerald-100">
                                    Acessar
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
        
    }else if (type === 'contratos') {
        return (
            <div className="max-w-full mx-auto">
                <div className="grid w-full max-w-6xl mx-auto grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="group relative overflow-hidden bg-white/95 text-foreground rounded-lg p-6 shadow-md border border-gray-100 hover:bg-gradient-to-br from-emerald-200/15 to-white/90 hover:border-emerald-200 transition-all duration-200 hover:-translate-y-1">
                        <div className="flex flex-col gap-3">
                            <div className="h-10 w-10 rounded-md bg-gradient-to-br from-emerald-900 to-emerald-700 flex items-center justify-center text-white self-start">
                                <Plus className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-0 group-hover:text-emerald-700">Cadastrar contrato</h3>
                            <p className="text-sm text-muted-foreground text-grey-200 mb-4">Registre um novo contrato no sistema.</p>
                            <div>
                                <Link href="/asti/contratos/cadastrar" className="inline-flex justify-center items-center gap-2 rounded-md bg-emerald-50 text-emerald-900 w-full py-3 text-sm shadow-sm hover:bg-emerald-100">
                                    Acessar
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="group relative overflow-hidden bg-white/95 text-foreground rounded-lg p-6 shadow-md border border-gray-100 hover:bg-gradient-to-br from-emerald-200/15 to-white/90 hover:border-emerald-200 transition-all duration-200 hover:-translate-y-1">
                        <div className="flex flex-col gap-3">
                            <div className="h-10 w-10 rounded-md bg-gradient-to-br from-emerald-900 to-emerald-700 flex items-center justify-center text-white self-start">
                                <Search className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-0 group-hover:text-emerald-700">Consultar contratos</h3>
                            <p className="text-sm text-muted-foreground text-grey-200 mb-4">Busque e visualize contratos cadastrados.</p>
                            <div>
                                <Link href="/asti/contratos/consultar" className="inline-flex justify-center items-center gap-2 rounded-md bg-emerald-50 text-emerald-900 w-full py-3 text-sm shadow-sm hover:bg-emerald-100">
                                    Acessar
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="group relative overflow-hidden bg-white/95 text-foreground rounded-lg p-6 shadow-md border border-gray-100 hover:bg-gradient-to-br from-emerald-200/15 to-white/90 hover:border-emerald-200 transition-all duration-200 hover:-translate-y-1">
                        <div className="flex flex-col gap-3">
                            <div className="h-10 w-10 rounded-md bg-gradient-to-br from-emerald-900 to-emerald-700 flex items-center justify-center text-white self-start">
                                <Clock className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-0 group-hover:text-emerald-700">Contratos próximos do vencimento</h3>
                            <p className="text-sm text-muted-foreground text-grey-200 mb-4">Visualize contratos que estão próximos de vencer.</p>
                            <div>
                                <Link href="/asti/contratos/vencimento" className="inline-flex justify-center items-center gap-2 rounded-md bg-emerald-50 text-emerald-900 w-full py-3 text-sm shadow-sm hover:bg-emerald-100">
                                    Acessar
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="group relative overflow-hidden bg-white/95 text-foreground rounded-lg p-6 shadow-md border border-gray-100 hover:bg-gradient-to-br from-emerald-200/15 to-white/90 hover:border-emerald-200 transition-all duration-200 hover:-translate-y-1">
                        <div className="flex flex-col gap-3">
                            <div className="h-10 w-10 rounded-md bg-gradient-to-br from-emerald-900 to-emerald-700 flex items-center justify-center text-white self-start">
                                <FilePenLine className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-0 group-hover:text-emerald-700">Aditivar contratos</h3>
                            <p className="text-sm text-muted-foreground text-grey-200 mb-4">Adicione aditivos e alterações aos contratos.</p>
                            <div>
                                <Link href="/asti/contratos/aditivar" className="inline-flex justify-center items-center gap-2 rounded-md bg-emerald-50 text-emerald-900 w-full py-3 text-sm shadow-sm hover:bg-emerald-100">
                                    Acessar
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )


        }else if (type === 'estoque') {
        return (
            <div className="max-w-full mx-auto">
                <div className="grid w-full max-w-4xl mx-auto grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="group relative overflow-hidden bg-white/95 text-foreground rounded-lg p-6 shadow-md border border-gray-100 hover:bg-gradient-to-br from-emerald-200/15 to-white/90 hover:border-emerald-200 transition-all duration-200 hover:-translate-y-1">
                        <div className="flex flex-col gap-3">
                            <div className="h-10 w-10 rounded-md bg-gradient-to-br from-emerald-900 to-emerald-700 flex items-center justify-center text-white self-start">
                                <Plus className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-0 group-hover:text-emerald-700">Cadastrar equipamento</h3>
                            <p className="text-sm text-muted-foreground text-grey-200 mb-4">Registre um novo equipamento no estoque.</p>
                            <div>
                                <Link href="/asti/controle-estoque/cadastrar" className="inline-flex justify-center items-center gap-2 rounded-md bg-emerald-50 text-emerald-900 w-full py-3 text-sm shadow-sm hover:bg-emerald-100">
                                    Acessar
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="group relative overflow-hidden bg-white/95 text-foreground rounded-lg p-6 shadow-md border border-gray-100 hover:bg-gradient-to-br from-emerald-200/15 to-white/90 hover:border-emerald-200 transition-all duration-200 hover:-translate-y-1">
                        <div className="flex flex-col gap-3">
                            <div className="h-10 w-10 rounded-md bg-gradient-to-br from-emerald-900 to-emerald-700 flex items-center justify-center text-white self-start">
                                <Search className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-0 group-hover:text-emerald-700">Consultar equipamentos</h3>
                            <p className="text-sm text-muted-foreground text-grey-200 mb-4">Busque e visualize equipamentos do estoque.</p>
                            <div>
                                <Link href="/asti/controle-estoque/consultar" className="inline-flex justify-center items-center gap-2 rounded-md bg-emerald-50 text-emerald-900 w-full py-3 text-sm shadow-sm hover:bg-emerald-100">
                                    Acessar
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="group relative overflow-hidden bg-white/95 text-foreground rounded-lg p-6 shadow-md border border-gray-100 hover:bg-gradient-to-br from-emerald-200/15 to-white/90 hover:border-emerald-200 transition-all duration-200 hover:-translate-y-1">
                        <div className="flex flex-col gap-3">
                            <div className="h-10 w-10 rounded-md bg-gradient-to-br from-emerald-900 to-emerald-700 flex items-center justify-center text-white self-start">
                                <ArrowLeftRight className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-0 group-hover:text-emerald-700">Movimentação de estoque</h3>
                            <p className="text-sm text-muted-foreground text-grey-200 mb-4">Registre entradas e saídas de equipamentos.</p>
                            <div>
                                <Link href="/asti/controle-estoque/movimentacao" className="inline-flex justify-center items-center gap-2 rounded-md bg-emerald-50 text-emerald-900 w-full py-3 text-sm shadow-sm hover:bg-emerald-100">
                                    Acessar
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )


        }else if (type === 'faturamento') {
        return (
            <div className="max-w-full mx-auto">
                <div className="grid w-full max-w-4xl mx-auto grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="group relative overflow-hidden bg-white/95 text-foreground rounded-lg p-6 shadow-md border border-gray-100 hover:bg-gradient-to-br from-emerald-200/15 to-white/90 hover:border-emerald-200 transition-all duration-200 hover:-translate-y-1">
                        <div className="flex flex-col gap-3">
                            <div className="h-10 w-10 rounded-md bg-gradient-to-br from-emerald-900 to-emerald-700 flex items-center justify-center text-white self-start">
                                <Plus className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-0 group-hover:text-emerald-700">Cadastrar faturamento</h3>
                            <p className="text-sm text-muted-foreground text-grey-200 mb-4">Registre um novo faturamento no sistema.</p>
                            <div>
                                <Link href="/asti/faturamento/cadastrar" className="inline-flex justify-center items-center gap-2 rounded-md bg-emerald-50 text-emerald-900 w-full py-3 text-sm shadow-sm hover:bg-emerald-100">
                                    Acessar
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="group relative overflow-hidden bg-white/95 text-foreground rounded-lg p-6 shadow-md border border-gray-100 hover:bg-gradient-to-br from-emerald-200/15 to-white/90 hover:border-emerald-200 transition-all duration-200 hover:-translate-y-1">
                        <div className="flex flex-col gap-3">
                            <div className="h-10 w-10 rounded-md bg-gradient-to-br from-emerald-900 to-emerald-700 flex items-center justify-center text-white self-start">
                                <Search className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-0 group-hover:text-emerald-700">Consultar faturamentos</h3>
                            <p className="text-sm text-muted-foreground text-grey-200 mb-4">Busque e visualize faturamentos registrados.</p>
                            <div>
                                <Link href="/asti/faturamento/consultar" className="inline-flex justify-center items-center gap-2 rounded-md bg-emerald-50 text-emerald-900 w-full py-3 text-sm shadow-sm hover:bg-emerald-100">
                                    Acessar
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="group relative overflow-hidden bg-white/95 text-foreground rounded-lg p-6 shadow-md border border-gray-100 hover:bg-gradient-to-br from-emerald-200/15 to-white/90 hover:border-emerald-200 transition-all duration-200 hover:-translate-y-1">
                        <div className="flex flex-col gap-3">
                            <div className="h-10 w-10 rounded-md bg-gradient-to-br from-emerald-900 to-emerald-700 flex items-center justify-center text-white self-start">
                                <RefreshCw className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-0 group-hover:text-emerald-700">Atualizar status</h3>
                            <p className="text-sm text-muted-foreground text-grey-200 mb-4">Atualize o status de faturamentos existentes.</p>
                            <div>
                                <Link href="/asti/faturamento/atualizar-status" className="inline-flex justify-center items-center gap-2 rounded-md bg-emerald-50 text-emerald-900 w-full py-3 text-sm shadow-sm hover:bg-emerald-100">
                                    Acessar
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );

        }else{
            return (
            <div className="max-w-full mx-auto">
                <div className="grid w-full max-w-3xl mx-auto grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="group relative overflow-hidden bg-white/95 text-foreground rounded-lg p-6 shadow-md border border-gray-100 hover:bg-gradient-to-br from-emerald-200/15 to-white/90 hover:border-emerald-200 transition-all duration-200 hover:-translate-y-1">
                        <div className="flex flex-col gap-3">
                            <div className="h-10 w-10 rounded-md bg-gradient-to-br from-emerald-900 to-emerald-700 flex items-center justify-center text-white self-start">
                                <Plus className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-0 group-hover:text-emerald-700">Cadastrar orçamento</h3>
                            <p className="text-sm text-muted-foreground text-grey-200 mb-4">Registre uma nova solicitação de orçamento.</p>
                            <div>
                                <Link href="/asti/compras/cadastrar" className="inline-flex justify-center items-center gap-2 rounded-md bg-emerald-50 text-emerald-900 w-full py-3 text-sm shadow-sm hover:bg-emerald-100">
                                    Acessar
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="group relative overflow-hidden bg-white/95 text-foreground rounded-lg p-6 shadow-md border border-gray-100 hover:bg-gradient-to-br from-emerald-200/15 to-white/90 hover:border-emerald-200 transition-all duration-200 hover:-translate-y-1">
                        <div className="flex flex-col gap-3">
                            <div className="h-10 w-10 rounded-md bg-gradient-to-br from-emerald-900 to-emerald-700 flex items-center justify-center text-white self-start">
                                <Search className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-0 group-hover:text-emerald-700">Consultar orçamentos</h3>
                            <p className="text-sm text-muted-foreground text-grey-200 mb-4">Busque e visualize orçamentos cadastrados.</p>
                            <div>
                                <Link href="/asti/compras/consultar" className="inline-flex justify-center items-center gap-2 rounded-md bg-emerald-50 text-emerald-900 w-full py-3 text-sm shadow-sm hover:bg-emerald-100">
                                    Acessar
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
        }
}
