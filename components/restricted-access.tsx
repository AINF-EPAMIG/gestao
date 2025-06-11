import { AlertCircle } from "lucide-react"

export default function RestrictedAccess() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <AlertCircle className="h-16 w-16 text-yellow-500" />
      <h1 className="text-2xl font-bold text-center">Sistema em Desenvolvimento</h1>
      <p className="text-gray-600 text-center max-w-md">
        Gentileza Contatar Setor Responsável
      </p>
    </div>
  )
} 