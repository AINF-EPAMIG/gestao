import { SidebarSistema } from "@/components/sidebar-sistema";
import Cards from "@/components/cards";
import { PageHeader } from "@/components/page-header";


export default function SistemaAsti(){
   return (
           <>
                <SidebarSistema />
                <main className="lg:ml-[280px] p-6">
                    <div className="p-4 pt-10 lg:pt-6 max-w-[100vw] overflow-x-hidden">
                    <PageHeader title="Sistema ASTI" />
                    <Cards />
                    </div>
                </main>
           </>
       )
}
