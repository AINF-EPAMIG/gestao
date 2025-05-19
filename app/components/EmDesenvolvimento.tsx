import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function EmDesenvolvimento() {
  const router = useRouter()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-3xl font-bold text-gray-900">Em Desenvolvimento</h1>
      <p className="text-center text-gray-600 max-w-md">
        Esta página está em desenvolvimento e disponível apenas para usuários autorizados.
      </p>
      <Button
        onClick={() => router.push("/")}
        variant="outline"
        className="mt-4"
      >
        Voltar para a página inicial
      </Button>
    </div>
  )
} 