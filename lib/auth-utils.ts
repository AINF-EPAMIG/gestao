import { JWT } from "next-auth/jwt";

/**
 * Verifica se o token de acesso está expirado
 */
export function isTokenExpired(token: JWT): boolean {
  if (!token.accessTokenExpires) return true;
  
  // Verifica se o token expira em menos de 10 minutos
  const expiresIn = token.accessTokenExpires - Date.now();
  return expiresIn < 10 * 60 * 1000; // 10 minutos em milissegundos
}

/**
 * Atualiza o token de acesso usando o refresh token
 */
export async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const url = "https://oauth2.googleapis.com/token";
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        grant_type: "refresh_token",
        refresh_token: token.refreshToken as string,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      // Mantém o refresh token existente a menos que um novo seja fornecido
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error("Erro ao atualizar token:", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
} 