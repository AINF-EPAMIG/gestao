"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X, FileUp, Loader2, FileArchive, SplitSquareVertical, AlertTriangle } from "lucide-react"
import { useTaskStore } from "@/lib/store"
import { needsProcessing, processLargeFile, MAX_UPLOAD_SIZE } from "@/lib/file-utils"

interface FileUploadProps {
  taskId?: number
  onUploadComplete?: () => void
  onFileSelect?: (files: File[]) => void
  onRemoveFile?: (id: string) => void
  files?: { id: string; file: File }[]
  showUploadButton?: boolean
  totalAnexos?: number
}

// Função para formatar o tamanho do arquivo
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' bytes';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
  else return (bytes / 1073741824).toFixed(1) + ' GB';
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
  const [processing, setProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const updateTaskTimestamp = useTaskStore((state) => state.updateTaskTimestamp)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      
      // Verifica se está tentando enviar mais de um arquivo
      if (selectedFiles.length > 1) {
        setError("Por favor, selecione apenas 1 arquivo por vez")
        e.target.value = "" // Limpa a seleção
        return
      }

      const file = selectedFiles[0];
      
      // Verifica se o arquivo é um arquivo compactado
      const compressedFormats = [
        'application/zip', 
        'application/x-zip-compressed',
        'application/x-rar-compressed',
        'application/vnd.rar',
        'application/x-7z-compressed',
        'application/gzip',
        'application/x-tar'
      ];
      
      // Verifica pelo tipo MIME ou pela extensão do arquivo
      const isCompressedFile = 
        compressedFormats.includes(file.type) || 
        /\.(zip|rar|7z|tar|gz|tgz)$/i.test(file.name);
      
      if (isCompressedFile) {
        setError("Não é permitido enviar arquivos compactados (ZIP, RAR, etc.) que podem conter múltiplos arquivos. Por favor, envie os arquivos individualmente.")
        e.target.value = "" // Limpa a seleção
        return
      }

      // Verifica se já atingiu o limite de 10 arquivos
      if (totalAnexos >= 10) {
        setError("Limite máximo de 10 arquivos por tarefa atingido")
        e.target.value = "" // Limpa a seleção
        return
      }

      // Verifica se o arquivo precisa ser processado (compactado/dividido)
      if (needsProcessing(file)) {
        try {
          setProcessing(true);
          setProcessingStatus(`Processando arquivo grande (${formatFileSize(file.size)})...`);
          
          // Processa o arquivo grande
          const result = await processLargeFile(file);
          
          if (result.isSplit) {
            setProcessingStatus(`Arquivo foi compactado e dividido em ${result.files.length} partes`);
          } else if (result.isCompressed) {
            setProcessingStatus(`Arquivo foi compactado (${formatFileSize(result.files[0].size)})`);
          }
          
          // Atualiza os arquivos locais com os processados
          if (onFileSelect) {
            onFileSelect(result.files);
          } else {
            setLocalFiles(result.files);
          }
        } catch (error) {
          console.error("Erro ao processar arquivo:", error);
          setError("Erro ao processar arquivo grande. Tente novamente.");
          e.target.value = ""; // Limpa a seleção
        } finally {
          setProcessing(false);
        }
      } else {
        // Arquivo não precisa ser processado, usa normalmente
        if (onFileSelect) {
          onFileSelect(selectedFiles);
        } else {
          setLocalFiles(selectedFiles);
        }
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
      setProcessingStatus(null)
      
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
    setProcessingStatus(null)
    
    // Limpa o input de arquivo para permitir selecionar o mesmo arquivo novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const filesToShow = onFileSelect ? files : localFiles.map(file => ({ id: file.name, file }))

  return (
    <div className="space-y-4">
      {/* Área de seleção de arquivo e botão de upload */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              multiple={false}
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              disabled={uploading || processing}
              // Adicionando key para forçar a recriação do componente
              key={`file-input-${localFiles.length}`}
            />
            <label
              htmlFor="file-upload"
              className={`flex items-center justify-center w-full gap-2 px-4 py-3 text-sm font-medium text-gray-700 bg-white border-2 border-dashed rounded-lg cursor-pointer ${(uploading || processing) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'} transition-colors`}
            >
              <Upload className="h-5 w-5" />
              {processing ? 'Processando...' : 'Selecionar Arquivo'}
            </label>
          </div>
          
          {showUploadButton && localFiles.length > 0 && (
            <Button
              onClick={handleUpload}
              disabled={uploading || processing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 whitespace-nowrap h-[46px]"
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
        
        {/* Área de mensagens e informações */}
        <div className="space-y-2">
          {error && (
            <p className="text-sm text-red-500 flex items-start gap-1">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </p>
          )}
          
          {processingStatus && (
            <p className="text-sm text-blue-500">{processingStatus}</p>
          )}
          
          <p className="text-xs text-gray-500">
            Arquivos maiores que {formatFileSize(MAX_UPLOAD_SIZE)} serão automaticamente compactados ou divididos.
          </p>
        </div>
      </div>

      {/* Lista de arquivos selecionados */}
      {filesToShow.length > 0 && (
        <div className="space-y-2 bg-gray-50 rounded-lg p-3">
          <div className="text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
            <span>Arquivos selecionados:</span>
            <span className="text-xs text-gray-500">
              {filesToShow.length} {filesToShow.length === 1 ? 'arquivo' : 'arquivos'}
            </span>
          </div>
          {filesToShow.map(({ id, file }) => (
            <div
              key={id}
              className="flex items-center justify-between py-2 px-3 bg-white rounded-md shadow-sm"
            >
              <div className="flex items-center gap-2 flex-1 truncate">
                {file.name.endsWith('.zip') && (
                  <div className="flex items-center gap-1">
                    <FileArchive className="h-4 w-4 text-blue-500" />
                    <span className="text-xs text-blue-500 whitespace-nowrap">(Compactado)</span>
                  </div>
                )}
                {file.name.includes('.part') && (
                  <div className="flex items-center gap-1">
                    <SplitSquareVertical className="h-4 w-4 text-orange-500" />
                    <span className="text-xs text-orange-500 whitespace-nowrap">(Parte)</span>
                  </div>
                )}
                <span className="text-sm truncate">{file.name}</span>
                <span className="text-xs text-gray-500 whitespace-nowrap">({formatFileSize(file.size)})</span>
              </div>
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