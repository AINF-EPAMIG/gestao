"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X, FileUp, Loader2 } from "lucide-react"
import { useTaskStore } from "@/lib/store"

interface FileUploadProps {
  taskId?: number
  onUploadComplete?: () => void
  onFileSelect?: (files: File[]) => void
  onRemoveFile?: (id: string) => void
  files?: { id: string; file: File }[]
  showUploadButton?: boolean
  totalAnexos?: number
}

export function FileUpload({ 
  taskId, 
  onUploadComplete,
  onFileSelect,
  onRemoveFile,
  files = [],
  showUploadButton = true,
  totalAnexos = 0
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [localFiles, setLocalFiles] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const updateTaskTimestamp = useTaskStore((state) => state.updateTaskTimestamp)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      
      // Verifica se está tentando enviar mais de um arquivo
      if (selectedFiles.length > 1) {
        setError("Por favor, selecione apenas 1 arquivo por vez")
        e.target.value = "" // Limpa a seleção
        return
      }

      // Verifica se já atingiu o limite de 10 arquivos
      if (totalAnexos >= 10) {
        setError("Limite máximo de 10 arquivos por tarefa atingido")
        e.target.value = "" // Limpa a seleção
        return
      }

      if (onFileSelect) {
        onFileSelect(selectedFiles)
      } else {
        setLocalFiles(selectedFiles)
      }
    }
  }

  const handleUpload = async () => {
    if (localFiles.length === 0 || !taskId) return

    setUploading(true)
    console.log("[FileUpload] Iniciando upload de arquivos", {
      numberOfFiles: localFiles.length,
      taskId
    })

    const formData = new FormData()
    formData.append("taskId", taskId.toString())
    
    localFiles.forEach(file => {
      console.log("[FileUpload] Adicionando arquivo ao FormData:", {
        name: file.name,
        type: file.type,
        size: file.size
      })
      formData.append("files", file)
    })

    try {
      console.log("[FileUpload] Enviando requisição para o servidor")
      const response = await fetch("/api/anexos/upload", {
        method: "POST",
        body: formData
      })

      const responseData = await response.json()
      
      if (!response.ok) {
        console.error("[FileUpload] Erro na resposta do servidor:", {
          status: response.status,
          statusText: response.statusText,
          data: responseData,
          details: responseData.details || 'Sem detalhes adicionais'
        })
        throw new Error(responseData.error || "Erro ao fazer upload dos arquivos")
      }

      console.log("[FileUpload] Upload concluído com sucesso:", responseData)

      setLocalFiles([])
      
      // Limpa o input de arquivo para permitir selecionar o mesmo arquivo novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      
      // Atualiza o timestamp da tarefa no store
      updateTaskTimestamp(taskId)
      
      if (onUploadComplete) {
        onUploadComplete()
      }
    } catch (error) {
      console.error("[FileUpload] Erro durante o upload:", {
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        } : error,
        type: typeof error
      })
      alert(error instanceof Error ? error.message : "Erro ao fazer upload dos arquivos")
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveFile = (index: number) => {
    setLocalFiles(localFiles.filter((_, i) => i !== index))
    
    // Limpa o input de arquivo para permitir selecionar o mesmo arquivo novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const filesToShow = onFileSelect ? files : localFiles.map(file => ({ id: file.name, file }))

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            multiple={false}
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
            disabled={uploading}
            // Adicionando key para forçar a recriação do componente
            key={`file-input-${localFiles.length}`}
          />
          <label
            htmlFor="file-upload"
            className={`flex items-center justify-center w-full gap-2 px-4 py-3 text-sm font-medium text-gray-700 bg-white border-2 border-dashed rounded-lg cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'} transition-colors`}
          >
            <Upload className="h-5 w-5" />
            Selecionar Arquivo
          </label>
          {error && (
            <p className="text-sm text-red-500 mt-2">{error}</p>
          )}
        </div>
        {showUploadButton && localFiles.length > 0 && (
          <Button
            onClick={handleUpload}
            disabled={uploading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <FileUp className="h-4 w-4" />
                {`Enviar ${localFiles.length} ${localFiles.length === 1 ? 'arquivo' : 'arquivos'}`}
              </>
            )}
          </Button>
        )}
      </div>

      {filesToShow.length > 0 && (
        <div className="space-y-2 bg-gray-50 rounded-lg p-3">
          <div className="text-sm font-medium text-gray-700 mb-2">
            Arquivos selecionados:
          </div>
          {filesToShow.map(({ id, file }) => (
            <div
              key={id}
              className="flex items-center justify-between py-2 px-3 bg-white rounded-md shadow-sm"
            >
              <span className="text-sm truncate flex-1">{file.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveFile ? onRemoveFile(id) : handleRemoveFile(0)}
                className="h-8 w-8 hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 