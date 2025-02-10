import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'auth-db1724.hstgr.io',
  user: process.env.DB_USER || 'u711845530_gestao',
  password: process.env.DB_PASSWORD || '*Desenvolvimento2023',
  database: process.env.DB_DATABASE || 'u711845530_gestao',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log('🔌 Pool de conexão MySQL configurado');

// Definir interfaces específicas para seus dados
interface DatabaseRecord {
  id: string;
  // adicione outros campos necessários
}

export async function executeQuery<T>({ 
  query, 
  values 
}: { 
  query: string; 
  values?: (string | number)[] 
}): Promise<T> {
  try {
    console.log('📝 Executando query:', query);
    console.log('📝 Valores:', values || 'Nenhum');
    
    const [results] = await pool.execute(query, values);
    
    console.log('✅ Query executada com sucesso');
    return results as T;
  } catch (error) {
    console.error('❌ Erro na execução da query:', error);
    throw new Error(`Erro ao executar query: ${error}`);
  }
} 