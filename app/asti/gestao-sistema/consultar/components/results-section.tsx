"use client"

import { useMemo, useState } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import { Edit, Trash2, Eye, ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Sistema } from "@/types/sistema"
import { getTipoLabel, getStatusLabel } from "@/lib/sistema-utils"

interface ResultsSectionProps {
  sistemas: Sistema[]
  loading: boolean
  onEdit: (sistema: Sistema) => void
  onDelete: (id: number) => void
  onView: (sistema: Sistema) => void
}

const getTipoBadgeColor = (tipo?: number) => {
  switch (tipo) {
    case 1: return "bg-blue-600 text-white hover:bg-blue-700"           // Sistema - Azul (institucional)
    case 2: return "bg-green-600 text-white hover:bg-green-700"         // Site - Verde (institucional)
    case 3: return "bg-yellow-600 text-white hover:bg-yellow-700"       // API - Amarelo (institucional)
    case 4: return "bg-teal-600 text-white hover:bg-teal-700"           // Mobile - Teal (institucional)
    case 5: return "bg-gray-600 text-white hover:bg-gray-700"           // Rotina - Cinza (institucional)
    case 6: return "bg-stone-600 text-white hover:bg-stone-700"         // Infraestrutura - Stone (institucional)
    case 7: return "bg-slate-600 text-white hover:bg-slate-700"         // Outros - Slate (institucional)
    default: return "bg-gray-600 text-white hover:bg-gray-700"
  }
}

const getStatusBadgeColor = (status?: number) => {
  switch (status) {
    case 1: return "bg-green-500 text-white hover:bg-green-600" // Produção
    case 2: return "bg-blue-500 text-white hover:bg-blue-600" // Em Desenvolvimento
    case 3: return "bg-yellow-500 text-white hover:bg-yellow-600" // Manutenção
    case 4: return "bg-red-500 text-white hover:bg-red-600" // Descontinuado
    default: return "bg-gray-500 text-white hover:bg-gray-600"
  }
}

// Atualizar cores das abas
const tabColors = {
  sistema: "border-blue-600",
  site: "border-green-600",
  api: "border-yellow-600",
  mobile: "border-teal-600",
  rotina: "border-gray-600",
  infraestrutura: "border-stone-600",
  outros: "border-slate-600",
}

export function ResultsSection({
  sistemas,
  loading,
  onEdit,
  onDelete,
  onView,
}: ResultsSectionProps) {
  const [activeTab, setActiveTab] = useState("all")
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })

  // Filtrar sistemas por tipo baseado na aba ativa
  const filteredSistemas = useMemo(() => {
    if (activeTab === "all") return sistemas
    const tipoMap: Record<string, number> = {
      sistema: 1,
      site: 2,
      api: 3,
      mobile: 4,
      rotina: 5,
      infraestrutura: 6,
      outros: 7,
    }
    return sistemas.filter((s) => s.tipo === tipoMap[activeTab])
  }, [sistemas, activeTab])

  const columns = useMemo<ColumnDef<Sistema, unknown>[]>(
    () => [
      {
        accessorKey: "nome",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-10 px-2 hover:bg-gray-200 font-semibold"
          >
            Nome
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="min-w-[200px]">
            <div className="font-medium text-gray-900">{row.original.nome}</div>
            {row.original.objetivo && (
              <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                {row.original.objetivo}
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: "tipo",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-10 px-2 hover:bg-gray-200 font-semibold"
          >
            Tipo
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <Badge className={getTipoBadgeColor(row.original.tipo)} variant="default">
            {getTipoLabel(row.original.tipo)}
          </Badge>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-10 px-2 hover:bg-gray-200 font-semibold"
          >
            Status
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <Badge className={getStatusBadgeColor(row.original.status)} variant="default">
            {getStatusLabel(row.original.status)}
          </Badge>
        ),
      },
      
      {
        id: "actions",
        header: () => <div className="text-right px-2 font-semibold">Ações</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => onView(row.original)}
              className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white"
              title="Visualizar"
            >
              <Eye className="h-4 w-4 mr-1" />
              Ver
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => onEdit(row.original)}
              className="h-8 px-3 bg-yellow-500 hover:bg-yellow-600 text-white"
              title="Editar"
            >
              <Edit className="h-4 w-4 mr-1" />
              Editar
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => onDelete(row.original.id)}
              className="h-8 px-3 bg-red-600 hover:bg-red-700 text-white"
              title="Excluir"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Excluir
            </Button>
          </div>
        ),
      },
    ],
    [onEdit, onDelete, onView]
  )

  const table = useReactTable({
    data: filteredSistemas,
    columns,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: false,
  })

  // Reset pagination quando mudar de aba
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setPagination({ pageIndex: 0, pageSize: pagination.pageSize })
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center text-gray-500">
          <div className="animate-pulse flex flex-col items-center gap-3">
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
            <div className="h-4 w-48 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  const renderTable = () => (
    <>
      {filteredSistemas.length === 0 ? (
        <div className="p-12 text-center">
          <div className="text-gray-400 text-lg mb-2">Nenhum projeto encontrado</div>
          <p className="text-gray-500 text-sm">
            Tente ajustar os filtros ou adicione um novo projeto
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="text-left text-xs uppercase tracking-wider text-gray-600 py-3 px-4 first:pl-6 last:pr-6"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-200">
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="py-4 px-4 first:pl-6 last:pr-6"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {table.getPageCount() > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Mostrando {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} a{" "}
                  {Math.min(
                    (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                    table.getFilteredRowModel().rows.length
                  )}{" "}
                  de {table.getFilteredRowModel().rows.length} resultados
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                    className="h-9 w-9 p-0"
                    title="Primeira página"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="h-9 px-3"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>

                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-600">
                      Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="h-9 px-3"
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                    className="h-9 w-9 p-0"
                    title="Última página"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  )

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Projetos Encontrados
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {filteredSistemas.length}{" "}
              {filteredSistemas.length === 1 ? "resultado" : "resultados"}
            </p>
          </div>

          {/* Items per page selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 whitespace-nowrap">Itens por página:</span>
            <Select
              value={pagination.pageSize.toString()}
              onValueChange={(value) => {
                table.setPageSize(Number(value))
              }}
            >
              <SelectTrigger className="w-20 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="border-b border-gray-200 bg-gray-50/50">
          <TabsList className="h-auto p-0 bg-transparent w-full justify-start rounded-none border-0">
            <TabsTrigger 
              value="all" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3"
            >
              Todos ({sistemas.length})
            </TabsTrigger>
            <TabsTrigger 
              value="sistema"
              className={`rounded-none border-b-2 border-transparent data-[state=active]:${tabColors.sistema} data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3`}
            >
              Sistemas ({sistemas.filter(s => s.tipo === 1).length})
            </TabsTrigger>
            <TabsTrigger 
              value="site"
              className={`rounded-none border-b-2 border-transparent data-[state=active]:${tabColors.site} data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3`}
            >
              Sites ({sistemas.filter(s => s.tipo === 2).length})
            </TabsTrigger>
            <TabsTrigger 
              value="api"
              className={`rounded-none border-b-2 border-transparent data-[state=active]:${tabColors.api} data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3`}
            >
              APIs ({sistemas.filter(s => s.tipo === 3).length})
            </TabsTrigger>
            <TabsTrigger 
              value="mobile"
              className={`rounded-none border-b-2 border-transparent data-[state=active]:${tabColors.mobile} data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3`}
            >
              Mobile ({sistemas.filter(s => s.tipo === 4).length})
            </TabsTrigger>
            <TabsTrigger 
              value="rotina"
              className={`rounded-none border-b-2 border-transparent data-[state=active]:${tabColors.rotina} data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3`}
            >
              Rotinas ({sistemas.filter(s => s.tipo === 5).length})
            </TabsTrigger>
            <TabsTrigger 
              value="infraestrutura"
              className={`rounded-none border-b-2 border-transparent data-[state=active]:${tabColors.infraestrutura} data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3`}
            >
              Infraestrutura ({sistemas.filter(s => s.tipo === 6).length})
            </TabsTrigger>
            <TabsTrigger 
              value="outros"
              className={`rounded-none border-b-2 border-transparent data-[state=active]:${tabColors.outros} data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3`}
            >
              Outros ({sistemas.filter(s => s.tipo === 7).length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Content - Todos */}
        <TabsContent value="all" className="m-0 mt-0">
          {renderTable()}
        </TabsContent>

        {/* Tab Content - Sistemas */}
        <TabsContent value="sistema" className="m-0 mt-0">
            {renderTable()}
        </TabsContent>

        {/* Tab Content - Sites */}
        <TabsContent value="site" className="m-0 mt-0">
          {renderTable()}
        </TabsContent>

        {/* Tab Content - APIs */}
        <TabsContent value="api" className="m-0 mt-0">
          {renderTable()}
        </TabsContent>

        {/* Tab Content - Mobile */}
        <TabsContent value="mobile" className="m-0 mt-0">
          {renderTable()}
        </TabsContent>

        {/* Tab Content - Rotinas */}
        <TabsContent value="rotina" className="m-0 mt-0">
          {renderTable()}
        </TabsContent>

        {/* Tab Content - Infraestrutura */}
        <TabsContent value="infraestrutura" className="m-0 mt-0">
          {renderTable()}
        </TabsContent>

        {/* Tab Content - Outros */}
        <TabsContent value="outros" className="m-0 mt-0">
          {renderTable()}
        </TabsContent>
      </Tabs>
    </div>
  )
}
