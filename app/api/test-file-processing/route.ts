import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MAX_UPLOAD_SIZE, MAX_COMPRESSED_SIZE } from "@/lib/file-utils";

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 }
      );
    }

    // Informações sobre o arquivo
    const fileInfo = {
      name: file.name,
      type: file.type,
      size: file.size,
      sizeFormatted: formatFileSize(file.size),
      needsProcessing: file.size > MAX_UPLOAD_SIZE,
      maxUploadSize: MAX_UPLOAD_SIZE,
      maxUploadSizeFormatted: formatFileSize(MAX_UPLOAD_SIZE),
      maxCompressedSize: MAX_COMPRESSED_SIZE,
      maxCompressedSizeFormatted: formatFileSize(MAX_COMPRESSED_SIZE),
    };

    return NextResponse.json({
      success: true,
      message: "Informações do arquivo recebidas com sucesso",
      fileInfo
    });
  } catch (error) {
    console.error("Erro no teste de processamento de arquivo:", error);
    return NextResponse.json(
      { 
        error: "Erro ao testar processamento de arquivo",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// Função para formatar o tamanho do arquivo
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' bytes';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
  else return (bytes / 1073741824).toFixed(1) + ' GB';
} 