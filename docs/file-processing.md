# Processamento de Arquivos Grandes

Este documento explica como o sistema lida com o upload de arquivos grandes para anexos de tarefas.

## Problema

Ao anexar arquivos extensos a uma tarefa, o sistema gerava erros devido a limitações de tamanho no upload ou no armazenamento no Google Drive.

## Solução

Implementamos um sistema de processamento automático de arquivos grandes que:

1. Detecta automaticamente quando um arquivo excede o tamanho máximo permitido (10MB)
2. Compacta o arquivo usando a biblioteca JSZip para reduzir seu tamanho
3. Envia o arquivo compactado para o servidor

## Restrições de Upload

Para garantir o funcionamento adequado do sistema e evitar o envio de múltiplos arquivos de uma vez, as seguintes restrições foram implementadas:

1. **Limite de um arquivo por vez**: Só é permitido selecionar e enviar um arquivo por vez
2. **Bloqueio de arquivos compactados**: Arquivos ZIP, RAR, 7Z e outros formatos compactados são bloqueados, pois podem conter múltiplos arquivos
3. **Limite de 10 anexos por tarefa**: Cada tarefa pode ter no máximo 10 arquivos anexados
4. **Limite de tamanho após compactação**: Se o arquivo continuar muito grande mesmo após a compactação, será exibido um erro

## Como funciona

### Fluxo de processamento

1. Quando um usuário seleciona um arquivo para upload, o sistema verifica:
   - Se é apenas um arquivo
   - Se não é um arquivo compactado (ZIP, RAR, etc.)
   - Se não excede o limite de anexos por tarefa
2. Se o arquivo for maior que o limite (10MB), ele é processado automaticamente:
   - O arquivo é compactado usando JSZip com nível máximo de compressão
   - Se o arquivo compactado ainda for maior que o limite, um erro é exibido
3. O usuário vê uma mensagem indicando que o arquivo foi compactado
4. O arquivo compactado é enviado para o servidor

### Arquivos e componentes modificados

- `lib/file-utils.ts`: Contém as funções de processamento de arquivos
- `components/file-upload.tsx`: Componente de upload modificado para processar arquivos grandes
- `components/create-task-modal.tsx`: Modificado para processar arquivos ao criar tarefas

### Configurações

- **Tamanho máximo para upload direto**: 10MB
- **Formatos de arquivo compactado bloqueados**: ZIP, RAR, 7Z, TAR, GZ, TGZ

## Testes

Foi criada uma página de teste em `/test-file-processing` que permite:

1. Selecionar um arquivo
2. Ver informações sobre o arquivo
3. Processar o arquivo manualmente
4. Ver o resultado do processamento

## Limitações

- A compactação funciona melhor para certos tipos de arquivos (texto, documentos) do que para outros (imagens, vídeos)
- Arquivos compactados não podem ser enviados, mesmo que contenham apenas um arquivo
- Se um arquivo continuar muito grande mesmo após a compactação, não será possível enviá-lo

## Dependências

- JSZip: Biblioteca para compactação de arquivos 