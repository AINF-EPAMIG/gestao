import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const userIconMap: Record<string, string> = {
  'arthur.souza@epamig.br': '/arthur_icon.jpg',
  'rodolfo.fernandes@epamig.br': '/rodolfo_icon.jpg',
  'andrezza.fernandes@epamig.br': '/andrezza_icon.jpg',
  'michelle@epamig.br': '/michelle_icon.jpg',
  'victor.purri@epamig.br': '/victor_icon.jpg',
  'alexsolano@epamig.br': '/alex_icon.jpg',
  'anderson@epamig.br': '/anderson_icon.jpg',
  'andrea@epamig.br': '/andrea_icon.jpg',
  'bruno.gregorio@epamig.br': '/bruno_icon.jpg',
  'felipe.silva@epamig.br': '/felipe_icon.jpg',
  'igor.neves@epamig.br': '/igor_icon.jpg',
}

export function getUserIcon(email: string | undefined): string | undefined {
  if (!email) return undefined;
  return userIconMap[email];
}

// Mapeamento de exceções para formatação de nomes
const NOME_EXCEPTIONS: Record<string, string> = {
  "alexsolano@epamig.br": "Alex Solano"
};

export function getResponsavelName(email?: string): string {
  if (!email) return "Não atribuído";
  
  // Verifica se o email está nas exceções
  if (NOME_EXCEPTIONS[email]) {
    return NOME_EXCEPTIONS[email];
  }
  
  const username = email.split('@')[0];
  
  return username
    .split('.')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
} 