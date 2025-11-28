import { NextResponse } from "next/server";
import { executeQueryAsti } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<Record<string, string | string[] | undefined>> }) {
  try {
    const paramsObj = await params;
    const id = String(paramsObj?.id ?? "");
  const query = `SELECT * FROM anexo WHERE id = ?`;
  const resultado = await executeQueryAsti({ query, values: [id] }) as Array<Record<string, unknown>> | undefined;
  const row = (resultado && resultado.length ? resultado[0] : null) as Record<string, unknown> | null;
    if (!row) {
      return NextResponse.json({ erro: "Anexo não encontrado" }, { status: 404 });
    }

  const base64 = String(row["conteudo_arquivo"] ?? "");
  // If the content is already stored as base64 with possible data URI prefix, strip it
  const maybeData = base64;
    const commaIndex = maybeData.indexOf(',');
    const rawBase64 = commaIndex > 0 ? maybeData.substring(commaIndex + 1) : maybeData;

    // Decode base64 to Uint8Array
    const binary = Buffer.from(rawBase64, 'base64');

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

    return new NextResponse(binary, {
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
