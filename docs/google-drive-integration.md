# Integração com Google Drive

Este documento descreve as alterações feitas para implementar a integração com o Google Drive para armazenamento de anexos.

## Arquivos Modificados

1. **lib/google-drive.ts** (novo)
   - Implementação das funções para interagir com a API do Google Drive
   - Funções para upload, download, exclusão e compartilhamento de arquivos

2. **.env.local**
   - Adicionadas variáveis de ambiente para configuração do Google Drive:
     - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
     - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
     - `GOOGLE_DRIVE_DEFAULT_FOLDER_ID`

3. **app/api/anexos/upload/route.ts**
   - Modificado para fazer upload dos arquivos para o Google Drive
   - Compartilha o arquivo com o usuário que fez o upload
   - Salva o ID e o link de visualização do arquivo no banco de dados

4. **app/api/anexos/download/[id]/route.ts**
   - Modificado para baixar os arquivos do Google Drive
   - Adiciona fallback para o link de visualização se o download falhar

5. **app/api/anexos/[id]/route.ts**
   - Modificado para excluir os arquivos do Google Drive quando um anexo é excluído

6. **app/api/anexos/route.ts**
   - Atualizado para incluir os campos do Google Drive na listagem de anexos

7. **components/task-attachments.tsx**
   - Atualizado para exibir um botão de visualização que abre o arquivo no Google Drive

8. **sql/update_anexos_table.sql** (novo)
   - Script SQL para adicionar as colunas necessárias à tabela de anexos

9. **docs/google-drive-setup.md** (novo)
   - Guia de configuração da integração com o Google Drive

## Alterações no Banco de Dados

Foram adicionadas duas novas colunas à tabela `anexos`:

- `drive_file_id` - Armazena o ID do arquivo no Google Drive
- `drive_view_link` - Armazena o link para visualização do arquivo no Google Drive

## Fluxo de Funcionamento

1. Quando um usuário faz upload de um arquivo:
   - O arquivo é enviado para o Google Drive
   - O arquivo é compartilhado com o usuário que fez o upload
   - As informações do arquivo são salvas no banco de dados

2. Quando um usuário visualiza os anexos:
   - É exibido um botão para visualizar o arquivo diretamente no Google Drive
   - O botão de download continua funcionando, baixando o arquivo do Google Drive

3. Quando um usuário exclui um anexo:
   - O arquivo é excluído do Google Drive
   - O registro é removido do banco de dados

## Vantagens

1. **Aproveitamento da autenticação do Google**
   - Os usuários já estão autenticados com o Google, então têm acesso imediato aos arquivos

2. **Economia de espaço no servidor**
   - Os arquivos são armazenados no Google Drive, não no servidor da aplicação

3. **Recursos avançados do Google Drive**
   - Visualização online de diversos tipos de arquivos
   - Controle de versão
   - Colaboração em tempo real

## Próximos Passos

1. Implementar controle de acesso mais granular aos arquivos
2. Adicionar suporte para pastas específicas por projeto ou departamento
3. Implementar visualização prévia de arquivos diretamente na aplicação 