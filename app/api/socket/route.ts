import { NextResponse } from 'next/server'
import { initSocket, NextApiResponseServerIO } from '@/lib/socket'

export async function GET(req: Request, res: NextApiResponseServerIO) {
  try {
    const io = initSocket(res)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao inicializar socket' }, { status: 500 })
  }
} 