import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ResultSetHeader } from "mysql2"
import { uploadFileToDrive } from "@/lib/google-drive"
import { writeFile, mkdir } from "fs/promises"
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

    const formData = await request.formData()
    const taskId = formData.get("taskId")
    
    // Verifica se é um upload em partes
    const chunkIndex = formData.get("chunkIndex");
    
    if (chunkIndex !== null) {
      return await handleChunkUpload(formData, session);
    }
    
    // Upload tradicional para arquivos pequenos
    const files = formData.getAll("files")

    if (!taskId || !files.length) {
      return NextResponse.json(
        { error: "Dados inválidos" },
        { status: 400 }
      )
    }

    const savedFiles = []

    for (const file of files) {
      if (!(file instanceof File)) {
        continue
      }

      try {
        // Converter o arquivo para buffer
        const fileBuffer = Buffer.from(await file.arrayBuffer())
        
        // Upload para o Google Drive usando o token do usuário
        const driveFile = await uploadFileToDrive(
          session.accessToken,
          fileBuffer,
          file.name,
          file.type
        )

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
        )

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
        })
      } catch (error) {
        console.error("Erro ao processar arquivo:", {
          fileName: file.name,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        })
        throw error
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

    return NextResponse.json(savedFiles)
  } catch (error) {
    console.error("Erro ao fazer upload:", error)
    return NextResponse.json(
      { error: "Erro ao fazer upload" },
      { status: 500 }
    )
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
    const chunk = formData.get("chunk") as Blob;
    const fileId = formData.get("fileId") as string | null;
    
    // Gera um ID único para o arquivo se não existir
    const uniqueFileId = fileId || `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    const chunkDir = join(TEMP_DIR, uniqueFileId);
    
    // Cria o diretório para os chunks deste arquivo
    if (!existsSync(chunkDir)) {
      await mkdir(chunkDir, { recursive: true });
    }
    
    // Salva o chunk no diretório temporário
    const chunkPath = join(chunkDir, `chunk-${chunkIndex}`);
    const chunkBuffer = Buffer.from(await chunk.arrayBuffer());
    await writeFile(chunkPath, chunkBuffer);
    
    // Se for o último chunk, combina todos os chunks e faz o upload para o Google Drive
    if (chunkIndex === totalChunks - 1) {
      // Combina todos os chunks em um único arquivo
      const fileBuffer = await combineChunks(chunkDir, totalChunks, fileSize);
      
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
      { error: "Erro ao processar parte do arquivo" },
      { status: 500 }
    );
  }
}

// Função para combinar chunks em um único arquivo
async function combineChunks(chunkDir: string, totalChunks: number, fileSize: number): Promise<Buffer> {
  const buffer = Buffer.alloc(fileSize);
  let offset = 0;
  
  for (let i = 0; i < totalChunks; i++) {
    const chunkPath = join(chunkDir, `chunk-${i}`);
    const chunkData = await import('fs').then(fs => fs.promises.readFile(chunkPath));
    chunkData.copy(buffer, offset);
    offset += chunkData.length;
  }
  
  return buffer;
} 