import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ResultSetHeader } from "mysql2"
import { uploadFileToDrive } from "@/lib/google-drive"
import { writeFile, mkdir, readFile } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

// Interface para a sessão com as propriedades que usamos
interface SessionWithAccessToken {
  accessToken?: string;
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  error?: string;
}

// Diretório temporário para armazenar chunks de arquivos
const TEMP_DIR = join(process.cwd(), "tmp", "uploads");

// Garante que o diretório temporário existe
async function ensureTempDir() {
  if (!existsSync(TEMP_DIR)) {
    await mkdir(TEMP_DIR, { recursive: true });
  }
}

// Configuração para aumentar o limite de tamanho do corpo da requisição
export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as SessionWithAccessToken;
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Verificar se temos o token de acesso
    if (!session.accessToken) {
      return NextResponse.json(
        { error: "Token de acesso do Google não disponível" },
        { status: 401 }
      )
    }

    // Verificar se há erro no token
    if (session.error) {
      return NextResponse.json(
        { error: `Erro na autenticação: ${session.error}` },
        { status: 401 }
      );
    }

    try {
      const formData = await request.formData();
      const taskId = formData.get("taskId");
      
      // Verifica se é um upload em partes
      const chunkIndex = formData.get("chunkIndex");
      
      if (chunkIndex !== null) {
        return await handleChunkUpload(formData, session);
      }
      
      // Upload tradicional para arquivos pequenos
      const files = formData.getAll("files");

      if (!taskId || !files.length) {
        return NextResponse.json(
          { error: "Dados inválidos" },
          { status: 400 }
        );
      }

      const savedFiles = [];

      for (const file of files) {
        if (!(file instanceof File)) {
          continue;
        }

        try {
          // Converter o arquivo para buffer
          const fileBuffer = Buffer.from(await file.arrayBuffer());
          
          // Upload para o Google Drive usando o token do usuário
          const driveFile = await uploadFileToDrive(
            session.accessToken,
            fileBuffer,
            file.name,
            file.type
          );

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
              file.name,
              driveFile.name,
              file.type,
              file.size,
              session.user?.email,
              driveFile.id,
              driveFile.webViewLink
            ]
          );

          savedFiles.push({
            id: result.insertId,
            nome_arquivo: file.name,
            caminho_arquivo: driveFile.name,
            tipo_arquivo: file.type,
            tamanho_bytes: file.size,
            usuario_email: session.user?.email,
            google_drive_id: driveFile.id,
            google_drive_link: driveFile.webViewLink,
            data_upload: new Date().toISOString()
          });
        } catch (error) {
          console.error("Erro ao processar arquivo:", {
            fileName: file.name,
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          });
          throw error;
        }
      }

      // Atualiza a data da última atualização da tarefa
      const date = new Date();
      date.setHours(date.getHours() - 3);
      const now = date.toISOString();
      
      await db.execute(
        `UPDATE u711845530_gestao.atividades SET ultima_atualizacao = ? WHERE id = ?`,
        [now, taskId]
      );

      return NextResponse.json(savedFiles);
    } catch (formError) {
      console.error("Erro ao processar formData:", formError);
      return NextResponse.json(
        { error: "Erro ao processar dados do formulário", details: formError instanceof Error ? formError.message : String(formError) },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Erro ao fazer upload:", error);
    return NextResponse.json(
      { error: "Erro ao fazer upload", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Função para lidar com upload em partes
async function handleChunkUpload(formData: FormData, session: SessionWithAccessToken) {
  try {
    await ensureTempDir();
    
    const taskId = formData.get("taskId") as string;
    if (!taskId) {
      throw new Error("ID da tarefa não fornecido");
    }
    
    const fileName = formData.get("fileName") as string;
    const fileType = formData.get("fileType") as string;
    const fileSize = parseInt(formData.get("fileSize") as string);
    const chunkIndex = parseInt(formData.get("chunkIndex") as string);
    const totalChunks = parseInt(formData.get("totalChunks") as string);
    const chunk = formData.get("chunk");
    const fileId = formData.get("fileId") as string | null;
    
    if (!chunk || !(chunk instanceof Blob)) {
      throw new Error("Chunk inválido ou não fornecido");
    }
    
    // Gera um ID único para o arquivo se não existir
    const uniqueFileId = fileId || `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    const chunkDir = join(TEMP_DIR, uniqueFileId);
    
    // Cria o diretório para os chunks deste arquivo
    if (!existsSync(chunkDir)) {
      await mkdir(chunkDir, { recursive: true });
    }
    
    // Salva o chunk no diretório temporário
    const chunkPath = join(chunkDir, `chunk-${chunkIndex}`);
    
    try {
      const chunkBuffer = Buffer.from(await chunk.arrayBuffer());
      await writeFile(chunkPath, chunkBuffer);
      
      console.log(`Chunk ${chunkIndex + 1}/${totalChunks} salvo com sucesso (${chunkBuffer.length} bytes)`);
    } catch (chunkError) {
      console.error(`Erro ao salvar chunk ${chunkIndex}:`, chunkError);
      throw new Error(`Erro ao salvar chunk ${chunkIndex}: ${chunkError instanceof Error ? chunkError.message : String(chunkError)}`);
    }
    
    // Se for o último chunk, combina todos os chunks e faz o upload para o Google Drive
    if (chunkIndex === totalChunks - 1) {
      try {
        // Combina todos os chunks em um único arquivo
        const fileBuffer = await combineChunks(chunkDir, totalChunks, fileSize);
        
        console.log(`Arquivo combinado com sucesso (${fileBuffer.length} bytes)`);
        
        // Faz o upload para o Google Drive
        const driveFile = await uploadFileToDrive(
          session.accessToken as string,
          fileBuffer,
          fileName,
          fileType
        );
        
        // Salva as informações no banco de dados
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
        
        // Atualiza a data da última atualização da tarefa
        const date = new Date();
        date.setHours(date.getHours() - 3);
        const now = date.toISOString();
        
        await db.execute(
          `UPDATE u711845530_gestao.atividades SET ultima_atualizacao = ? WHERE id = ?`,
          [now, taskId]
        );
        
        return NextResponse.json({
          success: true,
          fileId: uniqueFileId,
          complete: true,
          fileInfo: {
            id: result.insertId,
            nome_arquivo: fileName,
            caminho_arquivo: driveFile.name,
            tipo_arquivo: fileType,
            tamanho_bytes: fileSize,
            usuario_email: session.user?.email,
            google_drive_id: driveFile.id,
            google_drive_link: driveFile.webViewLink,
            data_upload: new Date().toISOString()
          }
        });
      } catch (finalizeError) {
        console.error("Erro ao finalizar upload:", finalizeError);
        throw new Error(`Erro ao finalizar upload: ${finalizeError instanceof Error ? finalizeError.message : String(finalizeError)}`);
      }
    }
    
    // Se não for o último chunk, retorna sucesso parcial
    return NextResponse.json({
      success: true,
      fileId: uniqueFileId,
      complete: false,
      chunkIndex
    });
    
  } catch (error) {
    console.error("Erro ao processar chunk:", error);
    return NextResponse.json(
      { error: "Erro ao processar parte do arquivo", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Função para combinar chunks em um único arquivo
async function combineChunks(chunkDir: string, totalChunks: number, fileSize: number): Promise<Buffer> {
  const buffer = Buffer.alloc(fileSize);
  let offset = 0;
  
  for (let i = 0; i < totalChunks; i++) {
    try {
      const chunkPath = join(chunkDir, `chunk-${i}`);
      const chunkData = await readFile(chunkPath);
      
      console.log(`Lendo chunk ${i + 1}/${totalChunks} (${chunkData.length} bytes)`);
      
      chunkData.copy(buffer, offset);
      offset += chunkData.length;
    } catch (error) {
      console.error(`Erro ao ler chunk ${i}:`, error);
      throw new Error(`Erro ao ler chunk ${i}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  return buffer;
} 