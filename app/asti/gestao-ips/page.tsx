import { SidebarSistema } from "@/components/sidebar-sistema";
import { PageHeader } from "@/components/page-header";
import CardsButton from "@/components/cards-button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function GestaoIps(){
   return (
           <>
                <SidebarSistema />
                <main className="lg:ml-[280px] min-h-screen flex flex-col">
                    <div className="px-6 pt-10 lg:pt-8 flex items-center gap-4">
                        <Link href="/asti/home" className="inline-flex justify-center items-center hover:text-gray-700/80 transition-colors duration-200 w-10 h-10 p-2">
                            <ArrowLeft/>
                        </Link>
                        <PageHeader title="Gestão de IPs" subtitle="O que deseja?" />
                    </div>

                    <div className="flex-1 flex justify-center items-start px-6 pt-8 pb-12">
                        <div className="w-full max-w-5xl mx-auto">
                            <CardsButton type='ip' />
                        </div>
                    </div>
                </main>
            </>
            )
}