import type { IpStatus } from "./types"

export const STATUS_STYLES: Record<IpStatus, string> = {
	Disponível: "bg-green-100 text-green-800",
	"Em Uso": "bg-blue-100 text-blue-800",
	Reservado: "bg-yellow-100 text-yellow-800",
	Manutenção: "bg-red-100 text-red-800"
}

export const ALL_STATUSES = Object.keys(STATUS_STYLES) as IpStatus[]

export const NO_SETOR_VALUE = "__sem_setor__"
