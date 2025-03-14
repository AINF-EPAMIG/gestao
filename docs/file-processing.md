# Processamento de Arquivos Grandes

Este documento explica como o sistema lida com o upload de arquivos grandes para anexos de tarefas.

## Problema

Ao anexar arquivos extensos a uma tarefa, o sistema gerava erros devido a limitações de tamanho no upload ou no armazenamento no Google Drive.

## Solução

Implementamos um sistema de processamento automático de arquivos grandes que:

1. Detecta automaticamente quando um arquivo excede o tamanho máximo permitido (10MB)
2. Tenta primeiro compactar o arquivo usando a biblioteca JSZip
3. Se o arquivo compactado ainda for grande demais, divide-o em partes menores (1MB cada)
4. Envia os arquivos processados para o servidor

## Como funciona

### Fluxo de processamento

1. Quando um usuário seleciona um arquivo para upload, o sistema verifica seu tamanho
2. Se o arquivo for maior que o limite (10MB), ele é processado automaticamente:
   - Primeiro, o arquivo é compactado usando JSZip
   - Se o arquivo compactado ainda for maior que o limite, ele é dividido em partes menores
3. O usuário vê uma mensagem indicando que o arquivo foi processado
4. Os arquivos processados são enviados para o servidor normalmente

### Arquivos e componentes modificados

- `lib/file-utils.ts`: Contém as funções de processamento de arquivos
- `components/file-upload.tsx`: Componente de upload modificado para processar arquivos grandes
- `components/create-task-modal.tsx`: Modificado para processar arquivos ao criar tarefas

### Configurações

- **Tamanho máximo para upload direto**: 10MB
- **Tamanho máximo para cada parte**: 1MB

## Testes

Foi criada uma página de teste em `/test-file-processing` que permite:

1. Selecionar um arquivo
2. Ver informações sobre o arquivo
3. Processar o arquivo manualmente
4. Ver o resultado do processamento

## Limitações

- Arquivos divididos são enviados como partes separadas e não são automaticamente reunidos no download
- A compactação funciona melhor para certos tipos de arquivos (texto, documentos) do que para outros (imagens, vídeos)

## Dependências

- JSZip: Biblioteca para compactação de arquivos
- File-Saver: Biblioteca para manipulação de downloads (opcional) 