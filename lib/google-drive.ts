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
    const drive = await getGoogleDriveClient(accessToken);
    
    // Configuração do arquivo a ser enviado
    const fileMetadata: { name: string; parents?: string[] } = {
      name: fileName,
    };
    
    // Se tiver um ID de pasta, adiciona ao arquivo
    if (folderId) {
      fileMetadata.parents = [folderId];
    }

    // Converter o Buffer para um stream legível
    const fileStream = Readable.from(file);

    // Configuração da mídia
    const media = {
      mimeType,
      body: fileStream,
    };

    // Executa o upload
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id,name,webViewLink',
    });

    return {
      id: response.data.id,
      name: response.data.name,
      webViewLink: response.data.webViewLink,
    };
  } catch (error) {
    console.error('Erro ao fazer upload para o Google Drive:', error);
    throw new Error('Falha ao fazer upload do arquivo para o Google Drive');
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