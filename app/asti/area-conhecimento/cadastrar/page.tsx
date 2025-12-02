import { SidebarSistema } from "@/components/sidebar-sistema"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import FormsCadastro from "@/components/forms-cadastro"


export default function CadastroAreaConhecimento() {
   return (
      <>
         <SidebarSistema />
         <main className="lg:ml-[280px]">

               <Link href="/asti/home" className="inline-flex justify-center items-center hover:text-gray-700/80 transition-colors duration-200 w-10 h-10 p-2">
                  <ArrowLeft />
               </Link>

            <FormsCadastro />
         </main>
      </>
   )
}