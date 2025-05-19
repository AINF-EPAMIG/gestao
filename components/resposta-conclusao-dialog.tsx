"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Check, X } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

interface RespostaConclusaoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (resposta: string) => Promise<void>
  onCancel: () => void
}

export function RespostaConclusaoDialog({ 
  open, 
  onOpenChange,
  onSave,
  onCancel
}: RespostaConclusaoDialogProps) {
  const [resposta, setResposta] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!resposta.trim()) {
      setError("A resposta de conclusão é obrigatória")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await onSave(resposta)
      onOpenChange(false)
    } catch {
      setError("Erro ao salvar resposta. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) {
        onCancel()
      }
      onOpenChange(open)
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Resposta de Conclusão</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-gray-500 mb-4">
            Para concluir o chamado, é necessário preencher uma resposta de conclusão.
          </p>

          <div className="space-y-2">
            <div>
              <Textarea
                value={resposta}
                onChange={(e) => {
                  const text = e.target.value
                  if (text.length <= 600) {
                    setResposta(text)
                  }
                }}
                placeholder="Digite a resposta de conclusão..."
                className="min-h-[100px]"
                maxLength={600}
              />
              <div className="text-right mt-1 text-xs text-gray-400">
                {resposta.length}/600
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600">{error}</div>
            )}

            <div className="flex items-center justify-end gap-2 mt-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onCancel()
                  onOpenChange(false)
                }}
                disabled={isLoading}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                <span>Cancelar</span>
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                <Check className="h-3.5 w-3.5 mr-1" />
                <span>Salvar</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 