interface RMUserInfo {
  NOME_COMPLETO: string;
  CHAPA: string;
  FILIAL: string;
  SECAO: string;
  CARGO: string;
  CHEFE: string;
  ESTAGIARIO: string;
  NOME_CHEFIA: string;
}

interface RMSubordinado {
  NOME_SUBORDINADO: string;
  CHAPA_SUBORDINADO: string;
  FILIAL: string;
  SECAO: string;
  CARGO_SUBORDINADO: string;
  EMAIL_SUBORDINADO: string;
}

interface ResponsavelSetor {
  NOME: string;
  EMAIL: string;
  CHEFE: string;
}

const RM_API_CONFIG = {
  baseUrl: 'https://empresade125373.rm.cloudtotvs.com.br:8051/api/framework/v1/consultaSQLServer/RealizaConsulta',
  auth: {
    username: 'arthur.souza',
    password: '4518Adz74$'
  }
};

// Lista de emails de administradores com acesso total
const ADMIN_EMAILS = [
  'exemplo@epamig.br',
];

export function isUserAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email);
}

export async function getUserInfoFromRM(email: string): Promise<RMUserInfo | null> {
  try {
    const response = await fetch(
      `${RM_API_CONFIG.baseUrl}/AINF22012025.02/1/P/?parameters=email=${email}`,
      {
        headers: {
          Authorization: "Basic " + btoa(`${RM_API_CONFIG.auth.username}:${RM_API_CONFIG.auth.password}`),
        },
      }
    );

    if (!response.ok) {
      throw new Error('Erro ao consultar API do RM');
    }

    const data = await response.json();
    return data[0] || null;
  } catch (error) {
    console.error('Erro ao buscar informações do usuário no RM:', error);
    return null;
  }
}

export function isUserChefe(userInfo: RMUserInfo | null): boolean {
  return userInfo?.CHEFE === "SIM";
}

export function isUserEstagiario(userInfo: RMUserInfo | null): boolean {
  return userInfo?.ESTAGIARIO === "SIM";
}

export function getUserSection(userInfo: RMUserInfo | null): string {
  return userInfo?.SECAO || "";
}

export function getUserRole(userInfo: RMUserInfo | null): string {
  return userInfo?.CARGO || "";
}

export function getUserBranch(userInfo: RMUserInfo | null): string {
  return userInfo?.FILIAL || "";
}

export function getUserManager(userInfo: RMUserInfo | null): string {
  return userInfo?.NOME_CHEFIA || "";
}

export function getUserRegistration(userInfo: RMUserInfo | null): string {
  return userInfo?.CHAPA || "";
}

export async function getSubordinadosFromRM(email: string): Promise<RMSubordinado[] | null> {
  try {
    const response = await fetch(
      `${RM_API_CONFIG.baseUrl}/AINF22012025.03/1/P/?parameters=email=${email}`,
      {
        headers: {
          Authorization: "Basic " + btoa(`${RM_API_CONFIG.auth.username}:${RM_API_CONFIG.auth.password}`),
        },
      }
    );

    if (!response.ok) {
      throw new Error('Erro ao consultar API do RM');
    }

    const data = await response.json();
    return data || null;
  } catch (error) {
    console.error('Erro ao buscar subordinados no RM:', error);
    return null;
  }
}

export async function getResponsaveisBySetor(setor: string): Promise<ResponsavelSetor[]> {
  try {
    const response = await fetch(
      `${RM_API_CONFIG.baseUrl}/AINF22012025.07/1/P/?parameters=secao=${setor}`,
      {
        method: 'GET',
        headers: {
          'Authorization': "Basic " + btoa(`${RM_API_CONFIG.auth.username}:${RM_API_CONFIG.auth.password}`),
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Falha ao buscar responsáveis do setor');
    }

    const data = await response.json();
    return data.filter((resp: ResponsavelSetor) => resp.CHEFE === 'NÃO');
  } catch (error) {
    console.error('Erro ao buscar responsáveis do setor:', error);
    return [];
  }
} 