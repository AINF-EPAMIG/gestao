import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ResultSetHeader } from "mysql2"
import { uploadFileToDrive } from "@/lib/google-drive"
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

export async function POST(request: NextRequest) {
  console.log("[ChunkUpload] Recebendo solicitação para finalizar upload em chunks");
  
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
    const { sessionId, fileName, fileType, fileSize, taskId } = data;

    if (!sessionId || !fileName || !fileType || !fileSize || !taskId) {
      return NextResponse.json(
        { error: "Dados inválidos para finalizar upload" },
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
    
    // Verificar se todos os chunks foram recebidos
    if (metadata.receivedChunks !== metadata.totalChunks) {
      return NextResponse.json(
        { 
          error: "Upload incompleto", 
          details: `Recebidos ${metadata.receivedChunks} de ${metadata.totalChunks} chunks` 
        },
        { status: 400 }
      );
    }

    console.log(`[ChunkUpload] Finalizando upload para sessão ${sessionId}`, {
      fileName,
      fileSize,
      totalChunks: metadata.totalChunks
    });

    // Combinar todos os chunks em um único arquivo
    const combinedFilePath = path.join(sessionDir, "combined-file");
    const writeStream = fs.createWriteStream(combinedFilePath);
    
    // Função para combinar os chunks de forma síncrona
    const combineChunks = () => {
      return new Promise<void>((resolve, reject) => {
        try {
          for (let i = 0; i < metadata.totalChunks; i++) {
            const chunkPath = path.join(sessionDir, `chunk-${i}`);
            const chunkData = fs.readFileSync(chunkPath);
            writeStream.write(chunkData);
          }
          writeStream.end();
          writeStream.on('finish', () => {
            resolve();
          });
          writeStream.on('error', (err) => {
            reject(err);
          });
        } catch (error) {
          reject(error);
        }
      });
    };

    await combineChunks();
    
    // Ler o arquivo combinado
    const fileBuffer = fs.readFileSync(combinedFilePath);
    
    console.log(`[ChunkUpload] Arquivo combinado com sucesso, tamanho: ${fileBuffer.length} bytes`);
    
    // Upload para o Google Drive
    const driveFile = await uploadFileToDrive(
      session.accessToken,
      fileBuffer,
      fileName,
      fileType
    );
    
    console.log(`[ChunkUpload] Arquivo enviado para o Google Drive, ID: ${driveFile.id}`);

    // Salvar informações no banco
    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO u711845530_gestao.anexos (
        atividade_id,
        nome_arquivo,
        caminho_arquivo,
        tipo_arquivo,
        tamanho_bytes,
        usuario_email,
        google_drive_id,
        google_drive_link
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        taskId,
        fileName,
        driveFile.name,
        fileType,
        fileSize,
        session.user?.email,
        driveFile.id,
        driveFile.webViewLink
      ]
    );
    
    console.log(`[ChunkUpload] Informações salvas no banco de dados, ID: ${result.insertId}`);

    // Atualiza a data da última atualização da tarefa
    const date = new Date();
    date.setHours(date.getHours() - 3);
    const now = date.toISOString();
    
    await db.execute(
      `UPDATE u711845530_gestao.atividades SET ultima_atualizacao = ? WHERE id = ?`,
      [now, taskId]
    );

    // Limpar os arquivos temporários
    try {
      fs.rmSync(sessionDir, { recursive: true, force: true });
      console.log(`[ChunkUpload] Diretório temporário removido: ${sessionDir}`);
    } catch (cleanupError) {
      console.error(`[ChunkUpload] Erro ao limpar diretório temporário: ${sessionDir}`, cleanupError);
      // Não interromper o fluxo por erro de limpeza
    }

    const fileData = {
      id: result.insertId,
      nome_arquivo: fileName,
      caminho_arquivo: driveFile.name,
      tipo_arquivo: fileType,
      tamanho_bytes: fileSize,
      usuario_email: session.user?.email,
      google_drive_id: driveFile.id,
      google_drive_link: driveFile.webViewLink,
      data_upload: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      message: "Upload finalizado com sucesso",
      file: fileData
    });
  } catch (error) {
    console.error("[ChunkUpload] Erro ao finalizar upload:", error);
    return NextResponse.json(
      {
        error: "Erro ao finalizar upload",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
} 