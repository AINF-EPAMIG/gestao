import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const config = {
  matcher: ['/api/anexos/upload'],
}

export function middleware(request: NextRequest) {
  // Apenas passa a requisição adiante
  return NextResponse.next()
} 