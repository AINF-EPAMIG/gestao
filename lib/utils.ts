import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Removendo o mapa estático pois agora usaremos as imagens do Google
export async function getUserIcon(email: string): Promise<string | null> {
  try {
    const response = await fetch(`/api/funcionarios?action=avatar&email=${encodeURIComponent(email)}`);
    if (response.ok) {
      const data = await response.json();
      return data.avatarUrl || null;
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar avatar:', error);
    return null;
  }
}

export async function testGetUserIcon(email: string): Promise<void> {
  try {
    const apiUrl = `/api/funcionarios?action=avatar&email=${encodeURIComponent(email)}`;
    const response = await fetch(apiUrl);
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.image_url) {
        const imgResponse = await fetch(data.image_url, { method: 'HEAD' });
        if (imgResponse.ok) {
          // URL da imagem é válida
        } else {
          // URL da imagem não é válida
        }
      } else {
        // Nenhuma URL de imagem retornada
      }
    }
  } catch (error) {
    console.error('Erro ao testar avatar:', error);
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