import { Plus, Search, Clock, FilePenLine, ArrowLeftRight, RefreshCw } from "lucide-react"
import Link from "next/link"

export default function CardsButton({ type }: { type: string }) {
    if (type === 'ip') {
        return (
            <div className="max-w-full mx-auto">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                    <Link href="/asti/gestao-ips/cadastrar" className="group block bg-white rounded-lg shadow-md border border-gray-100 p-10 sm:p-8 transform transition-transform duration-200 w-72 sm:w-80 md:w-96 hover:scale-105 hover:border-emerald-200 hover:bg-gradient-to-br from-emerald-100/15 to-white/90">
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 transform transition-transform duration-200 group-hover:scale-105">
                                <Plus className="h-7 w-7" />
                            </div>
                            <div className="text-base text-foreground font-medium transform transition-transform duration-200 group-hover:scale-105">Cadastrar Ip</div>
                        </div>
                    </Link>

                    <Link href="/asti/gestao-ips/consultar" className="group block bg-white rounded-lg shadow-md border border-gray-100 p-10 sm:p-8 transform transition-transform duration-200 w-72 sm:w-80 md:w-96 hover:scale-105 hover:border-emerald-200 hover:bg-gradient-to-br from-emerald-100/15 to-white/90">
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 transform transition-transform duration-200 group-hover:scale-105">
                                <Search className="h-7 w-7" />
                            </div>
                            <div className="text-base text-foreground font-medium transform transition-transform duration-200 group-hover:scale-105">Consultar Ip</div>
                        </div>
                    </Link>
                </div>
            </div>
        )


    } else if (type === 'conhecimento') {
        return (
            <div className="max-w-full mx-auto">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                    <Link href="/asti/area-conhecimento/cadastrar" className="group block bg-white rounded-lg shadow-md border border-gray-100 p-10 sm:p-8 transform transition-transform duration-200 w-72 sm:w-80 md:w-96 hover:scale-105 hover:border-emerald-200 hover:bg-gradient-to-br from-emerald-100/15 to-white/90">
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 transform transition-transform duration-200 group-hover:scale-105">
                                <Plus className="h-7 w-7" />
                            </div>
                            <div className="text-base text-foreground font-medium transform transition-transform duration-200 group-hover:scale-105">Cadastrar tutorial</div>
                        </div>
                    </Link>

                    <Link href="/asti/area-conhecimento/consultar" className="group block bg-white rounded-lg shadow-md border border-gray-100 p-10 sm:p-8 transform transition-transform duration-200 w-72 sm:w-80 md:w-96 hover:scale-105 hover:border-emerald-200 hover:bg-gradient-to-br from-emerald-100/15 to-white/90">
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 transform transition-transform duration-200 group-hover:scale-105">
                                <Search className="h-7 w-7" />
                            </div>
                            <div className="text-base text-foreground font-medium transform transition-transform duration-200 group-hover:scale-105">Consultar tutoriais</div>
                        </div>
                    </Link>
                </div>
            </div>
        )


    } else if (type === 'contratos') {
        return (
            <div className="max-w-full mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-16 justify-items-center">
                    <Link href="/asti/contratos/cadastrar" className="group block bg-white rounded-lg shadow-md border border-gray-100 p-10 sm:p-8 transform transition-transform duration-200 w-72 sm:w-80 md:w-96 hover:scale-105 hover:border-emerald-200 hover:bg-gradient-to-br from-emerald-100/15 to-white/90">
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 transform transition-transform duration-200 group-hover:scale-105">
                                <Plus className="h-7 w-7" />
                            </div>
                            <div className="text-base text-foreground font-medium transform transition-transform duration-200 group-hover:scale-105">Cadastrar contrato</div>
                        </div>
                    </Link>

                    <Link href="/asti/contratos/consultar" className="group block bg-white rounded-lg shadow-md border border-gray-100 p-10 sm:p-8 transform transition-transform duration-200 w-72 sm:w-80 md:w-96 hover:scale-105 hover:border-emerald-200 hover:bg-gradient-to-br from-emerald-100/15 to-white/90">
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 transform transition-transform duration-200 group-hover:scale-105">
                                <Search className="h-7 w-7" />
                            </div>
                            <div className="text-base text-foreground font-medium transform transition-transform duration-200 group-hover:scale-105">Consultar contratos</div>
                        </div>
                    </Link>
                    <Link href="/asti/contratos/vencimento" className="group block bg-white rounded-lg shadow-md border border-gray-100 p-10 sm:p-8 transform transition-transform duration-200 w-72 sm:w-80 md:w-96 hover:scale-105 hover:border-emerald-200 hover:bg-gradient-to-br from-emerald-100/15 to-white/90">
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 transform transition-transform duration-200 group-hover:scale-105">
                                <Clock className="h-7 w-7" />
                            </div>
                            <div className="text-base text-foreground font-medium transform transition-transform duration-200 group-hover:scale-105">Contratos próximo do vencimento</div>
                        </div>
                    </Link>
                    <Link href="/asti/contratos/aditivar" className="group block bg-white rounded-lg shadow-md border border-gray-100 p-10 sm:p-8 transform transition-transform duration-200 w-72 sm:w-80 md:w-96 hover:scale-105 hover:border-emerald-200 hover:bg-gradient-to-br from-emerald-100/15 to-white/90">
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 transform transition-transform duration-200 group-hover:scale-105">
                                <FilePenLine className="h-7 w-7" />
                            </div>
                            <div className="text-base text-foreground font-medium transform transition-transform duration-200 group-hover:scale-105">Aditivar contratos</div>
                        </div>
                    </Link>
                </div>
            </div>
        )


    } else if (type === 'estoque') {
        return (
            <div className="max-w-full mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-16 justify-items-center">
                    <Link href="/asti/controle-estoque/cadastrar" className="group block bg-white rounded-lg shadow-md border border-gray-100 p-10 sm:p-8 transform transition-transform duration-200 w-72 sm:w-80 md:w-96 hover:scale-105 hover:border-emerald-200 hover:bg-gradient-to-br from-emerald-100/15 to-white/90">
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 transform transition-transform duration-200 group-hover:scale-105">
                                <Plus className="h-7 w-7" />
                            </div>
                            <div className="text-base text-foreground font-medium transform transition-transform duration-200 group-hover:scale-105">Cadastrar equipamento</div>
                        </div>
                    </Link>

                    <Link href="/asti/controle-estoque/consultar" className="group block bg-white rounded-lg shadow-md border border-gray-100 p-10 sm:p-8 transform transition-transform duration-200 w-72 sm:w-80 md:w-96 hover:scale-105 hover:border-emerald-200 hover:bg-gradient-to-br from-emerald-100/15 to-white/90">
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 transform transition-transform duration-200 group-hover:scale-105">
                                <Search className="h-7 w-7" />
                            </div>
                            <div className="text-base text-foreground font-medium transform transition-transform duration-200 group-hover:scale-105">Consultar equipamentos</div>
                        </div>
                    </Link>

                    <Link href="/asti/estoque/movimentacao" className="group block bg-white rounded-lg shadow-md border border-gray-100 p-10 sm:p-8 transform transition-transform duration-200 w-72 sm:w-80 md:w-96 hover:scale-105 hover:border-emerald-200 hover:bg-gradient-to-br from-emerald-100/15 to-white/90 sm:col-span-2 sm:justify-self-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 transform transition-transform duration-200 group-hover:scale-105">
                                <ArrowLeftRight className="h-7 w-7" />
                            </div>
                            <div className="text-base text-foreground font-medium transform transition-transform duration-200 group-hover:scale-105">Movimentação de estoque
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        )


    } else if (type === 'faturamento') {
        return (
            <div className="max-w-full mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-16 justify-items-center">
                    <Link
                        href="/asti/faturamento/cadastrar"
                        className="group block bg-white rounded-lg shadow-md border border-gray-100 p-10 sm:p-8 transform transition-transform duration-200 w-72 sm:w-80 md:w-96 hover:scale-105 hover:border-emerald-200 hover:bg-gradient-to-br from-emerald-100/15 to-white/90"
                    >
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 transform transition-transform duration-200 group-hover:scale-105">
                                <Plus className="h-7 w-7" />
                            </div>
                            <div className="text-base text-foreground font-medium transform transition-transform duration-200 group-hover:scale-105">
                                Cadastrar faturamento
                            </div>
                        </div>
                    </Link>

                    <Link
                        href="/asti/faturamento/consultar"
                        className="group block bg-white rounded-lg shadow-md border border-gray-100 p-10 sm:p-8 transform transition-transform duration-200 w-72 sm:w-80 md:w-96 hover:scale-105 hover:border-emerald-200 hover:bg-gradient-to-br from-emerald-100/15 to-white/90"
                    >
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 transform transition-transform duration-200 group-hover:scale-105">
                                <Search className="h-7 w-7" />
                            </div>
                            <div className="text-base text-foreground font-medium transform transition-transform duration-200 group-hover:scale-105">
                                Consultar faturamentos
                            </div>
                        </div>
                    </Link>

                    <Link
                        href="/asti/faturamento/atualizar-status"
                        className="group block bg-white rounded-lg shadow-md border border-gray-100 p-10 sm:p-8 transform transition-transform duration-200 w-72 sm:w-80 md:w-96 hover:scale-105 hover:border-emerald-200 hover:bg-gradient-to-br from-emerald-100/15 to-white/90 sm:col-span-2 sm:justify-self-center"
                    >
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 transform transition-transform duration-200 group-hover:scale-105">
                                <RefreshCw className="h-7 w-7" />
                            </div>
                            <div className="text-base text-foreground font-medium transform transition-transform duration-200 group-hover:scale-105">
                                Atualizar status
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        );

    } else {
        return (
            <div className="max-w-full mx-auto">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                    <Link href="/asti/compras/cadastrar" className="group block bg-white rounded-lg shadow-md border border-gray-100 p-10 sm:p-8 transform transition-transform duration-200 w-72 sm:w-80 md:w-96 hover:scale-105 hover:border-emerald-200 hover:bg-gradient-to-br from-emerald-100/15 to-white/90">
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 transform transition-transform duration-200 group-hover:scale-105">
                                <Plus className="h-7 w-7" />
                            </div>
                            <div className="text-base text-foreground font-medium transform transition-transform duration-200 group-hover:scale-105">Cadastrar orçamento</div>
                        </div>
                    </Link>

                    <Link href="/asti/compras/consultar" className="group block bg-white rounded-lg shadow-md border border-gray-100 p-10 sm:p-8 transform transition-transform duration-200 w-72 sm:w-80 md:w-96 hover:scale-105 hover:border-emerald-200 hover:bg-gradient-to-br from-emerald-100/15 to-white/90">
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 transform transition-transform duration-200 group-hover:scale-105">
                                <Search className="h-7 w-7" />
                            </div>
                            <div className="text-base text-foreground font-medium transform transition-transform duration-200 group-hover:scale-105">Consultar orçamentos</div>
                        </div>
                    </Link>
                </div>
            </div>
        )
    }
}
