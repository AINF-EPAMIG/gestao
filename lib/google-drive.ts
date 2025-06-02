import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { Readable } from 'stream';

// Função para obter um cliente autenticado do Google Drive usando o token do usuário
export async function getGoogleDriveClient(accessToken: string) {
  try {
    const auth = new OAuth2Client();
    auth.setCredentials({ access_token: accessToken });

    return google.drive({ version: 'v3', auth });
  } catch (error) {
    console.error('Erro ao criar cliente do Google Drive:', error);
    throw new Error('Falha ao inicializar o cliente do Google Drive');
  }
}

// Função para fazer upload de um arquivo para o Google Drive
export async function uploadFileToDrive(
  accessToken: string,
  file: Buffer,
  fileName: string,
  mimeType: string,
  folderId?: string
) {
  try {
    console.log("[GoogleDrive] Iniciando upload do arquivo:", fileName)
    console.log("[GoogleDrive] Detalhes do arquivo:", {
      fileName,
      mimeType,
      fileSize: file.length,
      folderId
    })

    const drive = await getGoogleDriveClient(accessToken);
    console.log("[GoogleDrive] Cliente do Google Drive criado com sucesso")
    
    // Configuração do arquivo a ser enviado
    const fileMetadata: { name: string; parents?: string[] } = {
      name: fileName,
    };
    
    // Se tiver um ID de pasta, adiciona ao arquivo
    if (folderId) {
      fileMetadata.parents = [folderId];
    }

    console.log("[GoogleDrive] Metadados do arquivo:", fileMetadata)

    // Converter o Buffer para um stream legível
    const fileStream = Readable.from(file);
    console.log("[GoogleDrive] Stream criado a partir do buffer")

    // Configuração da mídia
    const media = {
      mimeType,
      body: fileStream,
    };

    // Executa o upload
    console.log("[GoogleDrive] Iniciando upload para o Google Drive...")
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id,name,webViewLink,webContentLink',
    });
    console.log("[GoogleDrive] Upload inicial concluído:", {
      id: response.data.id,
      name: response.data.name,
      webViewLink: response.data.webViewLink,
      webContentLink: response.data.webContentLink
    })

    // Adiciona permissão pública de leitura ao arquivo
    console.log("[GoogleDrive] Adicionando permissões públicas...")
    await drive.permissions.create({
      fileId: response.data.id!,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });
    console.log("[GoogleDrive] Permissões públicas adicionadas com sucesso")

    // Atualiza os metadados do arquivo para obter os links atualizados após dar a permissão
    console.log("[GoogleDrive] Obtendo links atualizados...")
    const updatedFile = await drive.files.get({
      fileId: response.data.id!,
      fields: 'id,name,webViewLink,webContentLink'
    });
    console.log("[GoogleDrive] Links atualizados obtidos:", {
      id: updatedFile.data.id,
      name: updatedFile.data.name,
      webViewLink: updatedFile.data.webViewLink,
      webContentLink: updatedFile.data.webContentLink
    })

    const result = {
      id: updatedFile.data.id,
      name: updatedFile.data.name,
      webViewLink: updatedFile.data.webViewLink,
      webContentLink: updatedFile.data.webContentLink
    };
    
    console.log("[GoogleDrive] Upload concluído com sucesso:", result)
    return result;
  } catch (error) {
    console.error('[GoogleDrive] Erro detalhado ao fazer upload:', {
      fileName,
      mimeType,
      fileSize: file.length,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error
    });
    throw new Error(`Falha ao fazer upload do arquivo para o Google Drive: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

// Função para obter um arquivo do Google Drive
export async function getFileFromDrive(accessToken: string, fileId: string) {
  try {
    const drive = await getGoogleDriveClient(accessToken);
    
    // Obtém os metadados do arquivo
    const fileMetadata = await drive.files.get({
      fileId,
      fields: 'id,name,mimeType,webViewLink',
    });

    // Obtém o conteúdo do arquivo
    const fileContent = await drive.files.get({
      fileId,
      alt: 'media',
    }, { responseType: 'arraybuffer' });

    return {
      metadata: fileMetadata.data,
      content: Buffer.from(fileContent.data as ArrayBuffer),
    };
  } catch (error) {
    console.error('Erro ao obter arquivo do Google Drive:', error);
    throw new Error('Falha ao obter arquivo do Google Drive');
  }
}

// Função para excluir um arquivo do Google Drive
export async function deleteFileFromDrive(accessToken: string, fileId: string) {
  try {
    const drive = await getGoogleDriveClient(accessToken);
    await drive.files.delete({ fileId });
    return true;
  } catch (error) {
    console.error('Erro ao excluir arquivo do Google Drive:', error);
    throw new Error('Falha ao excluir arquivo do Google Drive');
  }
}

// Função para compartilhar um arquivo com um usuário específico
export async function shareFileWithUser(accessToken: string, fileId: string, userEmail: string, role: 'reader' | 'writer' | 'commenter' = 'reader') {
  try {
    const drive = await getGoogleDriveClient(accessToken);
    
    await drive.permissions.create({
      fileId,
      requestBody: {
        type: 'user',
        role,
        emailAddress: userEmail,
      },
    });
    
    return true;
  } catch (error) {
    console.error('Erro ao compartilhar arquivo:', error);
    throw new Error('Falha ao compartilhar arquivo com o usuário');
  }
} 