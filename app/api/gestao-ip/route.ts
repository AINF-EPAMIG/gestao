import { NextResponse } from "next/server"

import { DB_ASTI_DATABASE, executeQuery, qualifyTable } from "@/lib/db"

const ASTI_SCHEMA = DB_ASTI_DATABASE

if (!ASTI_SCHEMA) {
	throw new Error("Variável de ambiente DB_ASTI_DATABASE ou DB_DATABASE deve estar configurada para ASTI.")
}

const TABLE_NAME = qualifyTable(ASTI_SCHEMA, "ips")

const IP_STATUSES = ["Disponível", "Em Uso", "Reservado", "Manutenção"] as const

type IpStatus = (typeof IP_STATUSES)[number]

interface IpRecord {
	id: number
	endereco_ip: string
	status: IpStatus
	descricao: string | null
	data_cadastro: string
	responsavel?: string | null
	setor?: string | null
	equipamento?: string | null
}

interface InsertResult {
	insertId: number
}

const isValidStatus = (status: string | null): status is IpStatus =>
	!!status && (IP_STATUSES as readonly string[]).includes(status)
const OPTIONAL_COLUMNS = ["responsavel", "setor", "equipamento"] as const
type OptionalColumn = (typeof OPTIONAL_COLUMNS)[number]

const buildSelectColumns = (availableColumns: Set<string>) => {
	const baseColumns = ["id", "endereco_ip", "status", "descricao"]
	const optionalColumns = OPTIONAL_COLUMNS.map((column) =>
		availableColumns.has(column) ? column : `NULL AS ${column}`
	)
	return [...baseColumns, ...optionalColumns, "data_cadastro"].join(", ")
}

const fetchAvailableOptionalColumns = async () => {
	try {
		const rows = await executeQuery<{ column_name: OptionalColumn }[]>({
			query: `
				SELECT COLUMN_NAME AS column_name
				FROM INFORMATION_SCHEMA.COLUMNS
				WHERE TABLE_SCHEMA = ?
					AND TABLE_NAME = ?
					AND COLUMN_NAME IN (${OPTIONAL_COLUMNS.map(() => "?").join(", ")})
			`,
			values: [ASTI_SCHEMA, "ips", ...OPTIONAL_COLUMNS]
		})

		return new Set(rows.map((row) => row.column_name))
	} catch (error) {
		console.error("❌ Erro ao verificar colunas opcionais:", error)
		return new Set<OptionalColumn>()
	}
}

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

	const availableColumns = await fetchAvailableOptionalColumns()
	const selectColumns = buildSelectColumns(availableColumns)

	let query = `SELECT ${selectColumns} FROM ${TABLE_NAME}`
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

		const availableColumns = await fetchAvailableOptionalColumns()
		const selectColumns = buildSelectColumns(availableColumns)
		const novoIp = await executeQuery<IpRecord[]>({
			query: `
				SELECT ${selectColumns}
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
