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

// Tamanho máximo do arquivo em bytes (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024;
// Tamanho do chunk em bytes (5MB)
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
      const file = selectedFiles[0]
      if (file.size > MAX_FILE_SIZE) {
        setError(`O arquivo é muito grande. O tamanho máximo permitido é ${formatFileSize(MAX_FILE_SIZE)}.`)
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  // Função para fazer upload em chunks
  const uploadFileInChunks = async (file: File, taskId: string) => {
    const fileSize = file.size;
    const fileName = file.name;
    const fileType = file.type;
    const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);
    
    console.log(`[ChunkUpload] Iniciando upload em chunks para ${fileName}`, {
      fileSize,
      totalChunks,
      chunkSize: CHUNK_SIZE,
      taskId
    });
    
    // Criar um ID de sessão único para este upload
    const sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    try {
      // Preparar os dados para iniciar a sessão
      const initData = {
        fileName,
        fileType,
        fileSize,
        totalChunks,
        taskId,
        sessionId
      };
      
      console.log("[ChunkUpload] Enviando dados para iniciar sessão:", initData);
      
      // Iniciar a sessão de upload
      const initResponse = await fetch("/api/anexos/upload-init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(initData),
      });
      
      console.log("[ChunkUpload] Resposta da inicialização:", {
        status: initResponse.status,
        statusText: initResponse.statusText
      });
      
      if (!initResponse.ok) {
        const errorData = await initResponse.json();
        console.error("[ChunkUpload] Erro ao iniciar upload:", errorData);
        throw new Error(errorData.error || errorData.details || "Erro ao iniciar upload em chunks");
      }
      
      const initResult = await initResponse.json();
      console.log("[ChunkUpload] Sessão iniciada com sucesso:", initResult);
      
      // Enviar cada chunk
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, fileSize);
        const chunk = file.slice(start, end);
        
        const formData = new FormData();
        formData.append("chunk", chunk);
        formData.append("sessionId", sessionId);
        formData.append("chunkIndex", chunkIndex.toString());
        formData.append("totalChunks", totalChunks.toString());
        
        console.log(`[ChunkUpload] Enviando chunk ${chunkIndex + 1}/${totalChunks}`);
        
        const chunkResponse = await fetch("/api/anexos/upload-chunk", {
          method: "POST",
          body: formData,
        });
        
        console.log(`[ChunkUpload] Resposta do envio do chunk ${chunkIndex + 1}:`, {
          status: chunkResponse.status,
          statusText: chunkResponse.statusText
        });
        
        if (!chunkResponse.ok) {
          const errorData = await chunkResponse.json();
          console.error(`[ChunkUpload] Erro ao enviar chunk ${chunkIndex + 1}:`, errorData);
          throw new Error(errorData.error || errorData.details || `Erro ao enviar chunk ${chunkIndex + 1}/${totalChunks}`);
        }
        
        // Atualizar o progresso
        const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100);
        setUploadProgress(progress);
        
        console.log(`[ChunkUpload] Chunk ${chunkIndex + 1}/${totalChunks} enviado com sucesso (${progress}%)`);
      }
      
      // Preparar dados para finalizar o upload
      const completeData = {
        sessionId,
        fileName,
        fileType,
        fileSize,
        taskId
      };
      
      console.log("[ChunkUpload] Enviando solicitação para finalizar upload:", completeData);
      
      // Finalizar o upload
      const completeResponse = await fetch("/api/anexos/upload-complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(completeData),
      });
      
      console.log("[ChunkUpload] Resposta da finalização:", {
        status: completeResponse.status,
        statusText: completeResponse.statusText
      });
      
      if (!completeResponse.ok) {
        const errorData = await completeResponse.json();
        console.error("[ChunkUpload] Erro ao finalizar upload:", errorData);
        throw new Error(errorData.error || errorData.details || "Erro ao finalizar upload em chunks");
      }
      
      const result = await completeResponse.json();
      console.log(`[ChunkUpload] Upload em chunks concluído com sucesso:`, result);
      
      return result;
    } catch (error) {
      console.error("[ChunkUpload] Erro durante upload em chunks:", error);
      throw error;
    }
  };

  const handleUpload = async () => {
    if (localFiles.length === 0 || !taskId) return

    setUploading(true)
    setUploadProgress(0)
    
    const file = localFiles[0];
    console.log("[FileUpload] Iniciando upload de arquivo", {
      fileName: file.name,
      fileSize: file.size,
      taskId
    })

    try {
      let result;
      
      // Verificar se o arquivo é grande o suficiente para usar upload em chunks
      if (file.size > CHUNK_SIZE) {
        console.log(`[FileUpload] Arquivo grande (${formatFileSize(file.size)}), usando upload em chunks`);
        result = await uploadFileInChunks(file, taskId.toString());
      } else {
        // Para arquivos pequenos, usar o método tradicional
        console.log(`[FileUpload] Arquivo pequeno (${formatFileSize(file.size)}), usando upload normal`);
        setUploadProgress(10);
        
        const formData = new FormData();
        formData.append("taskId", taskId.toString());
        formData.append("files", file);
        
        // Simula progresso durante o upload
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            const newProgress = prev + 5;
            return newProgress < 90 ? newProgress : prev;
          });
        }, 1000);
        
        const response = await fetch("/api/anexos/upload", {
          method: "POST",
          body: formData
        });
        
        clearInterval(progressInterval);
        setUploadProgress(95);
        
        const responseData = await response.json();
        
        if (!response.ok) {
          throw new Error(responseData.error || responseData.details || "Erro ao fazer upload do arquivo");
        }
        
        setUploadProgress(100);
        result = responseData;
      }

      console.log("[FileUpload] Upload concluído com sucesso:", result);
      setLocalFiles([]);
      
      // Limpa o input de arquivo para permitir selecionar o mesmo arquivo novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      // Atualiza o timestamp da tarefa no store
      updateTaskTimestamp(taskId);
      
      if (onUploadComplete) {
        onUploadComplete();
      }
      
      // Reseta o progresso após um tempo
      setTimeout(() => {
        setUploadProgress(0);
      }, 2000);
      
    } catch (error) {
      console.error("[FileUpload] Erro durante o upload:", {
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        } : error
      });
      
      setUploadProgress(0);
      
      // Mensagem de erro mais detalhada
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Erro ao fazer upload do arquivo. Verifique o tamanho do arquivo e tente novamente.";
      
      alert(errorMessage);
    } finally {
      setUploading(false);
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
            Selecionar Arquivo {MAX_FILE_SIZE ? `(máx. ${formatFileSize(MAX_FILE_SIZE)})` : ''}
          </label>
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-500 mt-2">
              <AlertTriangle className="h-4 w-4" />
              <p>{error}</p>
            </div>
          )}
          
          {uploadProgress > 0 && (
            <div className="mt-2 space-y-1">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-gray-500 text-right">{uploadProgress}%</p>
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
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
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