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
export async function uploadToGoogleDrive(fileBuffer: Buffer, fileName: string): Promise<{ id: string; webViewLink: string; webContentLink: string }> {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });

    const fileMetadata = {
      name: fileName,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!],
    };

    const media = {
      mimeType: 'application/octet-stream',
      body: Readable.from(fileBuffer),
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id,webViewLink,webContentLink',
    });

    const fileId = file.data.id!;

    // Adicionar permissões públicas
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // Obter links atualizados
    const updatedFile = await drive.files.get({
      fileId: fileId,
      fields: 'id,webViewLink,webContentLink',
    });

    return {
      id: fileId,
      webViewLink: updatedFile.data.webViewLink!,
      webContentLink: updatedFile.data.webContentLink!,
    };
  } catch (error) {
    console.error('Erro no upload para Google Drive:', error);
    throw error;
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

// Função para fazer upload de arquivo usando o token do usuário
export async function uploadFileToDrive(
  accessToken: string, 
  fileBuffer: Buffer, 
  fileName: string, 
  mimeType: string
): Promise<{ id: string; webViewLink: string; webContentLink: string }> {
  try {
    const drive = await getGoogleDriveClient(accessToken);

    const fileMetadata = {
      name: fileName,
    };

    const media = {
      mimeType: mimeType,
      body: Readable.from(fileBuffer),
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id,webViewLink,webContentLink',
    });

    const fileId = file.data.id!;

    // Adicionar permissões públicas
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // Obter links atualizados
    const updatedFile = await drive.files.get({
      fileId: fileId,
      fields: 'id,webViewLink,webContentLink',
    });

    return {
      id: fileId,
      webViewLink: updatedFile.data.webViewLink!,
      webContentLink: updatedFile.data.webContentLink!,
    };
  } catch (error) {
    console.error('Erro no upload para Google Drive:', error);
    throw new Error('Falha ao fazer upload do arquivo para o Google Drive');
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