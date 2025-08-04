"use client"

import { useTaskStore } from "@/lib/store"
import { usePermissions } from "@/lib/hooks/use-permissions"
import { Badge } from "@/components/ui/badge"
import { Building2, Globe } from "lucide-react"

export function SetorIndicator() {
  const selectedSetor = useTaskStore((state) => state.selectedSetor)
  const { canViewAllSectors } = usePermissions()

  if (!canViewAllSectors) return null

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border-b border-emerald-200">
      <div className="flex items-center gap-2">
        {selectedSetor ? (
          <>
            <Building2 className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-800">
              Visualizando: 
            </span>
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-300">
              {selectedSetor}
            </Badge>
          </>
        ) : (
          <>
            <Globe className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-800">
              Visualizando: 
            </span>
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-300">
              Todos os Setores
            </Badge>
          </>
        )}
      </div>
    </div>
  )
}