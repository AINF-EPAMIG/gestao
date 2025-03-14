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
    responseLimit: false,
  },
}

// Garantir que o diretório temporário exista
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

export async function POST(request: NextRequest) {
  console.log("[ChunkUpload] Recebendo solicitação para iniciar upload em chunks");
  
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      console.log("[ChunkUpload] Erro: Sessão não encontrada");
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar se temos o token de acesso
    if (!session.accessToken) {
      console.log("[ChunkUpload] Erro: Token de acesso não disponível");
      return NextResponse.json(
        { error: "Token de acesso do Google não disponível" },
        { status: 401 }
      );
    }

    // Verificar se há erro no token
    if (session.error) {
      console.log(`[ChunkUpload] Erro na autenticação: ${session.error}`);
      return NextResponse.json(
        { error: `Erro na autenticação: ${session.error}` },
        { status: 401 }
      );
    }

    // Obter os dados da requisição
    const data = await request.json();
    console.log("[ChunkUpload] Dados recebidos:", data);
    
    const { fileName, fileType, fileSize, totalChunks, taskId, sessionId } = data;

    // Validação detalhada dos campos
    const validationErrors = [];
    if (!fileName) validationErrors.push("fileName é obrigatório");
    if (!fileType) validationErrors.push("fileType é obrigatório");
    if (!fileSize) validationErrors.push("fileSize é obrigatório");
    if (!totalChunks) validationErrors.push("totalChunks é obrigatório");
    if (!taskId) validationErrors.push("taskId é obrigatório");
    if (!sessionId) validationErrors.push("sessionId é obrigatório");

    if (validationErrors.length > 0) {
      console.log("[ChunkUpload] Erros de validação:", validationErrors);
      return NextResponse.json(
        { 
          error: "Dados inválidos para iniciar upload em chunks", 
          details: validationErrors.join(", ") 
        },
        { status: 400 }
      );
    }

    // Criar diretório para a sessão
    const sessionDir = path.join(TEMP_DIR, sessionId);
    fs.mkdirSync(sessionDir, { recursive: true });

    // Salvar metadados da sessão
    const metadataPath = path.join(sessionDir, "metadata.json");
    const metadata = {
      fileName,
      fileType,
      fileSize,
      totalChunks,
      taskId,
      sessionId,
      receivedChunks: 0,
      uploadedBy: session.user?.email,
      startTime: new Date().toISOString(),
    };
    
    fs.writeFileSync(
      metadataPath,
      JSON.stringify(metadata)
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