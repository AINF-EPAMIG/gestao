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
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
) {
  try {
    // Criar um stream a partir do buffer
    const fileStream = Readable.from(fileBuffer)

    // Criar metadados do arquivo
    const metadata = {
      name: fileName,
      mimeType: mimeType,
    }

    // Criar o corpo da requisição multipart
    const boundary = "-------" + Math.random().toString(36).substring(2)
    
    // Parte 1: Metadados
    let requestBody = `--${boundary}\r\n`
    requestBody += 'Content-Type: application/json; charset=UTF-8\r\n\r\n'
    requestBody += JSON.stringify(metadata) + '\r\n'
    
    // Parte 2: Conteúdo do arquivo
    requestBody += `--${boundary}\r\n`
    requestBody += `Content-Type: ${mimeType}\r\n\r\n`
    
    // Converter a primeira parte para buffer
    const requestBodyBuffer = Buffer.from(requestBody, 'utf-8')
    
    // Parte final do boundary
    const endBoundaryBuffer = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8')
    
    // Fazer a requisição para a API do Google Drive
    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: Buffer.concat([
        requestBodyBuffer,
        fileBuffer,
        endBoundaryBuffer
      ]),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Erro ao fazer upload para o Google Drive: ${JSON.stringify(errorData)}`)
    }

    const data = await response.json()
    
    // Compartilhar o arquivo publicamente para visualização
    await shareFileWithUser(accessToken, data.id, 'anyone', 'reader')
    
    // Obter o link de visualização
    const fileData = await getFileInfo(accessToken, data.id)
    
    return {
      id: data.id,
      name: data.name,
      mimeType: data.mimeType,
      webViewLink: fileData.webViewLink
    }
  } catch (error) {
    console.error('Erro ao fazer upload para o Google Drive:', error)
    throw error
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
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })
    
    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Erro ao excluir arquivo: ${errorData}`)
    }
    
    return true
  } catch (error) {
    console.error('Erro ao excluir arquivo do Google Drive:', error)
    throw error
  }
}

// Função para compartilhar um arquivo com um usuário ou grupo
async function shareFileWithUser(
  accessToken: string,
  fileId: string,
  emailOrDomain: string,
  role: 'reader' | 'writer' | 'commenter' | 'owner'
) {
  try {
    const permission = {
      type: emailOrDomain === 'anyone' ? 'anyone' : 'user',
      role: role,
      allowFileDiscovery: false
    }
    
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(permission),
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Erro ao compartilhar arquivo: ${JSON.stringify(errorData)}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Erro ao compartilhar arquivo:', error)
    throw error
  }
}

// Função para obter informações de um arquivo
async function getFileInfo(accessToken: string, fileId: string) {
  try {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,webViewLink`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Erro ao obter informações do arquivo: ${JSON.stringify(errorData)}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Erro ao obter informações do arquivo:', error)
    throw error
  }
} 