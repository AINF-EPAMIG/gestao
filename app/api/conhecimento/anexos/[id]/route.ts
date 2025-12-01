import { NextResponse } from "next/server";
import { executeQueryAsti } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getFileFromDrive } from "@/lib/google-drive";

export async function GET(req: Request, { params }: { params: Promise<Record<string, string | string[] | undefined>> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ erro: "Usuário não autenticado" }, { status: 401 });
    }
    if (!session.accessToken || session.error) {
      return NextResponse.json({ erro: session.error ? `Erro de autenticação: ${session.error}` : "Token de acesso do Google indisponível" }, { status: 401 });
    }

    const paramsObj = await params;
    const id = String(paramsObj?.id ?? "");
  const query = `SELECT * FROM anexo WHERE id = ?`;
  const resultado = await executeQueryAsti({ query, values: [id] }) as Array<Record<string, unknown>> | undefined;
  const row = (resultado && resultado.length ? resultado[0] : null) as Record<string, unknown> | null;
    if (!row) {
      return NextResponse.json({ erro: "Anexo não encontrado" }, { status: 404 });
    }

  const filename = String(row["nome_arquivo"] ?? `anexo_${id}`);
  const contentType = String(row["tipo_arquivo"] ?? 'application/octet-stream');

    // Allow inline display when requested (iframe / viewer). By default keep attachment behavior.
    // Check request URL search params for `inline=1` or `inline=true`.
    let dispositionType = 'attachment';
    try {
      const url = new URL(req.url);
      const inlineParam = url.searchParams.get('inline');
      if (inlineParam === '1' || inlineParam === 'true') dispositionType = 'inline';
    } catch {
      // ignore - fallback to attachment
    }

    if (row["google_drive_id"]) {
      try {
        const driveFile = await getFileFromDrive(session.accessToken, String(row["google_drive_id"]));
        const contentBuffer = driveFile.content;
        const driveArrayBuffer = contentBuffer.buffer.slice(
          contentBuffer.byteOffset,
          contentBuffer.byteOffset + contentBuffer.byteLength
        ) as ArrayBuffer;
        const response = new NextResponse(driveArrayBuffer, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Content-Length': String(contentBuffer.length),
            'Content-Disposition': `${dispositionType}; filename="${filename.replace(/\"/g, '')}"`
          }
        });
        return response;
      } catch (driveErr) {
        console.error("Erro ao recuperar arquivo do Google Drive:", driveErr);
        if (row["google_drive_link"]) {
          return NextResponse.redirect(String(row["google_drive_link"]));
        }
      }
    }

    const base64 = String(row["conteudo_arquivo"] ?? "");
    const commaIndex = base64.indexOf(',');
    const rawBase64 = commaIndex > 0 ? base64.substring(commaIndex + 1) : base64;
    const binary = Buffer.from(rawBase64, 'base64');
    const fallbackArrayBuffer = binary.buffer.slice(binary.byteOffset, binary.byteOffset + binary.byteLength) as ArrayBuffer;

    return new NextResponse(fallbackArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(binary.length),
        'Content-Disposition': `${dispositionType}; filename="${filename.replace(/\"/g, '')}"`
      }
    });
  } catch (err) {
    return NextResponse.json({ erro: 'Erro ao recuperar anexo', detalhe: String(err) }, { status: 500 });
  }
}
