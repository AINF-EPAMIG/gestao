import mysql from 'mysql2/promise';

export const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log('🔌 Pool de conexão MySQL configurado');

export async function executeQuery<T>({ 
  query, 
  values 
}: { 
  query: string; 
  values?: (string | number)[] 
}): Promise<T> {
  try {
    console.log('📝 Executando query:', query);
    console.log('📝 Valores:', values);
    
    const [results] = await db.execute(query, values);
    
    console.log('✅ Query executada com sucesso');
    return results as T;
  } catch (error) {
    console.error('❌ Erro na execução da query:', error);
    throw new Error(`Erro ao executar query: ${error}`);
  }
} 