"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { ImageIcon, Loader2, Newspaper, Upload } from "lucide-react";
import type { TvEntryKind } from "@/lib/types";

export type TvAstiFormProps = {
  onCreated?: () => Promise<void> | void;
};

type NewsFormState = {
  title: string;
  message: string;
};

type ContentFormState = {
  title: string;
  description: string;
};

type ImageState = {
  preview: string;
  base64: string;
  mimeType: string;
  fileName: string;
  size: number;
};

const defaultNewsForm: NewsFormState = {
  title: "",
  message: "",
};

const defaultContentForm: ContentFormState = {
  title: "",
  description: "",
};

export function TvAstiForm({ onCreated }: TvAstiFormProps) {
  const [mode, setMode] = useState<TvEntryKind>("news");
  const [newsForm, setNewsForm] = useState<NewsFormState>(defaultNewsForm);
  const [contentForm, setContentForm] = useState<ContentFormState>(defaultContentForm);
  const [imageState, setImageState] = useState<ImageState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTabChange = (kind: TvEntryKind) => {
    setMode(kind);
    setFeedback(null);
    setError(null);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setImageState(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Selecione um arquivo de imagem válido.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const commaIndex = result.indexOf(",");
      const base64 = commaIndex > -1 ? result.substring(commaIndex + 1) : result;
      setImageState({
        preview: result,
        base64,
        mimeType: file.type,
        fileName: file.name,
        size: file.size
      });
    };
    reader.readAsDataURL(file);
  };

  const resetForms = () => {
    setNewsForm(defaultNewsForm);
    setContentForm(defaultContentForm);
    setImageState(null);
    const input = document.getElementById("tv-image-input") as HTMLInputElement | null;
    if (input) input.value = "";
  };

  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    setError(null);

    try {
      if (mode === "media" && !imageState) {
        throw new Error("Selecione uma imagem para o card.");
      }

      if (mode === "news" && !newsForm.message.trim()) {
        throw new Error("Digite o texto da notícia.");
      }

      if (mode === "media" && !contentForm.description.trim()) {
        throw new Error("Descreva o card que será exibido.");
      }

      const trimmedTitle = (mode === "news" ? newsForm.title : contentForm.title).trim();
      if (!trimmedTitle) {
        throw new Error("Informe um título para o conteúdo.");
      }

      const payload = mode === "news"
        ? {
            type: "news" as const,
            title: trimmedTitle,
            message: newsForm.message.trim()
          }
        : {
            type: "media" as const,
            title: trimmedTitle,
            description: contentForm.description.trim(),
            image: imageState
          };

      const response = await fetch("/api/tv-asti/itens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.erro || "Falha ao cadastrar conteúdo");
      }

      resetForms();
      setFeedback("Conteúdo cadastrado com sucesso!");
      await onCreated?.();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Erro inesperado ao salvar");
    } finally {
      setSubmitting(false);
    }
  }, [contentForm, imageState, mode, newsForm, onCreated]);

  return (
    <div className="rounded-3xl border border-gray-100 bg-white/95 p-6 shadow-lg">
      <div className="flex gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-1 text-sm font-medium text-emerald-700">
        <button
          type="button"
          onClick={() => handleTabChange("news")}
          className={`flex-1 rounded-2xl px-4 py-2 transition ${mode === "news" ? "bg-white shadow" : "text-emerald-600/80"}`}
        >
          <div className="flex items-center justify-center gap-2">
            <Newspaper className="h-4 w-4" /> Notícias rápidas
          </div>
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("media")}
          className={`flex-1 rounded-2xl px-4 py-2 transition ${mode === "media" ? "bg-white shadow" : "text-emerald-600/80"}`}
        >
          <div className="flex items-center justify-center gap-2">
            <ImageIcon className="h-4 w-4" /> Conteúdo com imagem
          </div>
        </button>
      </div>

      {(error || feedback) && (
        <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
          {error ? error : feedback}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {mode === "news" ? (
          <>
            <div>
              <label className="text-sm font-semibold text-gray-700">Título</label>
              <input
                type="text"
                value={newsForm.title}
                onChange={(e) => setNewsForm((prev) => ({ ...prev, title: e.target.value }))}
                required
                className="mt-1 w-full rounded-2xl border px-4 py-3 text-sm focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                placeholder="Informe o título da notícia"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Mensagem</label>
              <textarea
                value={newsForm.message}
                onChange={(e) => setNewsForm((prev) => ({ ...prev, message: e.target.value }))}
                required
                rows={4}
                className="mt-1 w-full rounded-2xl border px-4 py-3 text-sm focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                placeholder="Digite o conteúdo que será exibido na TV"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="text-sm font-semibold text-gray-700">Título</label>
              <input
                type="text"
                value={contentForm.title}
                onChange={(e) => setContentForm((prev) => ({ ...prev, title: e.target.value }))}
                required
                className="mt-1 w-full rounded-2xl border px-4 py-3 text-sm focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                placeholder="Informe o título do card"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Descrição</label>
              <textarea
                value={contentForm.description}
                onChange={(e) => setContentForm((prev) => ({ ...prev, description: e.target.value }))}
                required
                rows={4}
                className="mt-1 w-full rounded-2xl border px-4 py-3 text-sm focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                placeholder="Explique o que aparecerá na TV"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Imagem principal</label>
              <div className="mt-1 flex flex-col gap-3 rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 p-6 text-center">
                {imageState ? (
                  <div className="relative mx-auto h-48 w-full overflow-hidden rounded-2xl">
                    <Image src={imageState.preview} alt="Pré-visualização" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-emerald-700">
                    <Upload className="h-8 w-8" />
                    <p className="text-sm text-gray-600">Arraste ou clique para enviar uma imagem (JPG, PNG, até 5 MB)</p>
                  </div>
                )}
                <input id="tv-image-input" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                <label
                  htmlFor="tv-image-input"
                  className="mx-auto inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-300 transition hover:bg-emerald-700"
                >
                  <ImageIcon className="h-4 w-4" /> Selecionar imagem
                </label>
              </div>
            </div>
          </>
        )}

        <div className="flex flex-col gap-3 pt-4 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-gray-500">Conteúdos com maior prioridade são exibidos primeiro na TV.</p>
          <button
            type="submit"
            disabled={submitting || (mode === "media" && !imageState)}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "news" ? "Salvar notícia" : "Salvar card"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default TvAstiForm;
