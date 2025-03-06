"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Download, Trash2, FileIcon } from "lucide-react"
import { FileUpload } from "./file-upload"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { getUserIcon } from "@/lib/utils"

interface Anexo {
  id: number
  nome_arquivo: string
  caminho_arquivo: string
  tipo_arquivo: string
  tamanho_bytes: number
  data_upload: string
  usuario_email: string
}

interface TaskAttachmentsProps {
  taskId: number
  canEdit?: boolean
}

export function TaskAttachments({ taskId, canEdit = false }: TaskAttachmentsProps) {
  const [anexos, setAnexos] = useState<Anexo[]>([])

  const loadAnexos = useCallback(async () => {
    try {
      const response = await fetch(`/api/anexos?taskId=${taskId}`)
      if (!response.ok) {
        throw new Error("Erro ao carregar anexos")
      }
      const data = await response.json()
      setAnexos(data)
    } catch (error) {
      console.error("Erro ao carregar anexos:", error)
    }
  }, [taskId])

  useEffect(() => {
    loadAnexos()
  }, [taskId, loadAnexos])

  const handleDownload = async (anexoId: number, fileName: string) => {
    try {
      const response = await fetch(`/api/anexos/download/${anexoId}`)
      if (!response.ok) {
        throw new Error("Erro ao baixar arquivo")
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Erro ao baixar arquivo:", error)
      alert("Erro ao baixar arquivo")
    }
  }

  const handleDelete = async (anexoId: number) => {
    try {
      const response = await fetch(`/api/anexos/${anexoId}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        throw new Error("Erro ao excluir anexo")
      }

      setAnexos(anexos.filter(anexo => anexo.id !== anexoId))
    } catch (error) {
      console.error("Erro ao excluir anexo:", error)
      alert("Erro ao excluir anexo")
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️'
    if (mimeType.startsWith('video/')) return '🎥'
    if (mimeType.startsWith('audio/')) return '🎵'
    if (mimeType.includes('pdf')) return '📄'
    if (mimeType.includes('word')) return '📝'
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊'
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📊'
    return '📁'
  }

  const formatUserName = (email: string) => {
    const NOME_EXCEPTIONS: Record<string, string> = {
      "alexsolano@epamig.br": "Alex Solano"
    };
    
    if (NOME_EXCEPTIONS[email]) {
      return NOME_EXCEPTIONS[email];
    }
    
    const username = email.split('@')[0];
    
    return username
      .split('.')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  return (
    <div className="h-[600px] flex flex-col">
      {canEdit && (
        <div className="mb-6">
          <FileUpload 
            taskId={taskId} 
            onUploadComplete={loadAnexos}
            totalAnexos={anexos.length}
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Arquivos Anexados</h3>
          <span className="text-sm text-muted-foreground">
            {anexos.length} {anexos.length === 1 ? 'arquivo' : 'arquivos'}
          </span>
        </div>

        {anexos.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 pb-4">
            {anexos.map((anexo) => (
              <Card key={anexo.id} className="group hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">
                      {getFileIcon(anexo.tipo_arquivo)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{anexo.nome_arquivo}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <span>{formatFileSize(anexo.tamanho_bytes)}</span>
                        <span>•</span>
                        <span>{new Date(anexo.data_upload).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between gap-1 mt-4 pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={getUserIcon(anexo.usuario_email)} />
                        <AvatarFallback>
                          {anexo.usuario_email ? anexo.usuario_email[0].toUpperCase() : '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">
                        {anexo.usuario_email ? formatUserName(anexo.usuario_email) : 'Desconhecido'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(anexo.id, anexo.nome_arquivo)}
                        className="h-8 gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Baixar
                      </Button>
                      {canEdit && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o arquivo &ldquo;{anexo.nome_arquivo}&rdquo;? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(anexo.id)}
                                className="bg-red-500 hover:bg-red-600 text-white"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[400px] text-center border-2 border-dashed rounded-lg p-6">
            <FileIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nenhum anexo encontrado</p>
            {canEdit && (
              <p className="text-sm text-muted-foreground mt-2">
                Arraste arquivos aqui ou use o botão acima para fazer upload
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 