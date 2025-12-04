"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeftRight } from "lucide-react";
import { TvAstiList } from "@/components/tv-asti-list";
import type { TvContent, TvNews } from "@/lib/types";
import { SidebarSistema } from "@/components/sidebar-sistema"

export default function TvAstiConsultaPage() {
  const [items, setItems] = useState<{ news: TvNews[]; contents: TvContent[] }>({ news: [], contents: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/tv-asti/itens", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Falha ao buscar itens");
      }
      const data = await response.json();
      setItems({
        news: Array.isArray(data.news) ? data.news : [],
        contents: Array.isArray(data.contents) ? data.contents : []
      });
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar os conteúdos da TV.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return (
    <div className="px-4 py-8 lg:px-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <SidebarSistema />
        <header className="rounded-3xl border border-emerald-100 bg-white/70 p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">TV ASTI</p>
              <h1 className="mt-2 text-3xl font-bold text-gray-900">Consulta de Conteúdos</h1>
              <p className="mt-2 text-sm text-gray-500">
                Acompanhe tudo o que está publicado na TV interativa e remova itens que não fazem mais sentido.
              </p>
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>
            <Link
              href="/asti/tv-asti/cadastro"
              className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm transition hover:bg-emerald-50"
            >
              <ArrowLeftRight className="h-4 w-4" /> Ir para cadastro
            </Link>
          </div>
        </header>

        <TvAstiList news={items.news} contents={items.contents} loading={loading} onRefresh={fetchItems} />
      </div>
    </div>
  );
}
