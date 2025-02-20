import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { executeQuery } from "@/lib/db";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
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
});

export { handler as GET, handler as POST };