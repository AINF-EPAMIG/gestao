"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { AlertTriangle, Download, Loader2, RefreshCw, Search, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PdfCard } from "./pdf-card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type ConhecimentoItem = {
  id: number
  nome: string
  descricao?: string
  tipo: 0 | 1
  anexo_id?: number | null
  nome_arquivo?: string | null
  google_drive_link?: string | null
}

const TYPE_LABEL: Record<ConhecimentoItem["tipo"], "Tutorial" | "POP"> = {
  0: "Tutorial",
  1: "POP",
}

type DashboardProps = {
  headerPrefix?: ReactNode
}

export function Dashboard({ headerPrefix }: DashboardProps) {
  const [items, setItems] = useState<ConhecimentoItem[]>([])
  const [searchValue, setSearchValue] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadIndex, setReloadIndex] = useState(0)
  const [selectedItem, setSelectedItem] = useState<ConhecimentoItem | null>(null)
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const [viewerUrl, setViewerUrl] = useState("")
  const [downloadUrl, setDownloadUrl] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchValue.trim()), 400)
    return () => clearTimeout(timer)
  }, [searchValue])

  useEffect(() => {
    const controller = new AbortController()
    async function loadKnowledge() {
      setIsLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        if (debouncedSearch) {
          params.append("nome", debouncedSearch)
        }
        const query = params.toString()
        const response = await fetch(`/api/conhecimento${query ? `?${query}` : ""}`, {
          signal: controller.signal,
          cache: "no-store",
        })
        if (!response.ok) {
          throw new Error("Não foi possível carregar os registros")
        }
        const data = (await response.json()) as ConhecimentoItem[]
        setItems(Array.isArray(data) ? data : [])
      } catch (fetchError) {
        if ((fetchError as DOMException)?.name === "AbortError") return
        setError((fetchError as Error).message)
      } finally {
        setIsLoading(false)
      }
    }

    loadKnowledge()
    return () => controller.abort()
  }, [debouncedSearch, reloadIndex])

  const { tutorials, pops } = useMemo(() => {
    const tutorialsList: ConhecimentoItem[] = []
    const popsList: ConhecimentoItem[] = []
    items.forEach((item) => {
      if (item.tipo === 0) tutorialsList.push(item)
      else popsList.push(item)
    })
    return { tutorials: tutorialsList, pops: popsList }
  }, [items])

  const buildPreviewUrl = (url: string) => {
    if (!url) return ""
    return url.includes("#") ? url : `${url}#page=1&zoom=page-fit&toolbar=0&navpanes=0`
  }

  const handleOpenViewer = (item: ConhecimentoItem, inlineUrl: string, downloadHref: string) => {
    if (!inlineUrl) return
    setSelectedItem(item)
    setViewerUrl(inlineUrl)
    setDownloadUrl(downloadHref)
    setIsViewerOpen(true)
  }

  const renderCards = (data: ConhecimentoItem[]) => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-72 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )
    }

    if (!data.length) {
      return (
        <div className="rounded-lg border border-dashed border-muted-foreground/30 p-6 text-center text-sm text-muted-foreground">
          Nenhum documento encontrado.
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {data.map((item) => {
          const inlineUrl = item.anexo_id
            ? `/api/conhecimento/anexos/${item.anexo_id}?inline=1`
            : item.google_drive_link || ""
          const downloadHref = item.anexo_id
            ? `/api/conhecimento/anexos/${item.anexo_id}`
            : item.google_drive_link || ""
          return (
            <PdfCard
              key={item.id}
              title={item.nome}
              type={TYPE_LABEL[item.tipo]}
              previewUrl={buildPreviewUrl(inlineUrl)}
              onClick={() => handleOpenViewer(item, inlineUrl, downloadHref)}
            />
          )
        })}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            {headerPrefix}
            <h1 className="text-2xl font-bold text-foreground">Área de Conhecimento</h1>
          </div>
          <p className="text-muted-foreground">Tutoriais e POPs publicados para consulta rápida</p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-72">
            <Input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Buscar por título"
              className="pr-10"
            />
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setReloadIndex((prev) => prev + 1)}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Atualizar
          </Button>
          <Button asChild className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700">
            <Link href="/asti/area-conhecimento/cadastrar" className="inline-flex items-center">
              <Plus className="h-4 w-4" /> Cadastrar novo
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        <div className="rounded-lg border bg-white/70 p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Total publicados</p>
          <p className="text-3xl font-semibold">{items.length}</p>
        </div>
        <div className="rounded-lg border bg-white/70 p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Tutoriais</p>
          <p className="text-3xl font-semibold text-emerald-700">{tutorials.length}</p>
        </div>
        <div className="rounded-lg border bg-white/70 p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">POPs</p>
          <p className="text-3xl font-semibold text-sky-700">{pops.length}</p>
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4" /> {error}
        </div>
      ) : (
        <div className="space-y-10">
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Tutoriais</h2>
              <p className="text-sm text-muted-foreground">
                Guias passo a passo publicados pela equipe ASTI
              </p>
            </div>
            {renderCards(tutorials)}
          </section>

          <section>
            <div className="mb-4">
              <h2 className="text-lg font-semibold">POPs</h2>
              <p className="text-sm text-muted-foreground">
                Procedimentos operacionais padrão disponíveis para consulta
              </p>
            </div>
            {renderCards(pops)}
          </section>
        </div>
      )}

      <Dialog
        open={isViewerOpen}
        onOpenChange={(open) => {
          setIsViewerOpen(open)
          if (!open) {
            setSelectedItem(null)
            setViewerUrl("")
            setDownloadUrl("")
          }
        }}
      >
        <DialogContent className="max-w-5xl w-full h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedItem?.nome || "Documento"}</DialogTitle>
            <DialogDescription>
              {selectedItem ? `${TYPE_LABEL[selectedItem.tipo]} · ${selectedItem.nome_arquivo || "PDF"}` : "Visualização completa do documento"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden rounded-lg border bg-muted">
            {viewerUrl ? (
              <iframe
                src={viewerUrl}
                className="h-full w-full bg-white"
                title={selectedItem?.nome || "Visualização do documento"}
                loading="lazy"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Nenhum documento selecionado.
              </div>
            )}
          </div>
          {downloadUrl && (
            <div className="mt-4 flex justify-end gap-3">
              <Button asChild className="gap-2 bg-sky-600 hover:bg-sky-700 text-white">
                <a href={downloadUrl} target="_blank" rel="noreferrer" className="inline-flex items-center">
                  <Download className="h-4 w-4" /> Baixar PDF
                </a>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
