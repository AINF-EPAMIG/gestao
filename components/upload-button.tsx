import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRef, useState } from "react"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { Loader2, Upload } from "lucide-react"

interface UploadButtonProps {
  taskId: string
  onUploadComplete: (files: any[]) => void
}

export function UploadButton({ taskId, onUploadComplete }: UploadButtonProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentFile, setCurrentFile] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Tamanho máximo de cada chunk (5MB)
  const CHUNK_SIZE = 5 * 1024 * 1024;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    setUploading(true)
    setProgress(0)

    const files = Array.from(e.target.files)
    const uploadedFiles = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setCurrentFile(file.name)
        
        // Verifica se o arquivo é grande (maior que 5MB)
        if (file.size > CHUNK_SIZE) {
          // Upload em chunks para arquivos grandes
          const uploadedFile = await uploadLargeFile(file, taskId)
          if (uploadedFile) {
            uploadedFiles.push(uploadedFile)
          }
        } else {
          // Upload normal para arquivos pequenos
          const uploadedFile = await uploadSingleFile(file, taskId)
          if (uploadedFile) {
            uploadedFiles.push(uploadedFile)
          }
        }
        
        // Atualiza o progresso geral
        setProgress(((i + 1) / files.length) * 100)
      }

      if (uploadedFiles.length > 0) {
        onUploadComplete(uploadedFiles)
        toast.success(`${uploadedFiles.length} arquivo(s) enviado(s) com sucesso!`)
      }
    } catch (error) {
      console.error("Erro ao fazer upload:", error)
      toast.error("Erro ao fazer upload. Tente novamente.")
    } finally {
      setUploading(false)
      setCurrentFile(null)
      setProgress(0)
      // Limpa o input para permitir o upload do mesmo arquivo novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  // Função para fazer upload de arquivos pequenos
  const uploadSingleFile = async (file: File, taskId: string) => {
    const formData = new FormData()
    formData.append("taskId", taskId)
    formData.append("files", file)

    try {
      const response = await fetch("/api/anexos/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao fazer upload")
      }

      const data = await response.json()
      return data[0]
    } catch (error) {
      console.error(`Erro ao fazer upload de ${file.name}:`, error)
      toast.error(`Erro ao enviar ${file.name}. Tente novamente.`)
      return null
    }
  }

  // Função para fazer upload de arquivos grandes em chunks
  const uploadLargeFile = async (file: File, taskId: string) => {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
    let fileId: string | null = null
    
    try {
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        // Calcula o início e fim do chunk atual
        const start = chunkIndex * CHUNK_SIZE
        const end = Math.min(file.size, start + CHUNK_SIZE)
        const chunk = file.slice(start, end)
        
        // Cria o FormData para este chunk
        const formData = new FormData()
        formData.append("taskId", taskId)
        formData.append("fileName", file.name)
        formData.append("fileType", file.type)
        formData.append("fileSize", file.size.toString())
        formData.append("chunkIndex", chunkIndex.toString())
        formData.append("totalChunks", totalChunks.toString())
        formData.append("chunk", chunk)
        
        // Adiciona o fileId se não for o primeiro chunk
        if (fileId) {
          formData.append("fileId", fileId)
        }
        
        // Atualiza o progresso do arquivo atual
        const chunkProgress = ((chunkIndex + 1) / totalChunks) * 100
        setProgress(chunkProgress)
        
        // Envia o chunk
        const response = await fetch("/api/anexos/upload", {
          method: "POST",
          body: formData,
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `Erro ao enviar parte ${chunkIndex + 1}/${totalChunks}`)
        }
        
        const data = await response.json()
        
        // Armazena o fileId para os próximos chunks
        fileId = data.fileId
        
        // Se o upload estiver completo, retorna as informações do arquivo
        if (data.complete) {
          return data.fileInfo
        }
      }
    } catch (error) {
      console.error(`Erro ao fazer upload em chunks de ${file.name}:`, error)
      toast.error(`Erro ao enviar ${file.name}. Tente novamente.`)
      return null
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        disabled={uploading}
        className="hidden"
        id="file-upload"
      />
      <label htmlFor="file-upload">
        <Button
          type="button"
          variant="outline"
          className="w-full cursor-pointer"
          disabled={uploading}
          asChild
        >
          <div>
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {uploading ? "Enviando..." : "Anexar arquivos"}
          </div>
        </Button>
      </label>
      
      {uploading && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {currentFile && `Enviando ${currentFile} - ${Math.round(progress)}%`}
          </p>
        </div>
      )}
    </div>
  )
} 