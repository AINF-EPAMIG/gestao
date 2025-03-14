import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import fs from "fs"
import path from "path"
import os from "os"

// Diretório temporário para armazenar os chunks
const TEMP_DIR = path.join(os.tmpdir(), "upload-chunks");

// Configuração para aumentar o limite de tamanho
export const config = {
  api: {
    bodyParser: false, // Desativando o bodyParser padrão para lidar com arquivos grandes
    responseLimit: '10mb',
  },
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar se temos o token de acesso
    if (!session.accessToken) {
      return NextResponse.json(
        { error: "Token de acesso do Google não disponível" },
        { status: 401 }
      );
    }

    // Verificar se há erro no token
    if (session.error) {
      return NextResponse.json(
        { error: `Erro na autenticação: ${session.error}` },
        { status: 401 }
      );
    }

    // Obter os dados do FormData
    const formData = await request.formData();
    const chunk = formData.get("chunk");
    const sessionId = formData.get("sessionId") as string;
    const chunkIndex = parseInt(formData.get("chunkIndex") as string);
    const totalChunks = parseInt(formData.get("totalChunks") as string);

    if (!chunk || !sessionId || isNaN(chunkIndex) || isNaN(totalChunks)) {
      return NextResponse.json(
        { error: "Dados inválidos para o chunk" },
        { status: 400 }
      );
    }

    // Verificar se a sessão existe
    const sessionDir = path.join(TEMP_DIR, sessionId);
    const metadataPath = path.join(sessionDir, "metadata.json");
    
    if (!fs.existsSync(metadataPath)) {
      return NextResponse.json(
        { error: "Sessão de upload não encontrada" },
        { status: 404 }
      );
    }

    // Ler os metadados da sessão
    const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
    
    // Verificar se o chunk está dentro do intervalo esperado
    if (chunkIndex < 0 || chunkIndex >= metadata.totalChunks) {
      return NextResponse.json(
        { error: "Índice de chunk inválido" },
        { status: 400 }
      );
    }

    // Salvar o chunk no diretório da sessão
    const chunkPath = path.join(sessionDir, `chunk-${chunkIndex}`);
    
    // Converter o chunk para buffer e salvar
    if (chunk instanceof File) {
      const buffer = Buffer.from(await chunk.arrayBuffer());
      fs.writeFileSync(chunkPath, buffer);
    } else {
      return NextResponse.json(
        { error: "Formato de chunk inválido" },
        { status: 400 }
      );
    }

    // Atualizar os metadados
    metadata.receivedChunks += 1;
    metadata.lastChunkTime = new Date().toISOString();
    fs.writeFileSync(metadataPath, JSON.stringify(metadata));

    console.log(`[ChunkUpload] Chunk ${chunkIndex + 1}/${totalChunks} recebido para sessão ${sessionId}`);

    return NextResponse.json({
      success: true,
      message: `Chunk ${chunkIndex + 1}/${totalChunks} recebido com sucesso`,
      receivedChunks: metadata.receivedChunks,
      totalChunks: metadata.totalChunks,
    });
  } catch (error) {
    console.error("[ChunkUpload] Erro ao processar chunk:", error);
    return NextResponse.json(
      {
        error: "Erro ao processar chunk",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
} 