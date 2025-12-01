"use client"

import { FileText } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface PdfCardProps {
  title: string
  type: "Tutorial" | "POP"
  previewUrl?: string
  onClick?: () => void
}

export function PdfCard({ title, type, previewUrl, onClick }: PdfCardProps) {
  return (
    <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow" onClick={onClick}>
      {/* PDF Preview Area */}
      <div className="relative aspect-[3/4] bg-card border-b">
        {/* Header stripe */}
        <div className="absolute top-0 left-0 right-0 flex h-3">
          <div className="flex-1 bg-primary" />
          <div className="w-8 bg-accent" />
        </div>

        {/* PDF preview placeholder */}
        <div className="flex flex-col items-center justify-center h-full pt-3">
          {previewUrl ? (
            <iframe
              src={previewUrl}
              className="w-full h-full rounded-md border border-card bg-white"
              title={`Prévia de ${title}`}
              loading="lazy"
              referrerPolicy="no-referrer"
              style={{ pointerEvents: "none" }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <FileText className="h-16 w-16 mb-2" />
              <span className="text-xs">PDF Preview</span>
            </div>
          )}
        </div>

        <div className="absolute inset-0 pointer-events-none flex flex-col justify-end">
          <div className="bg-gradient-to-t from-black/60 to-transparent p-3 text-center text-xs font-medium text-white tracking-wide">
            Visualizar documento
          </div>
        </div>

      </div>

      {/* Card Footer */}
      <CardContent className="p-3 text-center">
        <h3 className="font-semibold text-foreground text-sm">{title}</h3>
        <p className="text-xs text-muted-foreground">{type}</p>
      </CardContent>
    </Card>
  )
}
