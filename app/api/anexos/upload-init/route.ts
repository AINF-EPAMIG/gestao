import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import fs from "fs"
import path from "path"
import os from "os"

// Diretório temporário para armazenar os chunks
const TEMP_DIR = path.join(os.tmpdir(), "upload-chunks");

// Garantir que o diretório temporário exista
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
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

    // Obter os dados da requisição
    const data = await request.json();
    const { fileName, fileType, fileSize, totalChunks, taskId, sessionId } = data;

    if (!fileName || !fileType || !fileSize || !totalChunks || !taskId || !sessionId) {
      return NextResponse.json(
        { error: "Dados inválidos para iniciar upload em chunks" },
        { status: 400 }
      );
    }

    // Criar diretório para a sessão
    const sessionDir = path.join(TEMP_DIR, sessionId);
    fs.mkdirSync(sessionDir, { recursive: true });

    // Salvar metadados da sessão
    const metadataPath = path.join(sessionDir, "metadata.json");
    fs.writeFileSync(
      metadataPath,
      JSON.stringify({
        fileName,
        fileType,
        fileSize,
        totalChunks,
        taskId,
        sessionId,
        receivedChunks: 0,
        uploadedBy: session.user?.email,
        startTime: new Date().toISOString(),
      })
    );

    console.log(`[ChunkUpload] Sessão de upload iniciada: ${sessionId}`, {
      fileName,
      fileSize,
      totalChunks,
      taskId,
    });

    return NextResponse.json({
      success: true,
      sessionId,
      message: "Sessão de upload iniciada com sucesso",
    });
  } catch (error) {
    console.error("[ChunkUpload] Erro ao iniciar sessão de upload:", error);
    return NextResponse.json(
      {
        error: "Erro ao iniciar sessão de upload",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
} 