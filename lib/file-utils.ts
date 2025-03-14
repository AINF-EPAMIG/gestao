import JSZip from 'jszip';

// Tamanho máximo para upload direto (em bytes) - 10MB
export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

// Tamanho máximo para cada parte de arquivo dividido (em bytes) - 1MB
export const MAX_CHUNK_SIZE = 1 * 1024 * 1024;

/**
 * Verifica se um arquivo precisa ser processado (compactado ou dividido)
 */
export function needsProcessing(file: File): boolean {
  return file.size > MAX_UPLOAD_SIZE;
}

/**
 * Compacta um arquivo usando JSZip
 */
export async function compressFile(file: File): Promise<File> {
  try {
    const zip = new JSZip();
    
    // Adiciona o arquivo ao zip
    zip.file(file.name, await file.arrayBuffer());
    
    // Gera o arquivo zip
    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 9 // Nível máximo de compressão
      }
    });
    
    // Cria um novo arquivo a partir do blob
    const zipFile = new File(
      [zipBlob], 
      `${file.name}.zip`, 
      { type: 'application/zip' }
    );
    
    return zipFile;
  } catch (error) {
    console.error('Erro ao compactar arquivo:', error);
    throw new Error('Falha ao compactar o arquivo');
  }
}

/**
 * Divide um arquivo em partes menores
 */
export async function splitFile(file: File): Promise<File[]> {
  try {
    const fileBuffer = await file.arrayBuffer();
    const totalChunks = Math.ceil(fileBuffer.byteLength / MAX_CHUNK_SIZE);
    const chunks: File[] = [];
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * MAX_CHUNK_SIZE;
      const end = Math.min(start + MAX_CHUNK_SIZE, fileBuffer.byteLength);
      const chunk = fileBuffer.slice(start, end);
      
      // Cria um arquivo para cada parte
      const chunkFile = new File(
        [chunk], 
        `${file.name}.part${i + 1}of${totalChunks}`, 
        { type: file.type }
      );
      
      chunks.push(chunkFile);
    }
    
    return chunks;
  } catch (error) {
    console.error('Erro ao dividir arquivo:', error);
    throw new Error('Falha ao dividir o arquivo');
  }
}

/**
 * Processa um arquivo grande, tentando primeiro compactar
 * Se ainda estiver acima do limite, divide em partes
 */
export async function processLargeFile(file: File): Promise<{
  files: File[],
  isCompressed: boolean,
  isSplit: boolean
}> {
  try {
    // Primeiro tenta compactar
    const compressedFile = await compressFile(file);
    
    // Se o arquivo compactado for menor que o limite, retorna ele
    if (compressedFile.size <= MAX_UPLOAD_SIZE) {
      return {
        files: [compressedFile],
        isCompressed: true,
        isSplit: false
      };
    }
    
    // Se ainda estiver acima do limite, divide o arquivo compactado
    const splitFiles = await splitFile(compressedFile);
    
    return {
      files: splitFiles,
      isCompressed: true,
      isSplit: true
    };
  } catch (error) {
    console.error('Erro ao processar arquivo grande:', error);
    throw new Error('Falha ao processar o arquivo grande');
  }
} 