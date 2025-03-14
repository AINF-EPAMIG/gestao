import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const config = {
  matcher: ['/api/anexos/upload'],
}

export function middleware(request: NextRequest) {
  // Aumenta o limite de tempo de resposta para 120 segundos
  const response = NextResponse.next({
    request: {
      headers: new Headers(request.headers),
    },
  })
  
  // Adiciona cabeçalhos para aumentar os limites
  response.headers.set('x-middleware-timeout', '120000')
  
  return response
} 