"use client"

import type { ChangeEvent } from "react"

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

import { ALL_STATUSES, NO_SETOR_VALUE, STATUS_STYLES } from "../constants"
import type { EditFormState, IpRegistro } from "../types"

interface AdvancedViewDialogProps {
	isOpen: boolean
	onOpenChange: (open: boolean) => void
	selectedIp: IpRegistro | null
	actionError: string | null
	isEditing: boolean
	onStartEditing: () => void
	onCancelEditing: () => void
	onSaveChanges: () => void
	isSavingEdit: boolean
	editForm: EditFormState
	onEditFormChange: (field: keyof EditFormState, value: string) => void
	setorOptions: Array<{ value: string; label: string }>
	isConfirmingDelete: boolean
	onStartDelete: () => void
	onCancelDelete: () => void
	onConfirmDelete: () => void
	isDeletingIp: boolean
	formatDate: (value: string) => string
	formatValue: (value?: string | null) => string
	obterSetorLabel: (value?: string | null) => string | undefined
	obterFaixaLabel: (ip?: IpRegistro | null) => string | undefined
}

export function AdvancedViewDialog({
	isOpen,
	onOpenChange,
	selectedIp,
	actionError,
	isEditing,
	onStartEditing,
	onCancelEditing,
	onSaveChanges,
	isSavingEdit,
	editForm,
	onEditFormChange,
	setorOptions,
	isConfirmingDelete,
	onStartDelete,
	onCancelDelete,
	onConfirmDelete,
	isDeletingIp,
	formatDate,
	formatValue,
	obterSetorLabel,
	obterFaixaLabel
}: AdvancedViewDialogProps) {
	const handleInputChange = (field: keyof EditFormState) => (event: ChangeEvent<HTMLInputElement>) => {
		onEditFormChange(field, event.target.value)
	}

	const handleTextareaChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
		onEditFormChange("descricao", event.target.value)
	}

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Visualização avançada</DialogTitle>
					<DialogDescription>Detalhes completos do endereço IP selecionado.</DialogDescription>
				</DialogHeader>
				{selectedIp && (
					<div className="space-y-4 text-sm text-gray-700">
						<div>
							<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Endereço IP</p>
							<p className="text-base font-semibold text-gray-900">{selectedIp.endereco_ip}</p>
						</div>
						{actionError && (
							<div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{actionError}</div>
						)}
						{isEditing ? (
							<div className="space-y-4">
								<div className="grid gap-4 sm:grid-cols-2">
									<div className="space-y-2">
										<Label htmlFor="edit-status">Status</Label>
										<Select value={editForm.status} onValueChange={(value) => onEditFormChange("status", value)}>
											<SelectTrigger id="edit-status">
												<SelectValue placeholder="Selecione o status" />
											</SelectTrigger>
											<SelectContent>
												{ALL_STATUSES.map((statusOption) => (
													<SelectItem key={statusOption} value={statusOption}>
														{statusOption}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-2">
										<Label htmlFor="edit-setor">Setor</Label>
										<Select
											value={editForm.setor ? editForm.setor : NO_SETOR_VALUE}
											onValueChange={(value) => onEditFormChange("setor", value === NO_SETOR_VALUE ? "" : value)}
										>
											<SelectTrigger id="edit-setor">
												<SelectValue placeholder="Selecione o setor" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value={NO_SETOR_VALUE}>Não informar</SelectItem>
												{setorOptions.map((option) => (
													<SelectItem key={option.value} value={option.value}>
														{option.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-2">
										<Label htmlFor="edit-responsavel">Responsável</Label>
										<Input
											id="edit-responsavel"
											placeholder="Nome do responsável"
											value={editForm.responsavel}
											onChange={handleInputChange("responsavel")}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="edit-equipamento">Equipamento</Label>
										<Input
											id="edit-equipamento"
											placeholder="Informe o equipamento"
											value={editForm.equipamento}
											onChange={handleInputChange("equipamento")}
										/>
									</div>
								</div>
								<div className="space-y-2">
									<Label htmlFor="edit-descricao">Descrição</Label>
									<Textarea
										id="edit-descricao"
										rows={4}
										placeholder="Detalhes adicionais sobre o uso do IP"
										value={editForm.descricao}
										onChange={handleTextareaChange}
									/>
								</div>
							</div>
						) : (
							<div className="space-y-4">
								<div className="grid gap-3 sm:grid-cols-2">
									<div>
										<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</p>
										<span className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[selectedIp.status]}`}>
											{selectedIp.status}
										</span>
									</div>
									<div>
										<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Responsável</p>
										<p className="mt-1 text-sm">{formatValue(selectedIp.responsavel)}</p>
									</div>
									<div>
										<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Setor</p>
										<p className="mt-1 text-sm">{formatValue(obterSetorLabel(selectedIp.setor))}</p>
									</div>
									<div>
										<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Equipamento</p>
										<p className="mt-1 text-sm">{formatValue(selectedIp.equipamento)}</p>
									</div>
									<div>
										<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Faixa</p>
										<p className="mt-1 text-sm">{formatValue(obterFaixaLabel(selectedIp))}</p>
									</div>
									<div>
										<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cadastrado em</p>
										<p className="mt-1 text-sm">{formatDate(selectedIp.data_cadastro)}</p>
									</div>
								</div>
								<div>
									<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Descrição</p>
									<p className="mt-1 text-sm">{formatValue(selectedIp.descricao)}</p>
								</div>
							</div>
						)}
						{isConfirmingDelete ? (
							<div className="rounded-md border border-red-200 bg-red-50 p-4">
								<p className="text-sm text-red-700">Tem certeza que deseja excluir este IP? Esta ação não pode ser desfeita.</p>
								<div className="mt-4 flex flex-wrap items-center gap-2">
									<Button type="button" variant="destructive" onClick={onCancelDelete} disabled={isDeletingIp} className="bg-red-600 hover:bg-red-700 text-white">
										Cancelar
									</Button>
									<Button
										type="button"
										variant="destructive"
										onClick={onConfirmDelete}
										disabled={isDeletingIp}
										className="bg-red-600 hover:bg-red-700"
									>
										{isDeletingIp ? "Excluindo..." : "Confirmar exclusão"}
									</Button>
								</div>
							</div>
						) : (
							<div className="flex flex-wrap items-center justify-between gap-3 pt-2">
								<span className="text-xs text-muted-foreground">ID interno: #{selectedIp.id}</span>
								{isEditing ? (
									<div className="flex flex-wrap items-center gap-2">
										<Button type="button" variant="destructive" onClick={onCancelEditing} disabled={isSavingEdit} className="bg-red-600 hover:bg-red-700 text-white">
											Cancelar
										</Button>
										<Button type="button" onClick={onSaveChanges} disabled={isSavingEdit}>
											{isSavingEdit ? "Salvando..." : "Salvar alterações"}
										</Button>
									</div>
								) : (
									<div className="flex flex-wrap items-center gap-2">
										<Button
											type="button"
											variant="outline"
											onClick={onStartEditing}
											className="border-transparent bg-yellow-500 text-white hover:bg-yellow-600"
										>
											Editar
										</Button>
										<Button
											type="button"
											variant="destructive"
											onClick={onStartDelete}
											className="bg-red-600 hover:bg-red-700"
										>
											Excluir
										</Button>
									</div>
								)}
							</div>
						)}
					</div>
				)}
			</DialogContent>
		</Dialog>
	)
}
