import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import "./globals.css"
import type React from "react"
import { Providers } from "@/components/providers"

export const metadata: Metadata = {
  title: "Painel Gestão",
  description: "Sistema de gerenciamento de tarefas Kanban",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={GeistSans.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}

