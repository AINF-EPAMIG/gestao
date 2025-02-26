"use client"

import { useSession } from "next-auth/react";
import { AuthButton } from "./auth-button";
import { Loader2 } from "lucide-react";

export default function AuthRequired({ children }: { children: React.ReactNode }) {
  const { status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Acesso Restrito</h1>
        <p className="text-gray-500">Faça login para continuar</p>
        <AuthButton showLogout={false} />
      </div>
    );
  }

  return children;
} 