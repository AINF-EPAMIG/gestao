"use client"

import { Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface FilterPanelProps {
  searchQuery: string
  setSearchQuery: (value: string) => void
  tipoFilter: string
  setTipoFilter: (value: string) => void
  statusFilter: string
  setStatusFilter: (value: string) => void
}

export function FilterPanel({
  searchQuery,
  setSearchQuery,
  tipoFilter,
  setTipoFilter,
  statusFilter,
  setStatusFilter,
}: FilterPanelProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center gap-2 mb-6">
        <Filter className="h-5 w-5 text-emerald-600" />
        <h2 className="text-lg font-semibold text-gray-900">Filtros de Pesquisa</h2>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Busca */}
        <div className="space-y-2">
          <Label htmlFor="search" className="text-sm font-medium text-gray-700 flex items-center gap-1">
            <Search className="h-3.5 w-3.5 text-gray-400" />
            Buscar
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              type="text"
              placeholder="Nome, sigla ou objetivo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Tipo */}
        <div className="space-y-2">
          <Label htmlFor="tipo" className="text-sm font-medium text-gray-700">
            Tipo de Projeto
          </Label>
          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger id="tipo" className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 transition-all">
              <SelectValue placeholder="Todos os tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              <SelectItem value="1">Sistema</SelectItem>
              <SelectItem value="2">Site</SelectItem>
              <SelectItem value="3">API</SelectItem>
              <SelectItem value="4">Mobile</SelectItem>
              <SelectItem value="5">Rotina</SelectItem>
              <SelectItem value="6">Infraestrutura</SelectItem>
              <SelectItem value="7">Outros</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label htmlFor="status" className="text-sm font-medium text-gray-700">
            Status do Projeto
          </Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger id="status" className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 transition-all">
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="1">Produção</SelectItem>
              <SelectItem value="2">Em Desenvolvimento</SelectItem>
              <SelectItem value="3">Manutenção</SelectItem>
              <SelectItem value="4">Descontinuado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
