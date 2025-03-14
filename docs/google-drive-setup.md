# Configuração da Integração com Google Drive

Este guia explica como configurar a integração com o Google Drive para armazenar os anexos do sistema.

## Pré-requisitos

1. Ter uma conta Google
2. Acesso ao [Google Cloud Console](https://console.cloud.google.com/)

## Passos para Configuração

### 1. Criar um Projeto no Google Cloud

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Clique em "Selecionar Projeto" no topo da página
3. Clique em "Novo Projeto"
4. Dê um nome ao projeto (ex: "Sistema de Gestão EPAMIG")
5. Clique em "Criar"

### 2. Habilitar a API do Google Drive

1. No menu lateral, vá para "APIs e Serviços" > "Biblioteca"
2. Pesquise por "Google Drive API"
3. Clique na API do Google Drive
4. Clique em "Habilitar"

### 3. Criar uma Conta de Serviço

1. No menu lateral, vá para "APIs e Serviços" > "Credenciais"
2. Clique em "Criar Credenciais" > "Conta de Serviço"
3. Dê um nome à conta de serviço (ex: "sistema-gestao-drive")
4. Opcionalmente, adicione uma descrição
5. Clique em "Criar e Continuar"
6. Na seção de permissões, selecione o papel "Editor" para dar acesso de escrita
7. Clique em "Continuar" e depois em "Concluído"

### 4. Criar uma Chave para a Conta de Serviço

1. Na lista de contas de serviço, clique na conta que você acabou de criar
2. Vá para a aba "Chaves"
3. Clique em "Adicionar Chave" > "Criar Nova Chave"
4. Selecione o formato "JSON"
5. Clique em "Criar"
6. Um arquivo JSON será baixado automaticamente - guarde-o com segurança!

### 5. Criar uma Pasta no Google Drive

1. Acesse o [Google Drive](https://drive.google.com/)
2. Crie uma nova pasta para armazenar os anexos
3. Anote o ID da pasta (é a parte final da URL quando você abre a pasta)
4. Compartilhe a pasta com o email da conta de serviço que você criou, dando permissão de "Editor"

### 6. Configurar as Variáveis de Ambiente

Adicione as seguintes variáveis ao arquivo `.env.local`:

```
GOOGLE_SERVICE_ACCOUNT_EMAIL="email-da-conta-de-servico@seu-projeto.iam.gserviceaccount.com"
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSua chave privada aqui\n-----END PRIVATE KEY-----"
GOOGLE_DRIVE_DEFAULT_FOLDER_ID="id_da_pasta_no_google_drive"
```

Notas:
- Para o `GOOGLE_SERVICE_ACCOUNT_EMAIL`, use o email da conta de serviço que você criou
- Para o `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, copie todo o conteúdo do arquivo JSON baixado, procurando pelo campo `private_key`
- Para o `GOOGLE_DRIVE_DEFAULT_FOLDER_ID`, use o ID da pasta que você criou no Google Drive

### 7. Atualizar o Banco de Dados

Execute o script SQL `sql/update_anexos_table.sql` para adicionar as colunas necessárias à tabela de anexos.

## Testando a Integração

1. Reinicie o servidor da aplicação
2. Faça login no sistema
3. Tente fazer upload de um arquivo em uma tarefa
4. Verifique se o arquivo aparece na pasta do Google Drive que você configurou

## Solução de Problemas

Se encontrar problemas:

1. Verifique se as credenciais estão corretas no arquivo `.env.local`
2. Confirme que a API do Google Drive está habilitada no projeto
3. Verifique se a pasta do Google Drive está compartilhada corretamente com a conta de serviço
4. Consulte os logs do servidor para ver mensagens de erro detalhadas 