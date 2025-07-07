# Sistema de Emails de Exceção para Privilégios de Chefia

## Visão Geral

O sistema permite que emails específicos tenham privilégios de chefia independentemente da estrutura hierárquica formal ou cargo no banco de dados. Isso é útil para situações onde certas pessoas precisam ter acesso administrativo sem necessariamente estar formalmente designadas como chefes.

## Como Configurar

### 1. Editar o arquivo de configuração

Abra o arquivo `lib/auth-config.ts` e edite a array `EXCEPTION_EMAILS_CHEFIA`:

```typescript
export const EXCEPTION_EMAILS_CHEFIA: string[] = [
  'admin@empresa.com',
  'diretor@empresa.com', 
  'coordenador.especial@empresa.com',
  'supervisor.ti@empresa.com'
];
```

### 2. Exemplo prático

Para adicionar emails de exceção no seu sistema:

```typescript
export const EXCEPTION_EMAILS_CHEFIA: string[] = [
  'joao.silva@epamig.br',
  'maria.santos@epamig.br',
  'supervisor.ti@epamig.br'
];
```

## Funcionalidades Habilitadas

Usuários com emails na lista de exceção terão acesso a:

- ✅ **Gerenciar Projetos**: Criar, editar e excluir projetos
- ✅ **Editar Tarefas**: Modificar qualquer tarefa do sistema
- ✅ **Visualizar todas as seções**: Acesso cross-departamental
- ✅ **Atribuir responsáveis**: Designar pessoas para tarefas
- ✅ **Aprovar/Rejeitar**: Privilégios de aprovação

## Verificação de Privilégios

O sistema verifica privilégios de chefia na seguinte ordem:

1. **Email de exceção** (prioridade mais alta)
2. **Campo chefia** preenchido no banco de dados
3. **Cargo contém "CHEFE"** no nome

## Funções de Gerenciamento Programático

### Adicionar email dinamicamente
```typescript
import { addExceptionEmailChefia } from '@/lib/auth-config';

addExceptionEmailChefia('novo.admin@empresa.com');
```

### Remover email dinamicamente
```typescript
import { removeExceptionEmailChefia } from '@/lib/auth-config';

removeExceptionEmailChefia('antigo.admin@empresa.com');
```

### Verificar se é email de exceção
```typescript
import { isExceptionEmailChefia } from '@/lib/auth-config';

const temPrivilegio = isExceptionEmailChefia('usuario@empresa.com');
```

## Segurança

- ⚠️ **Importante**: Mantenha a lista atualizada removendo emails de funcionários que não trabalham mais na empresa
- 🔒 **Controle de acesso**: Apenas administradores devem ter acesso para editar este arquivo
- 📝 **Auditoria**: Considere registrar alterações nesta lista para auditoria

## Troubleshooting

### Usuário não consegue acessar mesmo estando na lista
1. Verifique se o email está escrito corretamente (case-insensitive)
2. Certifique-se que não há espaços extras
3. Reinicie o servidor após alterações no arquivo

### Como testar
1. Faça login com o usuário
2. Tente acessar a funcionalidade "Projetos"
3. Verifique se consegue editar/excluir projetos

## Exemplo de Implementação

```typescript
// Em lib/auth-config.ts
export const EXCEPTION_EMAILS_CHEFIA: string[] = [
  'admin@epamig.br',
  'diretor.geral@epamig.br',
  'coordenador.ti@epamig.br'
];
```

Este sistema garante flexibilidade na gestão de permissões mantendo a segurança e controle adequados. 