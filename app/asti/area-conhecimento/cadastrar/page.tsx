import { SidebarSistema } from "@/components/sidebar-sistema"
import { PageHeader } from "@/components/page-header"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import FormsCadastro from "@/components/forms-cadastro"


export default function CadastroAreaConhecimento() {
   return (
      <>
         <SidebarSistema />
         <main className="lg:ml-[280px] p-6">
            <div className="p-4 pt-8 lg:pt-6 max-w-[100vw] overflow-x-hidden flex gap-4">
               <Link href="/asti/home" className="inline-flex justify-center items-center hover:text-gray-700/80 transition-colors duration-200 w-10 h-10 p-2">
                  <ArrowLeft />
               </Link>
               <PageHeader title="Área de conhecimento" subtitle="Cadastro" />
            </div>
            <FormsCadastro />
         </main>
      </>
   )
}