import mysql from 'mysql2/promise';

// Conexão principal do sistema
export const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
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

console.log('🔌 Pool de conexão MySQL principal configurado');
console.log('🔌 Pool de conexão MySQL funcionários configurado');
console.log('🔌 Pool de conexão MySQL atendimento configurado');

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