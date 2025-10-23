import { SidebarSistema } from "@/components/sidebar-sistema";
import { PageHeader } from "@/components/page-header";
import CardsButton from "@/components/cards-button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function Faturamento() {
    return (
        <>
            <SidebarSistema />
            <main className="lg:ml-[280px] p-6 min-h-screen flex flex-col">
                <div className="p-4 pt-8 lg:pt-6 max-w-[100vw] overflow-x-hidden flex gap-4">
                    <Link href="/sistema-asti" className="inline-flex justify-center items-center hover:text-gray-700/80 transition-colors duration-200 w-10 h-10 p-2">
                    <ArrowLeft/>
                    </Link>
                    <PageHeader title="Gestão de faturamentos" subtitle="O que deseja?" />
                </div>

                <div className="flex flex-1 items-center justify-center w-full px-4">
                    <CardsButton type="faturamento" />
                </div>
            </main>
        </>
    )
}