import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadFileToDrive } from "@/lib/google-drive";

export async function GET() {
  try {
    // Verificar autenticação
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

    // Criar um arquivo de teste simples
    const testContent = "Este é um arquivo de teste para o Google Drive.";
    const testBuffer = Buffer.from(testContent);

    // Fazer upload para o Google Drive
    const result = await uploadFileToDrive(
      session.accessToken,
      testBuffer,
      "teste.txt",
      "text/plain"
    );

    return NextResponse.json({
      success: true,
      message: "Arquivo de teste enviado com sucesso para o Google Drive",
      file: result
    });
  } catch (error) {
    console.error("Erro no teste do Google Drive:", error);
    return NextResponse.json(
      { 
        error: "Erro ao testar integração com o Google Drive",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 