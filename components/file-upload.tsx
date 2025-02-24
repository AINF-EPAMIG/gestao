"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X, FileUp } from "lucide-react"

interface FileUploadProps {
  taskId?: number
  onUploadComplete?: () => void
  onFileSelect?: (files: File[]) => void
  onRemoveFile?: (id: string) => void
  files?: { id: string; file: File }[]
  showUploadButton?: boolean
}

export function FileUpload({ 
  taskId, 
  onUploadComplete,
  onFileSelect,
  onRemoveFile,
  files = [],
  showUploadButton = true
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [localFiles, setLocalFiles] = useState<File[]>([])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
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
    const formData = new FormData()
    formData.append("taskId", taskId.toString())
    
    localFiles.forEach(file => {
      formData.append("files", file)
    })

    try {
      const response = await fetch("/api/anexos/upload", {
        method: "POST",
        body: formData
      })

      if (!response.ok) {
        throw new Error("Erro ao fazer upload dos arquivos")
      }

      setLocalFiles([])
      if (onUploadComplete) {
        onUploadComplete()
      }
    } catch (error) {
      console.error("Erro ao fazer upload:", error)
      alert("Erro ao fazer upload dos arquivos")
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveFile = (index: number) => {
    setLocalFiles(localFiles.filter((_, i) => i !== index))
  }

  const filesToShow = onFileSelect ? files : localFiles.map(file => ({ id: file.name, file }))

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="flex items-center justify-center w-full gap-2 px-4 py-3 text-sm font-medium text-gray-700 bg-white border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <Upload className="h-5 w-5" />
            Selecionar Arquivos
          </label>
        </div>
        {showUploadButton && localFiles.length > 0 && (
          <Button
            onClick={handleUpload}
            disabled={uploading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
          >
            <FileUp className="h-4 w-4" />
            {uploading ? "Enviando..." : `Enviar ${localFiles.length} ${localFiles.length === 1 ? 'arquivo' : 'arquivos'}`}
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