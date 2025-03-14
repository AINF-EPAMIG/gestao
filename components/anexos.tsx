import { useState, useEffect } from "react"
import { UploadButton } from "./upload-button"
import { Button } from "./ui/button"
import { Trash2, FileIcon, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Anexo {
  id: number
  nome_arquivo: string
  tipo_arquivo: string
  tamanho_bytes: number
  google_drive_link: string
  data_upload: string
}

interface AnexosProps {
  taskId: string
}

export function Anexos({ taskId }: AnexosProps) {
  const [anexos, setAnexos] = useState<Anexo[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [anexoToDelete, setAnexoToDelete] = useState<Anexo | null>(null)

  // Carregar anexos ao montar o componente
  useEffect(() => {
    fetchAnexos()
  }, [taskId])

  // Buscar anexos da tarefa
  const fetchAnexos = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/anexos?taskId=${taskId}`)
      
      if (!response.ok) {
        throw new Error("Erro ao buscar anexos")
      }
      
      const data = await response.json()
      setAnexos(data)
    } catch (error) {
      console.error("Erro ao buscar anexos:", error)
      toast.error("Não foi possível carregar os anexos")
    } finally {
      setLoading(false)
    }
  }

  // Função para formatar o tamanho do arquivo
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB"
    else return (bytes / 1073741824).toFixed(1) + " GB"
  }

  // Função para confirmar exclusão
  const confirmDelete = (anexo: Anexo) => {
    setAnexoToDelete(anexo)
    setDeleteDialogOpen(true)
  }

  // Função para excluir anexo
  const deleteAnexo = async () => {
    if (!anexoToDelete) return
    
    try {
      const response = await fetch(`/api/anexos/${anexoToDelete.id}`, {
        method: "DELETE",
      })
      
      if (!response.ok) {
        throw new Error("Erro ao excluir anexo")
      }
      
      // Atualiza a lista de anexos
      setAnexos(anexos.filter(a => a.id !== anexoToDelete.id))
      toast.success("Anexo excluído com sucesso")
    } catch (error) {
      console.error("Erro ao excluir anexo:", error)
      toast.error("Não foi possível excluir o anexo")
    } finally {
      setAnexoToDelete(null)
      setDeleteDialogOpen(false)
    }
  }

  // Função para lidar com o upload completo
  const handleUploadComplete = (files: Anexo[]) => {
    setAnexos([...anexos, ...files])
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Anexos</h3>
        <UploadButton taskId={taskId} onUploadComplete={handleUploadComplete} />
      </div>
      
      {loading ? (
        <div className="flex justify-center py-4">
          <p className="text-sm text-muted-foreground">Carregando anexos...</p>
        </div>
      ) : anexos.length === 0 ? (
        <div className="rounded-md border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum anexo encontrado. Clique em "Anexar arquivos" para adicionar.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {anexos.map((anexo) => (
            <div
              key={anexo.id}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div className="flex items-center gap-3">
                <FileIcon className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">{anexo.nome_arquivo}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(anexo.tamanho_bytes)} • {new Date(anexo.data_upload).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                >
                  <a href={anexo.google_drive_link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    <span className="sr-only">Abrir</span>
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => confirmDelete(anexo)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                  <span className="sr-only">Excluir</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir anexo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o anexo "{anexoToDelete?.nome_arquivo}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteAnexo} className="bg-red-500 hover:bg-red-600">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 