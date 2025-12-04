"use client";

import Link from "next/link";
import { ArrowLeftRight } from "lucide-react";
import { TvAstiForm } from "@/components/tv-asti-form";
import { SidebarSistema } from "@/components/sidebar-sistema"



export default function TvAstiCadastroPage() {
  return (
    <div className="px-4 py-8 lg:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <SidebarSistema />
        <header className="rounded-3xl border border-emerald-100 bg-white/70 p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">TV ASTI</p>
              <h1 className="mt-2 text-3xl font-bold text-gray-900">Cadastro de Conteúdo</h1>
              <p className="mt-2 text-sm text-gray-500">
                Utilize este formulário para criar novas notícias em texto ou cards com imagem para a TV interativa.
              </p>
            </div>
            <Link
              href="/asti/tv-asti/consulta"
              className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm transition hover:bg-emerald-50"
            >
              <ArrowLeftRight className="h-4 w-4" /> Ir para consulta
            </Link>
          </div>
        </header>

        <TvAstiForm />
      </div>
    </div>
  );
}
