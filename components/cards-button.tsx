import { Plus, Search, ArrowRight, Clock, FilePenLine, ArrowLeftRight, RefreshCw } from "lucide-react"
import Link from "next/link"

export default function CardsButton({ type }: { type: string }) {
    if (type === 'ip') {
        return (
            <div className="max-w-full mx-auto">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                    <Link href="/gestao-ips/cadastrar" className="group block bg-white rounded-lg shadow-md border border-gray-100 p-10 sm:p-8 transform transition-transform duration-200 w-72 sm:w-80 md:w-96 hover:scale-105 hover:border-emerald-200 hover:bg-gradient-to-br from-emerald-100/15 to-white/90">
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 transform transition-transform duration-200 group-hover:scale-105">
                                <Plus className="h-7 w-7" />
                            </div>
                            <div className="text-base text-foreground font-medium transform transition-transform duration-200 group-hover:scale-105">Cadastrar Ip</div>
                        </div>
                    </Link>

                    <Link href="/gestao-ips/consultar" className="group block bg-white rounded-lg shadow-md border border-gray-100 p-10 sm:p-8 transform transition-transform duration-200 w-72 sm:w-80 md:w-96 hover:scale-105 hover:border-emerald-200 hover:bg-gradient-to-br from-emerald-100/15 to-white/90">
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
                    <Link href="/area-conhecimento/cadastrar" className="group block bg-white rounded-lg shadow-md border border-gray-100 p-10 sm:p-8 transform transition-transform duration-200 w-72 sm:w-80 md:w-96 hover:scale-105 hover:border-emerald-200 hover:bg-gradient-to-br from-emerald-100/15 to-white/90">
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 transform transition-transform duration-200 group-hover:scale-105">
                                <Plus className="h-7 w-7" />
                            </div>
                            <div className="text-base text-foreground font-medium transform transition-transform duration-200 group-hover:scale-105">Cadastrar tutorial</div>
                        </div>
                    </Link>

                    <Link href="/area-conhecimento/consultar" className="group block bg-white rounded-lg shadow-md border border-gray-100 p-10 sm:p-8 transform transition-transform duration-200 w-72 sm:w-80 md:w-96 hover:scale-105 hover:border-emerald-200 hover:bg-gradient-to-br from-emerald-100/15 to-white/90">
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

        
    }else if (type === 'contratos') {
        return (
            <div className="max-w-full mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-16 justify-items-center">
                    <Link href="/contratos/cadastrar" className="group block bg-white rounded-lg shadow-md border border-gray-100 p-10 sm:p-8 transform transition-transform duration-200 w-72 sm:w-80 md:w-96 hover:scale-105 hover:border-emerald-200 hover:bg-gradient-to-br from-emerald-100/15 to-white/90">
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 transform transition-transform duration-200 group-hover:scale-105">
                                <Plus className="h-7 w-7" />
                            </div>
                            <div className="text-base text-foreground font-medium transform transition-transform duration-200 group-hover:scale-105">Cadastrar contrato</div>
                        </div>
                    </Link>

                    <Link href="/contratos/consultar" className="group block bg-white rounded-lg shadow-md border border-gray-100 p-10 sm:p-8 transform transition-transform duration-200 w-72 sm:w-80 md:w-96 hover:scale-105 hover:border-emerald-200 hover:bg-gradient-to-br from-emerald-100/15 to-white/90">
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 transform transition-transform duration-200 group-hover:scale-105">
                                <Search className="h-7 w-7" />
                            </div>
                            <div className="text-base text-foreground font-medium transform transition-transform duration-200 group-hover:scale-105">Consultar contratos</div>
                        </div>
                    </Link>
                    <Link href="/contratos/vencimento" className="group block bg-white rounded-lg shadow-md border border-gray-100 p-10 sm:p-8 transform transition-transform duration-200 w-72 sm:w-80 md:w-96 hover:scale-105 hover:border-emerald-200 hover:bg-gradient-to-br from-emerald-100/15 to-white/90">
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 transform transition-transform duration-200 group-hover:scale-105">
                                <Clock className="h-7 w-7" />
                            </div>
                            <div className="text-base text-foreground font-medium transform transition-transform duration-200 group-hover:scale-105">Contratos próximo do vencimento</div>
                        </div>
                    </Link>
                    <Link href="/contratos/aditivar" className="group block bg-white rounded-lg shadow-md border border-gray-100 p-10 sm:p-8 transform transition-transform duration-200 w-72 sm:w-80 md:w-96 hover:scale-105 hover:border-emerald-200 hover:bg-gradient-to-br from-emerald-100/15 to-white/90">
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


        }else if (type === 'estoque') {
        return (
            <div className="max-w-full mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-16 justify-items-center">
                    <Link href="/controle-estoque/cadastrar" className="group block bg-white rounded-lg shadow-md border border-gray-100 p-10 sm:p-8 transform transition-transform duration-200 w-72 sm:w-80 md:w-96 hover:scale-105 hover:border-emerald-200 hover:bg-gradient-to-br from-emerald-100/15 to-white/90">
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 transform transition-transform duration-200 group-hover:scale-105">
                                <Plus className="h-7 w-7" />
                            </div>
                            <div className="text-base text-foreground font-medium transform transition-transform duration-200 group-hover:scale-105">Cadastrar equipamento</div>
                        </div>
                    </Link>

                    <Link href="/controle-estoque/consultar" className="group block bg-white rounded-lg shadow-md border border-gray-100 p-10 sm:p-8 transform transition-transform duration-200 w-72 sm:w-80 md:w-96 hover:scale-105 hover:border-emerald-200 hover:bg-gradient-to-br from-emerald-100/15 to-white/90">
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 transform transition-transform duration-200 group-hover:scale-105">
                                <Search className="h-7 w-7" />
                            </div>
                            <div className="text-base text-foreground font-medium transform transition-transform duration-200 group-hover:scale-105">Consultar equipamentos</div>
                        </div>
                    </Link>
                    <Link
        href="/estoque/movimentacao"
        className="group block bg-white rounded-lg shadow-md border border-gray-100 p-10 sm:p-8 transform transition-transform duration-200 w-72 sm:w-80 md:w-96 hover:scale-105 hover:border-emerald-200 hover:bg-gradient-to-br from-emerald-100/15 to-white/90 sm:col-span-2 sm:justify-self-center"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 transform transition-transform duration-200 group-hover:scale-105">
            <ArrowLeftRight className="h-7 w-7" />
          </div>
          <div className="text-base text-foreground font-medium transform transition-transform duration-200 group-hover:scale-105">
            Movimentação de estoque
          </div>
        </div>
      </Link>
                </div>
            </div>
        )


        }else if (type === 'faturamento') {
        return (
  <div className="max-w-full mx-auto">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-16 justify-items-center">
      <Link
        href="/faturamento/cadastrar"
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
        href="/faturamento/consultar"
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
        href="/faturamento/atualizar-status"
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

        }else{
            return (
            <div className="max-w-full mx-auto">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                    <Link href="/compras/cadastrar" className="group block bg-white rounded-lg shadow-md border border-gray-100 p-10 sm:p-8 transform transition-transform duration-200 w-72 sm:w-80 md:w-96 hover:scale-105 hover:border-emerald-200 hover:bg-gradient-to-br from-emerald-100/15 to-white/90">
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 transform transition-transform duration-200 group-hover:scale-105">
                                <Plus className="h-7 w-7" />
                            </div>
                            <div className="text-base text-foreground font-medium transform transition-transform duration-200 group-hover:scale-105">Cadastrar orçamento</div>
                        </div>
                    </Link>

                    <Link href="/compras/consultar" className="group block bg-white rounded-lg shadow-md border border-gray-100 p-10 sm:p-8 transform transition-transform duration-200 w-72 sm:w-80 md:w-96 hover:scale-105 hover:border-emerald-200 hover:bg-gradient-to-br from-emerald-100/15 to-white/90">
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
        /*
    } else if (type === 'ip2') {
        return (
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-wrap justify-center gap-8 gap-y-16">

                    <div className="group relative overflow-hidden bg-white/95 text-foreground rounded-lg p-6 shadow-md border border-gray-100 hover:bg-gradient-to-br from-emerald-200/15 to-white/90 hover:border-emerald-200 transition-all duration-200 hover:-translate-y-1 w-full max-w-[560px]">
                        <div className="flex flex-col gap-3">
                            <div className="h-10 w-10 rounded-md bg-gradient-to-br from-emerald-900 to-emerald-700 flex items-center justify-center text-white self-start">
                                <Plus className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-0 group-hover:text-emerald-700">Cadastrar IP</h3>
                            <p className="text-sm text-muted-foreground text-grey-200 mb-4">Cadastro de novos endereços de ips</p>
                            <div>
                                <Link href="/gestao-ips/cadastrar" className="inline-flex justify-center items-center gap-2 rounded-md bg-emerald-50 text-emerald-900 w-full py-3 text-sm shadow-sm hover:bg-emerald-100">
                                    Acessar
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                    <div className="group relative overflow-hidden bg-white/95 text-foreground rounded-lg p-6 shadow-md border border-gray-100 hover:bg-gradient-to-br from-emerald-200/15 to-white/90 hover:border-emerald-200 transition-all duration-200 hover:-translate-y-1 w-full max-w-[560px]">
                        <div className="flex flex-col gap-3">
                            <div className="h-10 w-10 rounded-md bg-gradient-to-br from-emerald-900 to-emerald-700 flex items-center justify-center text-white self-start">
                                <Search className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-0 group-hover:text-emerald-700">Consultar IP</h3>
                            <p className="text-sm text-muted-foreground text-grey-200 mb-4">Consulte e visualize os endereços de IP cadastrados.</p>
                            <div>
                                <Link href="/gestao-ips/cadastrar" className="inline-flex justify-center items-center gap-2 rounded-md bg-emerald-50 text-emerald-900 w-full py-3 text-sm shadow-sm hover:bg-emerald-100">
                                    Acessar
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
        */