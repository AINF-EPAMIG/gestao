"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { needsProcessing, processLargeFile, MAX_UPLOAD_SIZE, MAX_CHUNK_SIZE } from "@/lib/file-utils"
import { AlertTriangle } from "lucide-react"

// Definindo uma interface para o resultado
interface ProcessingResult {
  originalFile?: {
    name: string;
    size: number;
    type: string;
    sizeFormatted: string;
  };
  processedFiles?: Array<{
    name: string;
    size: number;
    type: string;
    sizeFormatted: string;
  }>;
  isCompressed?: boolean;
  isSplit?: boolean;
  compressionRatio?: string;
  message?: string;
  fileInfo?: {
    name: string;
    size: number;
    type: string;
    sizeFormatted: string;
  };
  error?: string;
  details?: string;
  success?: boolean;
}

export default function TestFileProcessingPage() {
  const [result, setResult] = useState<ProcessingResult | null>(null)
  const [processing, setProcessing] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [processedFiles, setProcessedFiles] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = (files: File[]) => {
    setError(null)
    
    if (files.length === 0) return
    
    // Verifica se o arquivo é um arquivo compactado
    const file = files[0]
    const compressedFormats = [
      'application/zip', 
      'application/x-zip-compressed',
      'application/x-rar-compressed',
      'application/vnd.rar',
      'application/x-7z-compressed',
      'application/gzip',
      'application/x-tar'
    ]
    
    // Verifica pelo tipo MIME ou pela extensão do arquivo
    const isCompressedFile = 
      compressedFormats.includes(file.type) || 
      /\.(zip|rar|7z|tar|gz|tgz)$/i.test(file.name)
    
    if (isCompressedFile) {
      setError("Não é permitido enviar arquivos compactados (ZIP, RAR, etc.) que podem conter múltiplos arquivos. Por favor, envie os arquivos individualmente.")
      return
    }
    
    setSelectedFiles(files)
    setProcessedFiles([])
    setResult(null)
  }

  const handleProcessFile = async () => {
    if (selectedFiles.length === 0) return

    setProcessing(true)
    try {
      const file = selectedFiles[0]
      
      // Verifica se o arquivo precisa ser processado
      if (needsProcessing(file)) {
        const result = await processLargeFile(file)
        setProcessedFiles(result.files)
        setResult({
          originalFile: {
            name: file.name,
            size: file.size,
            type: file.type,
            sizeFormatted: formatFileSize(file.size)
          },
          processedFiles: result.files.map(f => ({
            name: f.name,
            size: f.size,
            type: f.type,
            sizeFormatted: formatFileSize(f.size)
          })),
          isCompressed: result.isCompressed,
          isSplit: result.isSplit,
          compressionRatio: result.isCompressed ? 
            (file.size / (result.isSplit ? 
              result.files.reduce((acc, f) => acc + f.size, 0) : 
              result.files[0].size)).toFixed(2) : 
            "N/A"
        })
      } else {
        setResult({
          message: "O arquivo não precisa ser processado (tamanho menor que o limite)",
          fileInfo: {
            name: file.name,
            size: file.size,
            type: file.type,
            sizeFormatted: formatFileSize(file.size)
          }
        })
      }
    } catch (error) {
      console.error("Erro ao processar arquivo:", error)
      setResult({
        error: "Erro ao processar arquivo",
        details: error instanceof Error ? error.message : String(error)
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleTestUpload = async () => {
    if (selectedFiles.length === 0) return

    setProcessing(true)
    try {
      const formData = new FormData()
      formData.append("file", selectedFiles[0])

      const response = await fetch("/api/test-file-processing", {
        method: "POST",
        body: formData
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error("Erro ao testar upload:", error)
      setResult({
        error: "Erro ao testar upload",
        details: error instanceof Error ? error.message : String(error)
      })
    } finally {
      setProcessing(false)
    }
  }

  // Função para formatar o tamanho do arquivo
  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    else return (bytes / 1073741824).toFixed(1) + ' GB';
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Teste de Processamento de Arquivos</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Configurações</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-md">
            <p className="font-medium">Tamanho máximo para upload direto:</p>
            <p className="text-lg">{formatFileSize(MAX_UPLOAD_SIZE)}</p>
          </div>
          <div className="p-4 border rounded-md">
            <p className="font-medium">Tamanho máximo de cada parte:</p>
            <p className="text-lg">{formatFileSize(MAX_CHUNK_SIZE)}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Selecionar Arquivo</h2>
        <div className="mb-4">
          <input 
            type="file" 
            onChange={(e) => e.target.files && handleFileSelect(Array.from(e.target.files))}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 rounded-md border border-red-200">
            <p className="text-sm text-red-600 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </p>
          </div>
        )}
        
        {selectedFiles.length > 0 && (
          <div className="mb-4 p-4 bg-gray-50 rounded-md">
            <p className="font-medium">Arquivo selecionado:</p>
            <p>{selectedFiles[0].name} ({formatFileSize(selectedFiles[0].size)})</p>
            <p className="text-sm text-gray-500">Tipo: {selectedFiles[0].type || "Desconhecido"}</p>
            <p className="text-sm text-gray-500">
              Status: {selectedFiles[0].size > MAX_UPLOAD_SIZE ? 
                "Precisa ser processado (compactado/dividido)" : 
                "Não precisa ser processado"}
            </p>
          </div>
        )}
        
        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={handleProcessFile} 
            disabled={selectedFiles.length === 0 || processing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {processing ? "Processando..." : "Processar Arquivo"}
          </Button>
          
          <Button 
            onClick={handleTestUpload} 
            disabled={selectedFiles.length === 0 || processing}
            variant="outline"
          >
            Testar Upload
          </Button>
        </div>
      </div>
      
      {processedFiles.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Arquivos Processados</h2>
          <div className="space-y-2">
            {processedFiles.map((file, index) => (
              <div key={index} className="p-3 border rounded-md">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-gray-500">Tamanho: {formatFileSize(file.size)}</p>
                <p className="text-sm text-gray-500">Tipo: {file.type || "Desconhecido"}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {result && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Resultado</h2>
          <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
} 