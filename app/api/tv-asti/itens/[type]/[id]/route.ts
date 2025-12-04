import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { deleteTvEntry } from "@/lib/tv";
import type { TvEntryKind } from "@/lib/types";

type RouteContext = {
  params: Promise<{
    type: string;
    id: string;
  }>;
};

export async function DELETE(_: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ erro: "Usuário não autenticado" }, { status: 401 });
  }

  const params = await context.params;
  const entryType = params.type === "media" || params.type === "news" ? (params.type as TvEntryKind) : null;
  const entryId = Number(params.id);

  if (!entryType || Number.isNaN(entryId)) {
    return NextResponse.json({ erro: "Parâmetros inválidos" }, { status: 400 });
  }

  try {
    await deleteTvEntry(entryType, entryId);
    return NextResponse.json({ sucesso: true });
  } catch (error) {
    console.error("Erro ao excluir conteúdo da TV ASTI:", error);
    return NextResponse.json({ erro: "Falha ao excluir conteúdo" }, { status: 500 });
  }
}
