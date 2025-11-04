import { NextRequest, NextResponse } from "next/server"

import { DB_ASTI_DATABASE, executeQuery, qualifyTable } from "@/lib/db"

const OPTIONAL_COLUMNS = ["responsavel", "setor", "equipamento"] as const
type OptionalColumn = (typeof OPTIONAL_COLUMNS)[number]

const ASTI_SCHEMA = DB_ASTI_DATABASE

if (!ASTI_SCHEMA) {
	throw new Error("Variável de ambiente DB_ASTI_DATABASE ou DB_DATABASE deve estar configurada para ASTI.")
}

const IPS_TABLE = qualifyTable(ASTI_SCHEMA, "ips")

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
		console.error("❌ Erro ao verificar colunas opcionais (associar):", error)
		return new Set<OptionalColumn>()
	}
}

interface UpdateResult {
	affectedRows: number
}

export async function PUT(request: NextRequest) {
	try {
		const { id, responsavel, setor, equipamento } = await request.json()

		if (!id) {
			return NextResponse.json({ error: "ID do IP é obrigatório" }, { status: 400 })
		}

		const availableColumns = await fetchAvailableOptionalColumns()
		const assignments: string[] = []
		const values: (string | number)[] = []

		if (availableColumns.has("responsavel")) {
			assignments.push("responsavel = ?")
			values.push(responsavel || "")
		}

		if (availableColumns.has("setor")) {
			assignments.push("setor = ?")
			values.push(setor || "")
		}

		if (availableColumns.has("equipamento")) {
			assignments.push("equipamento = ?")
			values.push(equipamento || "")
		}

		assignments.push("status = 'Em Uso'")

		const query = `
			UPDATE ${IPS_TABLE}
			SET ${assignments.join(", ")}
			WHERE id = ?
		`

		values.push(id)

		const result = await executeQuery<UpdateResult>({
			query,
			values
		})

		if (result.affectedRows === 0) {
			return NextResponse.json({ error: "IP não encontrado" }, { status: 404 })
		}

		return NextResponse.json({ 
			message: "IP associado com sucesso",
			id: id
		})

	} catch (error) {
		console.error("Erro ao associar IP:", error)
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 }
		)
	}
}