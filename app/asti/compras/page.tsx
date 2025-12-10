import { SidebarSistema } from "@/components/sidebar-sistema";
import { PageHeader } from "@/components/page-header";
import CardsButton from "@/components/cards-button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function Compras(){
   return (
           <div className="flex min-h-screen bg-white overflow-x-hidden">
                <SidebarSistema />
                <main className="flex-1 min-w-0 w-full p-4 min-h-screen relative">
                    <div className="pt-14 lg:pt-4 flex gap-4">
                    <Link href="/asti/home" className="inline-flex justify-center items-center hover:text-gray-700/80 transition-colors duration-200 w-10 h-10 p-2">
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
            </div>
            )
}