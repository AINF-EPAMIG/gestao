import { NextRequest, NextResponse } from 'next/server';
import { executeQueryFuncionarios } from '@/lib/db';
import { Funcionario } from '@/lib/types';

// Busca informações do usuário pelo e-mail
async function getUserInfo(email: string) {
  const result = await executeQueryFuncionarios<Funcionario[]>({
    query: 'SELECT * FROM funcionarios WHERE email = ? LIMIT 1',
    values: [email],
  });
  return result[0] || null;
}

// Busca subordinados pelo e-mail do chefe
async function getSubordinados(email: string) {
  const chefe = await getUserInfo(email);
  if (!chefe) return [];
  const result = await executeQueryFuncionarios<Funcionario[]>({
    query: `SELECT nome, chapa, filial, secao, cargo, email FROM funcionarios WHERE chefia = ? OR chefia_substituto = ?`,
    values: [chefe.email, chefe.email],
  });
  return result;
}

// Definir interface para o retorno da função getResponsaveisBySetor
interface ResponsavelSetor {
  NOME: string;
  EMAIL: string;
  CHEFE: string;
}

// Busca responsáveis por setor
async function getResponsaveisBySetor(secao: string) {
  const result = await executeQueryFuncionarios<ResponsavelSetor[]>({
    query: `SELECT nome AS NOME, email AS EMAIL, chefia AS CHEFE FROM funcionarios WHERE secao = ? AND chefia IS NOT NULL AND chefia != ''`,
    values: [secao],
  });
  return result;
}

// Utilitários equivalentes ao rm-service
function isUserChefe(user: Funcionario | null): boolean {
  return !!user && typeof user.cargo === 'string' && user.cargo.toUpperCase().includes('CHEFE');
}

function isUserEstagiario(user: Funcionario | null): boolean {
  return !!user && typeof user.cargo === 'string' && user.cargo.toUpperCase().includes('ESTAGIARIO');
}

function getUserSection(user: Funcionario | null): string {
  return user?.secao || '';
}

function getUserRole(user: Funcionario | null): string {
  return user?.cargo || '';
}

function getUserBranch(user: Funcionario | null): string {
  return user?.filial || '';
}

function getUserManager(user: Funcionario | null): string {
  return user?.chefia || '';
}

function getUserRegistration(user: Funcionario | null): string {
  return user?.chapa || '';
}

// Busca a chefia imediata de um funcionário pelo nome ou email
async function getChefiaImediata(searchTerm: string) {
  console.log('Debug - Buscando chefia imediata para:', searchTerm);
  
  const result = await executeQueryFuncionarios<Funcionario[]>({
    query: 'SELECT chefia FROM funcionarios WHERE nome LIKE ? OR email LIKE ? LIMIT 1',
    values: [`%${searchTerm}%`, `%${searchTerm}%`],
  });
  
  console.log('Debug - Resultado da busca:', result);
  
  if (!result || result.length === 0 || !result[0].chefia) {
    console.log('Debug - Funcionário não encontrado ou sem chefia');
    return null;
  }
  
  return {
    nome: result[0].chefia
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    if (action === 'userInfo') {
      const email = searchParams.get('email');
      if (!email) return NextResponse.json({ error: 'Email não informado' }, { status: 400 });
      const user = await getUserInfo(email);
      return NextResponse.json(user);
    }
    if (action === 'subordinados') {
      const email = searchParams.get('email');
      if (!email) return NextResponse.json({ error: 'Email não informado' }, { status: 400 });
      const subs = await getSubordinados(email);
      return NextResponse.json(subs);
    }
    if (action === 'responsaveisSetor') {
      const secao = searchParams.get('secao');
      if (!secao) return NextResponse.json({ error: 'Seção não informada' }, { status: 400 });
      const responsaveis = await getResponsaveisBySetor(secao);
      return NextResponse.json(responsaveis);
    }
    if (action === 'getChefiaImediata') {
      const nome = searchParams.get('nome');
      if (!nome) return NextResponse.json({ error: 'Nome não informado' }, { status: 400 });
      const chefiaImediata = await getChefiaImediata(nome);
      return NextResponse.json(chefiaImediata);
    }
    // Funções utilitárias
    if (action === 'isUserChefe') {
      const email = searchParams.get('email');
      if (!email) return NextResponse.json({ error: 'Email não informado' }, { status: 400 });
      const user = await getUserInfo(email);
      return NextResponse.json({ isChefe: isUserChefe(user) });
    }
    if (action === 'isUserEstagiario') {
      const email = searchParams.get('email');
      if (!email) return NextResponse.json({ error: 'Email não informado' }, { status: 400 });
      const user = await getUserInfo(email);
      return NextResponse.json({ isEstagiario: isUserEstagiario(user) });
    }
    if (action === 'getUserSection') {
      const email = searchParams.get('email');
      if (!email) return NextResponse.json({ error: 'Email não informado' }, { status: 400 });
      const user = await getUserInfo(email);
      return NextResponse.json({ secao: getUserSection(user) });
    }
    if (action === 'getUserRole') {
      const email = searchParams.get('email');
      if (!email) return NextResponse.json({ error: 'Email não informado' }, { status: 400 });
      const user = await getUserInfo(email);
      return NextResponse.json({ cargo: getUserRole(user) });
    }
    if (action === 'getUserBranch') {
      const email = searchParams.get('email');
      if (!email) return NextResponse.json({ error: 'Email não informado' }, { status: 400 });
      const user = await getUserInfo(email);
      return NextResponse.json({ filial: getUserBranch(user) });
    }
    if (action === 'getUserManager') {
      const email = searchParams.get('email');
      if (!email) return NextResponse.json({ error: 'Email não informado' }, { status: 400 });
      const user = await getUserInfo(email);
      return NextResponse.json({ chefia: getUserManager(user) });
    }
    if (action === 'getUserRegistration') {
      const email = searchParams.get('email');
      if (!email) return NextResponse.json({ error: 'Email não informado' }, { status: 400 });
      const user = await getUserInfo(email);
      return NextResponse.json({ chapa: getUserRegistration(user) });
    }
    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno', details: String(error) }, { status: 500 });
  }
} 