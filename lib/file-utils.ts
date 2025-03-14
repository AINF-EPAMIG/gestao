import JSZip from 'jszip';

// Tamanho máximo para upload direto (em bytes) - 10MB
export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

// Tamanho máximo para arquivos compactados (em bytes) - 30MB
export const MAX_COMPRESSED_SIZE = 30 * 1024 * 1024;

/**
 * Verifica se um arquivo precisa ser processado (compactado)
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
 * Processa um arquivo grande, apenas compactando-o
 * Se o arquivo compactado ainda for maior que o limite, retorna um erro
 */
export async function processLargeFile(file: File): Promise<{
  files: File[],
  isCompressed: boolean,
  isSplit: boolean
}> {
  try {
    // Compacta o arquivo
    const compressedFile = await compressFile(file);
    
    // Se o arquivo compactado for menor que o limite para arquivos compactados, retorna ele
    if (compressedFile.size <= MAX_COMPRESSED_SIZE) {
      return {
        files: [compressedFile],
        isCompressed: true,
        isSplit: false
      };
    }
    
    // Se ainda estiver acima do limite, retorna um erro
    throw new Error(`Mesmo após a compactação, o arquivo ainda é muito grande (${formatFileSize(compressedFile.size)}). O tamanho máximo permitido para arquivos compactados é ${formatFileSize(MAX_COMPRESSED_SIZE)}.`);
  } catch (error) {
    console.error('Erro ao processar arquivo grande:', error);
    throw error; // Propaga o erro para ser tratado pelo componente
  }
}

// Função auxiliar para formatar o tamanho do arquivo
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' bytes';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
  else return (bytes / 1073741824).toFixed(1) + ' GB';
} 