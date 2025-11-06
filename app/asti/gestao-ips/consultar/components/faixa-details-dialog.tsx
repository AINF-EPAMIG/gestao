"use client"

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle
} from "@/components/ui/dialog"

import type { FaixaItem } from "../types"

interface FaixaDetailsDialogProps {
	isOpen: boolean
	onOpenChange: (open: boolean) => void
	selectedFaixa: FaixaItem | null
	formatValue: (value?: string | null) => string
}

export function FaixaDetailsDialog({
	isOpen,
	onOpenChange,
	selectedFaixa,
	formatValue
}: FaixaDetailsDialogProps) {
	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Detalhes da Faixa de IP</DialogTitle>
					<DialogDescription>Informações completas sobre a faixa de endereços IP selecionada.</DialogDescription>
				</DialogHeader>
				{selectedFaixa && (
					<div className="space-y-4 text-sm text-gray-700">
						<div>
							<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Faixa de IP</p>
							<p className="text-base font-semibold text-gray-900">{selectedFaixa.faixa}</p>
						</div>
						<div className="space-y-4">
							<div>
								<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Descrição</p>
								<p className="mt-1 text-sm">{formatValue(selectedFaixa.descricao)}</p>
							</div>
							<div>
								<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">ID interno</p>
								<p className="mt-1 text-sm">#{selectedFaixa.id}</p>
							</div>
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	)
}
