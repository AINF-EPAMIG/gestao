"use client";

import Link from "next/link";
import { ArrowLeft, LucideIcon } from "lucide-react";

interface PageHeaderAstiProps {
  /** Rótulo superior (ex: "Controle de Estoque") */
  label: string;
  /** Título principal da página */
  title: string;
  /** URL para o botão de voltar (padrão: /asti/home) */
  backHref?: string;
  /** Ícone exibido à direita */
  icon?: LucideIcon;
  /** Cor do tema (classes Tailwind para texto e background do ícone) */
  themeColor?: {
    text: string;
    bgLight: string;
  };
}

export function PageHeaderAsti({
  label,
  title,
  backHref = "/asti/home",
  icon: Icon,
  themeColor = { text: "text-emerald-600", bgLight: "bg-emerald-100" }
}: PageHeaderAstiProps) {
  return (
    <header className="rounded-3xl border border-emerald-100 bg-white/80 p-6 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={backHref}
            className="inline-flex items-center justify-center rounded-2xl border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <p className={`text-sm font-semibold uppercase tracking-widest ${themeColor.text}`}>
              {label}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900 md:text-3xl">
              {title}
            </h1>
          </div>
        </div>
        {Icon && (
          <div className="flex items-center gap-2">
            <Icon className={`h-10 w-10 rounded-2xl ${themeColor.bgLight} p-2 ${themeColor.text}`} />
          </div>
        )}
      </div>
    </header>
  );
}
