import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Removendo o mapa estático pois agora usaremos as imagens do Google
export async function getUserIcon(email: string | undefined): Promise<string | undefined> {
  if (!email) return undefined;
  
  try {
    const result = await fetch(`/api/responsaveis/avatar?email=${encodeURIComponent(email)}`);
    const data = await result.json();
    return data.image_url;
  } catch (error) {
    console.error('Erro ao buscar avatar:', error);
    return undefined;
  }
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