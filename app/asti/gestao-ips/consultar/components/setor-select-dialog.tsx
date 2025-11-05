"use client"

import type { ChangeEvent } from "react"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

import type { SetorItem } from "../types"

interface SetorSelectDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	setorBusca: string
	onSetorBuscaChange: (value: string) => void
	isLoadingSetores: boolean
	erroSetores: string | null
	setores: SetorItem[]
	setoresFiltrados: SetorItem[]
	selectedSetor: string
	onSelectTodos: () => void
	onSelectSetor: (value: string) => void
}

export function SetorSelectDialog({
	open,
	onOpenChange,
	setorBusca,
	onSetorBuscaChange,
	isLoadingSetores,
	erroSetores,
	setores,
	setoresFiltrados,
	selectedSetor,
	onSelectTodos,
	onSelectSetor
}: SetorSelectDialogProps) {
	const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
		onSetorBuscaChange(event.target.value)
	}

	const getLabel = (setor: SetorItem) => setor.sigla || setor.nome || `Setor ${setor.id}`

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Selecionar setor</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					<Input
						placeholder="Pesquisar setor..."
						value={setorBusca}
						onChange={handleSearchChange}
						disabled={isLoadingSetores}
					/>
					{isLoadingSetores ? (
						<p className="text-sm text-muted-foreground">Carregando setores...</p>
					) : erroSetores ? (
						<p className="text-sm text-red-600">{erroSetores}</p>
					) : setores.length === 0 ? (
						<p className="text-sm text-muted-foreground">Nenhum setor disponível.</p>
					) : (
						<div className="space-y-2">
							<Button
								type="button"
								variant={selectedSetor === "todos" ? "default" : "outline"}
								onClick={onSelectTodos}
								className="w-full justify-start"
							>
								Todos os setores
							</Button>
							<div className="max-h-64 space-y-2 overflow-y-auto">
								{setoresFiltrados.length === 0 ? (
									<p className="px-2 text-sm text-muted-foreground">Nenhum setor corresponde à busca.</p>
								) : (
									setoresFiltrados.map((setor) => {
										const valor = String(setor.id)

										return (
											<Button
												key={valor}
												type="button"
												variant={selectedSetor === valor ? "default" : "outline"}
												onClick={() => onSelectSetor(valor)}
												className="w-full justify-start"
											>
												{getLabel(setor)}
											</Button>
										)
									})
								)}
							</div>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	)
}
