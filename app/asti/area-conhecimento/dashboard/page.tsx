import { Dashboard } from "@/components/dashboard-conhecimento"
import { SidebarSistema } from "@/components/sidebar-sistema"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function Page() {
   return (
      <>
         <SidebarSistema />
         <main className="lg:ml-[280px] p-6">
            <section className="mt-2">
               <Dashboard
                  headerPrefix={
                     <Link
                        href="/asti/home"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-transparent p-2 text-muted-foreground transition-colors hover:border-muted-foreground/20 hover:text-gray-700"
                        aria-label="Voltar para o menu"
                     >
                        <ArrowLeft />
                     </Link>
                  }
               />
            </section>
         </main>
      </>
   )
}
