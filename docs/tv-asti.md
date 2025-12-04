# Módulo TV ASTI

O módulo de gestão da TV interativa permite cadastrar cards visuais (com imagem) e notícias rápidas em texto. Dependendo do tipo do conteúdo, o registro é salvo em tabelas distintas para facilitar o consumo no player da TV.

## Modelo de dados

O banco `u711845530_tv_asti` já possui as tabelas abaixo, reutilizadas pelo módulo:

```sql
CREATE TABLE conteudos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(60) NOT NULL,
  descricao VARCHAR(120) NOT NULL,
  nome_autor VARCHAR(255) NOT NULL,
  email_autor VARCHAR(255) NOT NULL,
  dt_publicacao DATETIME NOT NULL,
  id_anexo INT NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3;

CREATE TABLE anexo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conteudos_id INT NOT NULL,
  nome_arquivo VARCHAR(255) NOT NULL,
  caminho_arquivo VARCHAR(255) NOT NULL,
  google_drive_id VARCHAR(255) NOT NULL,
  google_drive_link VARCHAR(512) NOT NULL,
  tipo_arquivo VARCHAR(100) NOT NULL,
  tamanho_bytes BIGINT NOT NULL,
  dt_upload DATETIME NOT NULL,
  usuario_email VARCHAR(255) NOT NULL,
  conteudo_arquivo LONGTEXT NOT NULL,
  KEY (conteudos_id)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3;
```

- Notícias em texto são salvas em `conteudos` com `id_anexo = 0`.
- Cards com imagem criam um registro em `anexo` (armazenando base64 + metadados) e depois atualizam `conteudos.id_anexo` com o ID do anexo.

## Endpoints

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `GET` | `/api/tv-asti/itens` | Retorna `{ news, contents }` com as duas listas ordenadas por `dt_publicacao`. |
| `POST` | `/api/tv-asti/itens` | Recebe os dados do formulário e decide se cria somente o `conteudo` ou também o `anexo`. Requer autenticação. |
| `DELETE` | `/api/tv-asti/itens/:type/:id` | Remove um registro (`type = news | media`). Requer autenticação. |

O payload do `POST` é inferido automaticamente pelo front-end, mas pode ser enviado manualmente:

### Notícia
```json
{
  "type": "news",
  "title": "Reunião geral",
  "message": "Próxima sexta às 9h."
}
```

### Card com imagem
```json
{
  "type": "media",
  "title": "Campanha Vacinação",
  "description": "Atualize sua carteira até o dia 10.",
  "image": {
    "base64": "<BASE64 SEM PREFIXO>",
    "mimeType": "image/png",
    "fileName": "campanha.png",
    "size": 123456
  }
}
```

## Front-end

- `app/asti/tv-asti/page.tsx` funciona como hub com atalhos para cadastro e consulta.
- `app/asti/tv-asti/cadastro/page.tsx` contém o formulário (`TvAstiForm`) com validação e upload (preview).
- `app/asti/tv-asti/consulta/page.tsx` utiliza `TvAstiList` para listar notícias e cards, permitindo exclusão rápida e refresh.

Sempre que um item é criado ou excluído, a listagem dispara `GET /api/tv-asti/itens` para manter o painel sincronizado.
