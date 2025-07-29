"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Download, Trash2, FileIcon, Loader2, Eye } from "lucide-react"
import { FileUpload } from "./file-upload"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useTaskStore } from "@/lib/store"

interface Anexo {
  id: number
  nome_arquivo: string
  caminho_arquivo: string
  tipo_arquivo: string
  tamanho_bytes: number
  data_upload: string
  usuario_email: string
  google_drive_id: string
  google_drive_link: string
}

interface TaskAttachmentsProps {
  taskId: number
  canEdit?: boolean
}

export function TaskAttachments({ taskId, canEdit = false }: TaskAttachmentsProps) {
  const [anexos, setAnexos] = useState<Anexo[]>([])
  const [loadingDownload, setLoadingDownload] = useState<number | null>(null)
  const [loadingDelete, setLoadingDelete] = useState<number | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<number | null>(null)
  const [fileUploadKey, setFileUploadKey] = useState(0)
  const updateTaskTimestamp = useTaskStore((state) => state.updateTaskTimestamp)

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
      setLoadingDownload(anexoId)
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
    } finally {
      setLoadingDownload(null)
    }
  }

  const handleDelete = async (anexoId: number) => {
    try {
      setLoadingDelete(anexoId)
      setDeleteDialogOpen(null)
      
      const response = await fetch(`/api/anexos/${anexoId}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        throw new Error("Erro ao excluir anexo")
      }

      setAnexos(anexos.filter(anexo => anexo.id !== anexoId))
      
      setFileUploadKey(prev => prev + 1)
      
      updateTaskTimestamp(taskId)
    } catch (error) {
      console.error("Erro ao excluir anexo:", error)
      alert("Erro ao excluir anexo")
    } finally {
      setLoadingDelete(null)
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
            key={`file-upload-${fileUploadKey}`}
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-4">
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
                  
                  <div className="flex flex-wrap items-center justify-between mt-4 pt-3 border-t">
                    <div className="flex items-center gap-2 mb-2 lg:mb-0">
                      <Avatar className="w-6 h-6">
                        <AvatarImage email={anexo.usuario_email} />
                        <AvatarFallback>
                          {anexo.usuario_email ? anexo.usuario_email[0].toUpperCase() : '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">
                        {anexo.usuario_email ? formatUserName(anexo.usuario_email) : 'Desconhecido'}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {anexo.google_drive_link && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => window.open(anexo.google_drive_link, '_blank')}
                          className="h-8 w-8 rounded-md bg-white border border-gray-300 hover:bg-gray-50 text-gray-700"
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDownload(anexo.id, anexo.nome_arquivo)}
                        disabled={loadingDownload === anexo.id}
                        className="h-8 w-8 rounded-md bg-white border border-gray-300 hover:bg-gray-50 text-gray-700"
                        title="Baixar"
                      >
                        {loadingDownload === anexo.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                      {canEdit && (
                        <>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-md bg-white border border-gray-300 hover:bg-red-50 text-red-500"
                            title="Excluir"
                            disabled={loadingDelete === anexo.id}
                            onClick={() => setDeleteDialogOpen(anexo.id)}
                          >
                            {loadingDelete === anexo.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                          
                          <AlertDialog open={deleteDialogOpen === anexo.id} onOpenChange={(open) => {
                            if (!open) setDeleteDialogOpen(null);
                          }}>
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
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center border-2 border-dashed rounded-lg p-6 min-h-[120px]">
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