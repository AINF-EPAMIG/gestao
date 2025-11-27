# Módulo de Gestão de Sistemas

## Descrição
Módulo para gerenciamento dos sistemas internos da organização. Permite cadastrar, visualizar, editar e controlar informações sobre sistemas, sites, APIs, rotinas e aplicativos mobile desenvolvidos internamente.

## Estrutura

### Arquivos Criados

1. **`app/asti/gestao-sistema/page.tsx`**
   - Página principal do módulo
   - Interface completa de CRUD para sistemas
   - Listagem em cards com filtros
   - Formulário de cadastro/edição
   - Visualização detalhada

2. **`app/api/projetos/route.ts`** (atualizado)
   - API REST completa para gerenciar a tabela `projetos`
   - Endpoints: GET, POST, PUT, DELETE
   - Suporte a todos os campos da tabela
   - Compatibilidade retroativa mantida

3. **`types/sistema.ts`**
   - Definições TypeScript para Sistema
   - Interface `Sistema` completa
   - Interface `SistemaFormData` para formulários

4. **`components/sistema-details-dialog.tsx`**
   - Componente de visualização detalhada
   - Modal com todas as informações do sistema
   - Links externos funcionais
   - Informações de auditoria

5. **`hooks/use-toast.ts`**
   - Hook customizado para notificações
   - Feedback ao usuário após operações

## Banco de Dados

### Tabela: `projetos`
**Banco:** `u711845530_gestao`

#### Campos:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | int | Chave primária |
| nome | varchar(200) | Nome do sistema |
| sigla | varchar(50) | Sigla ou abreviação |
| tipo | enum | Sistema, Site, API, Rotina, Mobile |
| status | enum | Ideia, Desenvolvimento, Produção, Manutenção, Descontinuado |
| objetivo | longtext | Descrição do objetivo |
| setor_id | int | ID do setor responsável |
| tecnologia_principal | varchar(200) | Tecnologia utilizada |
| repositorio_git | varchar(500) | URL do repositório |
| url_producao | varchar(500) | URL de produção |
| url_homologacao | varchar(500) | URL de homologação |
| servidor | varchar(200) | Servidor de hospedagem |
| banco_dados | varchar(300) | Banco de dados utilizado |
| sistemas_integrados | longtext | Sistemas com integração |
| rotinas_principais | longtext | Principais rotinas |
| url_documentacao | varchar(500) | URL da documentação |
| observacoes | longtext | Observações gerais |
| quem_cadastrou | varchar(150) | Usuário que cadastrou |
| quem_editou | varchar(150) | Último usuário que editou |
| data_inicio | date | Data de início do projeto |
| created_at | timestamp | Data de criação |
| updated_at | timestamp | Data de atualização |

## Funcionalidades

### 1. Listagem de Sistemas
- Cards visuais com informações principais
- Badges coloridos para tipo e status
- Links rápidos para produção e repositório
- Botões de ação (visualizar, editar, excluir)

### 2. Cadastro de Sistema
- Formulário completo com todos os campos
- Validações no frontend
- Campos obrigatórios e opcionais
- Tipos e status pré-definidos

### 3. Edição de Sistema
- Carregamento dos dados existentes
- Atualização parcial ou completa
- Registro de quem editou

### 4. Visualização Detalhada
- Modal com todas as informações
- Seções organizadas:
  - Informações básicas
  - Informações técnicas
  - Links e repositórios
  - Integrações
  - Rotinas principais
  - Observações
  - Auditoria (criação e edição)

### 5. Exclusão de Sistema
- Confirmação antes de excluir
- Remoção do banco de dados

## Tipos de Sistema

- **Sistema**: Aplicações web completas
- **Site**: Sites institucionais ou informativos
- **API**: APIs REST ou GraphQL
- **Rotina**: Scripts e rotinas automatizadas
- **Mobile**: Aplicativos mobile (Android/iOS)

## Status do Sistema

- **Ideia**: Projeto em fase de concepção
- **Desenvolvimento**: Em desenvolvimento ativo
- **Produção**: Em produção, funcionando
- **Manutenção**: Em manutenção ou com atualizações esporádicas
- **Descontinuado**: Sistema descontinuado

## API Endpoints

### GET `/api/projetos`
Busca todos os projetos

**Query Parameters:**
- `type=full`: Retorna todos os campos
- `includeTaskCount=true`: Inclui contagem de tarefas

**Resposta:**
```json
[
  {
    "id": 1,
    "nome": "Sistema de Gestão",
    "sigla": "SG",
    "tipo": "Sistema",
    "status": "Produção",
    ...
  }
]
```

### POST `/api/projetos`
Cria um novo projeto

**Body:**
```json
{
  "nome": "Novo Sistema",
  "sigla": "NS",
  "tipo": "Sistema",
  "status": "Ideia",
  "objetivo": "Descrição do objetivo",
  ...
}
```

### PUT `/api/projetos`
Atualiza um projeto existente

**Body:**
```json
{
  "id": 1,
  "nome": "Sistema Atualizado",
  ...
}
```

### DELETE `/api/projetos?id={id}`
Exclui um projeto

## Acesso

Para acessar o módulo, navegue até:
```
/asti/gestao-sistema
```

## Próximas Melhorias

- [ ] Filtros avançados (por tipo, status, tecnologia)
- [ ] Busca por nome/sigla
- [ ] Exportação de dados (CSV, Excel)
- [ ] Gráficos e estatísticas
- [ ] Histórico de alterações
- [ ] Upload de logo/ícone do sistema
- [ ] Gestão de versões
- [ ] Notificações sobre atualizações
- [ ] Integração com GitHub/GitLab para informações do repositório
- [ ] Dashboard com métricas dos sistemas

## Observações Técnicas

1. A API mantém compatibilidade com o código antigo que só usava o campo `nome`
2. O campo `setor_id` está preparado para integração futura com a tabela de setores
3. Timestamps são gerenciados automaticamente pelo banco
4. Os campos de auditoria registram quem criou/editou via sessão do NextAuth
