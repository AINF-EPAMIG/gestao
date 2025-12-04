"use client";

import { useState } from "react";
import Image from "next/image";
import { AlertCircle, ImageIcon, Loader2, RefreshCcw, Trash2 } from "lucide-react";
import type { TvContent, TvEntryKind, TvNews } from "@/lib/types";

export type TvAstiListProps = {
  news: TvNews[];
  contents: TvContent[];
  loading: boolean;
  onRefresh?: () => Promise<void> | void;
};

export function TvAstiList({ news, contents, loading, onRefresh }: TvAstiListProps) {
  const [actionError, setActionError] = useState<string | null>(null);
  const hasNoData = !news.length && !contents.length;

  const handleDelete = async (kind: TvEntryKind, id: number) => {
    if (!confirm("Confirma excluir este conteúdo?")) return;
    setActionError(null);
    try {
      const response = await fetch(`/api/tv-asti/itens/${kind}/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.erro || "Falha ao remover conteúdo");
      }
      await onRefresh?.();
    } catch (error) {
      console.error(error);
      setActionError(error instanceof Error ? error.message : "Erro ao remover conteúdo");
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Conteúdos cadastrados</h2>
          {actionError && <p className="mt-1 text-sm text-red-600">{actionError}</p>}
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          {loading && (
            <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Carregando</span>
          )}
          <button
            type="button"
            onClick={() => onRefresh?.()}
            className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 px-4 py-2 font-medium text-emerald-700 shadow-sm transition hover:bg-emerald-50"
          >
            <RefreshCcw className="h-4 w-4" /> Atualizar
          </button>
        </div>
      </div>

      {hasNoData && !loading ? (
        <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-gray-200 p-10 text-center text-gray-500">
          <AlertCircle className="h-10 w-10 text-emerald-500" />
          <p>Nenhum conteúdo cadastrado ainda. Use o formulário para criar o primeiro card.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {news.map((item) => (
            <article key={`news-${item.id}`} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-emerald-600">Notícia</p>
                  <h3 className="text-xl font-semibold text-gray-900">{item.title}</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">{item.message}</p>
                  <p className="mt-3 text-xs text-gray-400">Publicado em {new Date(item.publishedAt).toLocaleString("pt-BR")}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete("news", item.id)}
                  className="rounded-full border border-red-100 p-2 text-red-600 transition hover:bg-red-50"
                  aria-label="Excluir notícia"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}

          {contents.map((item) => (
            <article key={`content-${item.id}`} className="rounded-3xl border border-gray-100 bg-white shadow-sm">
              {item.imageDataUrl ? (
                <div className="relative h-56 w-full overflow-hidden rounded-t-3xl">
                  <Image
                    src={item.imageDataUrl}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              ) : (
                <div className="flex h-56 items-center justify-center rounded-t-3xl bg-emerald-50 text-emerald-600">
                  <ImageIcon className="h-10 w-10" />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-emerald-600">Card interativo</p>
                    <h3 className="text-xl font-semibold text-gray-900">{item.title}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete("media", item.id)}
                    className="rounded-full border border-red-100 p-2 text-red-600 transition hover:bg-red-50"
                    aria-label="Excluir card"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">{item.description}</p>
                <p className="mt-3 text-xs text-gray-400">Publicado em {new Date(item.publishedAt).toLocaleString("pt-BR")}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default TvAstiList;
