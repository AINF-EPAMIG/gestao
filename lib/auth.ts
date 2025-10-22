import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { executeQuery } from "@/lib/db"
import { isTokenExpired, refreshAccessToken } from "@/lib/auth-utils"

declare module "next-auth" {
  interface Session {
    user: {
      id?: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
    accessToken?: string
    error?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    accessTokenExpires?: number
    refreshToken?: string
    error?: string
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/drive',
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account, user }) {
      // Inicialização: salva o token de acesso e refresh token no JWT
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at ? account.expires_at * 1000 : 0,
          // Preserve the user's image (from provider) in the token so it can be restored into session
          picture: (user as any)?.image || token.picture || null,
        };
      }

      // Retorna o token anterior se o token de acesso ainda não expirou
      if (!isTokenExpired(token)) {
        return token;
      }

      // Atualiza o token se expirou
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      
      // Passa o token de acesso e possíveis erros para a sessão
      session.accessToken = token.accessToken;
      session.error = token.error;
      // Ensure user's image is available on the session (use token.picture if present)
      if (session.user) {
        session.user.image = (token as any).picture || session.user.image || null;
      }
      
      return session;
    },
    async signIn({ user }) {
      try {
        if (user.email) {
          // Verifica se o usuário já existe
          const existingUser = await executeQuery({
            query: 'SELECT * FROM u711845530_gestao.responsaveis WHERE email = ?',
            values: [user.email]
          }) as { id: number; email: string; image_url: string | null }[];

          if (existingUser.length > 0) {
            // Atualiza a imagem do usuário existente se houver uma nova imagem
            if (user.image) {
              await executeQuery({
                query: 'UPDATE u711845530_gestao.responsaveis SET image_url = ? WHERE email = ?',
                values: [user.image, user.email]
              });
            }
          } else {
            // Insere novo usuário
            await executeQuery({
              query: 'INSERT INTO u711845530_gestao.responsaveis (email, image_url) VALUES (?, ?)',
              values: [user.email, user.image || '']
            });
          }
        }
        return true;
      } catch (error) {
        console.error('Erro ao salvar/atualizar usuário:', error);
        return true; // Permite o login mesmo se houver erro ao salvar
      }
    }
  },
  events: {
    async signOut(message) {
      // Evento disparado quando o usuário faz logout
      console.log('User signed out:', message.token?.email || 'unknown user');
    }
  },
  debug: process.env.NODE_ENV === 'development',
} 