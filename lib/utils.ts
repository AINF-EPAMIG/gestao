import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Removendo o mapa estático pois agora usaremos as imagens do Google
export async function getUserIcon(email: string | undefined): Promise<string | undefined> {
  if (!email) return undefined;
  
  console.log('Buscando avatar para:', email);
  
  try {
    const result = await fetch(`/api/responsaveis/avatar?email=${encodeURIComponent(email)}`);
    const data = await result.json();
    console.log('Resultado da API de avatar:', data);
    return data.image_url;
  } catch (error) {
    console.error('Erro ao buscar avatar:', error);
    return undefined;
  }
}

// Função para testar a recuperação de avatar - pode ser chamada do console do browser para debugar
export async function testGetUserIcon(email: string): Promise<void> {
  console.log('Testando avatar para:', email);
  
  try {
    console.log('Fazendo requisição para a API...');
    const apiUrl = `/api/responsaveis/avatar?email=${encodeURIComponent(email)}`;
    console.log('URL da API:', apiUrl);
    
    const response = await fetch(apiUrl);
    console.log('Status da resposta:', response.status);
    
    const data = await response.json();
    console.log('Dados retornados:', data);
    
    if (data.image_url) {
      console.log('URL da imagem:', data.image_url);
      
      // Testar se a URL é válida
      const imgResponse = await fetch(data.image_url, { method: 'HEAD' });
      console.log('Status da resposta da imagem:', imgResponse.status);
      
      if (imgResponse.ok) {
        console.log('✅ A URL da imagem é válida!');
      } else {
        console.log('❌ A URL da imagem não é válida!');
      }
    } else {
      console.log('❌ Nenhuma URL de imagem retornada!');
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