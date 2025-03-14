"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X, FileUp, Loader2, AlertTriangle } from "lucide-react"
import { useTaskStore } from "@/lib/store"
import { Progress } from "@/components/ui/progress"

interface FileUploadProps {
  taskId?: number
  onUploadComplete?: () => void
  onFileSelect?: (files: File[]) => void
  onRemoveFile?: (id: string) => void
  files?: { id: string; file: File }[]
  showUploadButton?: boolean
  totalAnexos?: number
}

// Tamanho máximo de arquivo em bytes (30MB)
const MAX_FILE_SIZE = 30 * 1024 * 1024;
// Tamanho de cada parte em bytes (5MB)
const CHUNK_SIZE = 5 * 1024 * 1024;

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
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const updateTaskTimestamp = useTaskStore((state) => state.updateTaskTimestamp)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    setUploadProgress(0)
    
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

      // Verifica o tamanho do arquivo
      const file = selectedFiles[0];
      if (file.size > MAX_FILE_SIZE) {
        setError(`O arquivo é muito grande. O tamanho máximo permitido é ${formatFileSize(MAX_FILE_SIZE)}.`);
        e.target.value = ""; // Limpa a seleção
        return;
      }

      if (onFileSelect) {
        onFileSelect(selectedFiles)
      } else {
        setLocalFiles(selectedFiles)
      }
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const uploadFileInChunks = async (file: File, taskId: number) => {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    let uploadedChunks = 0;
    let fileId: string | null = null;
    
    for (let start = 0; start < file.size; start += CHUNK_SIZE) {
      const chunk = file.slice(start, start + CHUNK_SIZE);
      const formData = new FormData();
      
      formData.append("taskId", taskId.toString());
      formData.append("fileName", file.name);
      formData.append("fileType", file.type);
      formData.append("fileSize", file.size.toString());
      formData.append("chunkIndex", uploadedChunks.toString());
      formData.append("totalChunks", totalChunks.toString());
      
      if (fileId) {
        formData.append("fileId", fileId);
      }
      
      formData.append("chunk", chunk);
      
      try {
        const response = await fetch("/api/anexos/upload", {
          method: "POST",
          body: formData
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Erro ao fazer upload do arquivo");
        }
        
        const data = await response.json();
        
        // Armazena o ID do arquivo retornado pelo servidor para os próximos chunks
        if (!fileId && data.fileId) {
          fileId = data.fileId;
        }
        
        uploadedChunks++;
        const progress = Math.round((uploadedChunks / totalChunks) * 100);
        setUploadProgress(progress);
        
      } catch (error) {
        console.error("Erro ao enviar chunk:", error);
        throw error;
      }
    }
    
    return fileId;
  };

  const handleUpload = async () => {
    if (localFiles.length === 0 || !taskId) return

    setUploading(true)
    setUploadProgress(0)
    
    console.log("[FileUpload] Iniciando upload de arquivos", {
      numberOfFiles: localFiles.length,
      taskId
    })

    try {
      const file = localFiles[0];
      
      // Para arquivos pequenos, usamos o método tradicional
      if (file.size <= CHUNK_SIZE) {
        const formData = new FormData()
        formData.append("taskId", taskId.toString())
        formData.append("files", file)
        
        console.log("[FileUpload] Enviando arquivo pequeno diretamente")
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
        
        setUploadProgress(100);
      } 
      // Para arquivos grandes, usamos o upload em partes
      else {
        console.log("[FileUpload] Iniciando upload em partes para arquivo grande:", file.name);
        await uploadFileInChunks(file, taskId);
      }

      console.log("[FileUpload] Upload concluído com sucesso");

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
    setUploadProgress(0)
    
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
            <div className="flex items-center gap-2 text-sm text-red-500 mt-2">
              <AlertTriangle className="h-4 w-4" />
              <p>{error}</p>
            </div>
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

      {uploading && uploadProgress > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Progresso do upload</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

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
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm truncate">{file.name}</span>
                <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveFile ? onRemoveFile(id) : handleRemoveFile(0)}
                className="h-8 w-8 hover:text-red-500"
                disabled={uploading}
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