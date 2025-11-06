export type IpStatus = "Disponível" | "Em Uso" | "Reservado" | "Manutenção"

export interface IpRegistro {
	id: number
	endereco_ip: string
	status: IpStatus
	descricao?: string | null
	responsavel?: string | null
	setor?: string | null
	equipamento?: string | null
	data_cadastro: string
}

export interface SetorItem {
	id: number
	nome?: string | null
	sigla?: string | null
}

export interface FaixaItem {
	id: number
	faixa: string
	descricao: string
}

export interface EditFormState {
	status: IpStatus
	descricao: string
	responsavel: string
	setor: string
	equipamento: string
}
