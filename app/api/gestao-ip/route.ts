import { NextResponse } from "next/server"

import { executeQuery } from "@/lib/db"

const TABLE_NAME = "u711845530_asti.ips"

const IP_STATUSES = ["Disponível", "Em Uso", "Reservado", "Manutenção"] as const

type IpStatus = (typeof IP_STATUSES)[number]

interface IpRecord {
	id: number
	endereco_ip: string
	status: IpStatus
	descricao: string | null
	data_cadastro: string
}

interface InsertResult {
	insertId: number
}

const isValidStatus = (status: string | null): status is IpStatus =>
	!!status && (IP_STATUSES as readonly string[]).includes(status)

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const statusParam = searchParams.get("status")
	const searchParam = searchParams.get("search")?.trim()

	const filters: string[] = []
	const values: (string | number)[] = []

	if (statusParam) {
		if (!isValidStatus(statusParam)) {
			return NextResponse.json(
				{ error: "Status inválido. Utilize Disponível, Em Uso, Reservado ou Manutenção." },
				{ status: 400 }
			)
		}
		filters.push("status = ?")
		values.push(statusParam)
	}

	if (searchParam) {
		filters.push("endereco_ip LIKE ?")
		values.push(`%${searchParam}%`)
	}

	let query = `SELECT id, endereco_ip, status, descricao, data_cadastro FROM ${TABLE_NAME}`
	if (filters.length) {
		query += ` WHERE ${filters.join(" AND ")}`
	}
	query += " ORDER BY data_cadastro DESC"

	try {
		const ips = await executeQuery<IpRecord[]>({
			query,
			...(values.length ? { values } : {})
		})
		return NextResponse.json(ips)
	} catch (error) {
		console.error("❌ Erro ao buscar IPs:", error)
		return NextResponse.json({ error: "Erro ao buscar IPs" }, { status: 500 })
	}
}

export async function POST(request: Request) {
	try {
		const body = await request.json()
		const rawEndereco = typeof body?.endereco_ip === "string" ? body.endereco_ip.trim() : ""
		const rawStatus = typeof body?.status === "string" ? body.status.trim() : null
		const descricao = typeof body?.descricao === "string" ? body.descricao.trim() : ""

		if (!rawEndereco) {
			return NextResponse.json(
				{ error: "O campo endereco_ip é obrigatório." },
				{ status: 400 }
			)
		}

		const status: IpStatus = isValidStatus(rawStatus) ? rawStatus : "Disponível"

		const result = await executeQuery<InsertResult>({
			query: `
				INSERT INTO ${TABLE_NAME} (endereco_ip, status, descricao, data_cadastro)
				VALUES (?, ?, ?, NOW())
			`,
			values: [rawEndereco, status, descricao]
		})

		const novoIp = await executeQuery<IpRecord[]>({
			query: `
				SELECT id, endereco_ip, status, descricao, data_cadastro
				FROM ${TABLE_NAME}
				WHERE id = ?
			`,
			values: [result.insertId]
		})

		return NextResponse.json(novoIp[0], { status: 201 })
	} catch (error) {
		const errorMessage = (error as Error)?.message ?? "Erro desconhecido"
		console.error("❌ Erro ao cadastrar IP:", error)

		if (errorMessage.includes("ER_DUP_ENTRY")) {
			return NextResponse.json(
				{ error: "Este endereço IP já está cadastrado." },
				{ status: 409 }
			)
		}

		return NextResponse.json({ error: "Erro ao cadastrar IP" }, { status: 500 })
	}
}
