import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  fetchTvDashboardData,
  insertTvContent,
  insertTvNews
} from "@/lib/tv";
import type { TvEntryKind } from "@/lib/types";

const sanitizeBase64 = (raw?: string | null) => {
  if (!raw) return "";
  const commaIndex = raw.indexOf(",");
  return commaIndex >= 0 ? raw.substring(commaIndex + 1) : raw;
};

export async function GET() {
  try {
    const payload = await fetchTvDashboardData();
    return NextResponse.json(payload);
  } catch (error) {
    console.error("Erro ao buscar conteúdos da TV ASTI:", error);
    return NextResponse.json({ erro: "Falha ao buscar conteúdos" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ erro: "Usuário não autenticado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const rawTitle = String(body.title ?? "").trim();
    const rawDescription = typeof body.description === "string" ? body.description.trim() : "";
    const rawMessage = typeof body.message === "string" ? body.message.trim() : rawDescription;
    const type: TvEntryKind = body.type === "media" || body.type === "news"
      ? body.type
      : body.image
        ? "media"
        : "news";

    const authorName = session.user?.name ?? "Sistema";
    const authorEmail = session.user?.email ?? "sistema@asti.local";

    if (!rawTitle) {
      return NextResponse.json({ erro: "Título obrigatório" }, { status: 400 });
    }

    if (type === "news" && !rawMessage) {
      return NextResponse.json({ erro: "Mensagem obrigatória para notícias" }, { status: 400 });
    }

    if (type === "media" && !rawDescription) {
      return NextResponse.json({ erro: "Descrição obrigatória para conteúdos com imagem" }, { status: 400 });
    }

    if (type === "news") {
      const created = await insertTvNews({
        title: rawTitle,
        message: rawMessage,
        createdByName: authorName,
        createdByEmail: authorEmail
      });
      return NextResponse.json({ type: "news", item: created }, { status: 201 });
    }

    const imagePayload = body.image;
    if (!imagePayload || !imagePayload.base64) {
      return NextResponse.json({ erro: "Imagem obrigatória para conteúdos" }, { status: 400 });
    }

    const cleanBase64 = sanitizeBase64(String(imagePayload.base64));
    const mimeType = String(imagePayload.mimeType || imagePayload.type || "").trim();
    if (!mimeType.startsWith("image/")) {
      return NextResponse.json({ erro: "Apenas arquivos de imagem são aceitos" }, { status: 400 });
    }

    const created = await insertTvContent({
      title: rawTitle,
      description: rawDescription,
      createdByName: authorName,
      createdByEmail: authorEmail,
      image: {
        base64: cleanBase64,
        mimeType,
        fileName: String(imagePayload.fileName || imagePayload.nome || "imagem-tv"),
        size: Number(imagePayload.size ?? 0)
      }
    });

    return NextResponse.json({ type: "media", item: created }, { status: 201 });
  } catch (error) {
    console.error("Erro ao cadastrar conteúdo da TV ASTI:", error);
    return NextResponse.json({ erro: "Falha ao cadastrar conteúdo" }, { status: 500 });
  }
}
