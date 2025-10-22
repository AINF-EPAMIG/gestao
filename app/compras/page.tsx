import { SidebarSistema } from "@/components/sidebar-sistema";
import { PageHeader } from "@/components/page-header";
import CardsButton from "@/components/cards-button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function Compras(){
   return (
           <>
                <SidebarSistema />
                <main className="lg:ml-[280px] p-6 min-h-screen relative">
                    <div className="p-4 pt-8 lg:pt-6 max-w-[100vw] overflow-x-hidden flex gap-4">
                    <Link href="/sistema-asti" className="inline-flex justify-center items-center hover:text-gray-700/80 transition-colors duration-200 w-10 h-10 p-2">
                    <ArrowLeft/>
                    </Link>
                        <PageHeader title="Gestão de compras" subtitle="O que deseja?" />
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="pointer-events-auto w-full px-4">
                            <CardsButton type='compras' />
                        </div>
                    </div>
                </main>
            </>
            )
}