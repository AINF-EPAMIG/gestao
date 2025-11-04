import { NextResponse } from "next/server"

import { DB_ASTI_DATABASE, executeQuery, qualifyTable } from "@/lib/db"

const ASTI_SCHEMA = DB_ASTI_DATABASE

if (!ASTI_SCHEMA) {
	throw new Error("Variável de ambiente DB_ASTI_DATABASE ou DB_DATABASE deve estar configurada para ASTI.")
}

const TABLE_NAME = qualifyTable(ASTI_SCHEMA, "faixa")

interface FaixaRecord {
	id: number
	faixa: string
	descricao: string
	data_criacao: string
}

interface InsertResult {
	insertId: number
}

export async function GET() {
	try {
		const faixas = await executeQuery<FaixaRecord[]>({
			query: `
				SELECT id, faixa, descricao, data_criacao
				FROM ${TABLE_NAME}
				ORDER BY data_criacao DESC
			`
		})

		return NextResponse.json(faixas)
	} catch (error) {
		console.error("❌ Erro ao buscar faixas:", error)
		return NextResponse.json({ error: "Erro ao buscar faixas" }, { status: 500 })
	}
}

export async function POST(request: Request) {
	try {
		const body = await request.json()
		const faixaValor = typeof body?.faixa === "string" ? body.faixa.trim() : ""
		const descricaoValor = typeof body?.descricao === "string" ? body.descricao.trim() : ""

		if (!faixaValor || !descricaoValor) {
			return NextResponse.json(
				{ error: "Os campos faixa e descrição são obrigatórios." },
				{ status: 400 }
			)
		}

		const result = await executeQuery<InsertResult>({
			query: `
				INSERT INTO ${TABLE_NAME} (faixa, descricao, data_criacao)
				VALUES (?, ?, NOW())
			`,
			values: [faixaValor, descricaoValor]
		})

		const faixaCriada = await executeQuery<FaixaRecord[]>({
			query: `
				SELECT id, faixa, descricao, data_criacao
				FROM ${TABLE_NAME}
				WHERE id = ?
			`,
			values: [result.insertId]
		})

		return NextResponse.json(faixaCriada[0], { status: 201 })
	} catch (error) {
		console.error("❌ Erro ao cadastrar faixa:", error)
		return NextResponse.json({ error: "Erro ao cadastrar faixa" }, { status: 500 })
	}
}
