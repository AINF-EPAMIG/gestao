import mysql from 'mysql2/promise';

const trimEnv = (value?: string | null) => value?.trim() ?? '';

const mainDatabase = trimEnv(process.env.DB_DATABASE);
const astiDatabase = trimEnv(process.env.DB_ASTI_DATABASE) || mainDatabase;
const gestaoDatabase = trimEnv(process.env.DB_GESTAO_DATABASE) || mainDatabase;

if (!mainDatabase) {
  console.warn('⚠️  Variável de ambiente DB_DATABASE não definida.');
}

if (!astiDatabase) {
  console.warn('⚠️  Variável de ambiente DB_ASTI_DATABASE não definida e nenhum fallback disponível.');
}

if (!gestaoDatabase) {
  console.warn('⚠️  Variável de ambiente DB_GESTAO_DATABASE não definida e nenhum fallback disponível.');
}

// Conexão principal do sistema
export const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: mainDatabase || undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Nova conexão para o banco de dados de funcionários
export const dbFuncionarios = mysql.createPool({
  host: process.env.DB_FUNCIONARIOS_HOST,
  user: process.env.DB_FUNCIONARIOS_USER,
  password: process.env.DB_FUNCIONARIOS_PASSWORD,
  database: process.env.DB_FUNCIONARIOS_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Nova conexão para o banco de dados de atendimento
export const dbAtendimento = mysql.createPool({
  host: process.env.DB_ATENDIMENTO_HOST,
  user: process.env.DB_ATENDIMENTO_USER,
  password: process.env.DB_ATENDIMENTO_PASSWORD,
  database: process.env.DB_ATENDIMENTO_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Nova conexão para o banco de dados ASTI
export const dbAsti = mysql.createPool({
  host: process.env.DB_ASTI_HOST,
  user: process.env.DB_ASTI_USER,
  password: process.env.DB_ASTI_PASSWORD,
  database: process.env.DB_ASTI_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log('🔌 Pool de conexão MySQL principal configurado');
console.log('🔌 Pool de conexão MySQL funcionários configurado');
console.log('🔌 Pool de conexão MySQL atendimento configurado');
console.log('🔌 Pool de conexão MySQL ASTI configurado');

export const DB_MAIN_DATABASE = mainDatabase;
export const DB_ASTI_DATABASE = astiDatabase;
export const DB_GESTAO_DATABASE = gestaoDatabase;

export const qualifyTable = (schema: string, table: string) =>
  schema ? `\`${schema}\`.\`${table}\`` : `\`${table}\``;

// Função para executar queries no banco principal
export async function executeQuery<T>({ 
  query, 
  values 
}: { 
  query: string; 
  values?: (string | number)[] 
}): Promise<T> {
  try {
    const [results] = await db.execute(query, values);
    return results as T;
  } catch (error) {
    console.error('❌ Erro na execução da query:', error);
    throw new Error(`Erro ao executar query: ${error}`);
  }
}

// Função para executar queries no banco de funcionários
export async function executeQueryFuncionarios<T>({ 
  query, 
  values 
}: { 
  query: string; 
  values?: (string | number)[] 
}): Promise<T> {
  try {
    const [results] = await dbFuncionarios.execute(query, values);
    return results as T;
  } catch (error) {
    console.error('❌ Erro na execução da query no banco de funcionários:', error);
    throw new Error(`Erro ao executar query no banco de funcionários: ${error}`);
  }
}

// Função para executar queries no banco de atendimento
export async function executeQueryAtendimento<T>({ 
  query, 
  values 
}: { 
  query: string; 
  values?: (string | number)[] 
}): Promise<T> {
  try {
    const [results] = await dbAtendimento.execute(query, values);
    return results as T;
  } catch (error) {
    console.error('❌ Erro na execução da query no banco de atendimento:', error);
    throw new Error(`Erro ao executar query no banco de atendimento: ${error}`);
  }
}

// Função para executar queries no banco ASTI
export async function executeQueryAsti<T>({ 
  query, 
  values 
}: { 
  query: string; 
  values?: (string | number)[] 
}): Promise<T> {
  try {
    const [results] = await dbAsti.execute(query, values);
    return results as T;
  } catch (error) {
    console.error('❌ Erro na execução da query no banco ASTI:', error);
    throw new Error(`Erro ao executar query no banco ASTI: ${error}`);
  }
} 