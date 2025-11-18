# MongoDB Atlas Search Indexes

Documentação dos índices de busca configurados no MongoDB Atlas para o projeto TypeScript RAG.

## 📊 Visão Geral

O projeto utiliza **2 índices** no MongoDB Atlas:

1. **fulltext_index** - Busca por texto (keywords)
2. **vector_index** - Busca vetorial semântica (embeddings)

---

## 1. Fulltext Index (Text Search)

### Propósito
Permite busca por **palavras-chave** no texto dos chunks e filtros por metadata.

### Configuração Atual
```json
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "text": {
        "type": "string",
        "analyzer": "lucene.standard"
      },
      "metadata.chapter": {
        "type": "string"
      }
    }
  }
}
```

### Configuração Recomendada (Melhorada)
```json
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "text": {
        "type": "string",
        "analyzer": "lucene.standard"
      },
      "metadata.chapter": {
        "type": "string"
      },
      "metadata.section": {
        "type": "string"
      },
      "metadata.type": {
        "type": "string"
      }
    }
  }
}
```

### Campos

| Campo | Tipo | Descrição | Uso |
|-------|------|-----------|-----|
| `text` | string | Texto completo do chunk | Busca principal |
| `metadata.chapter` | string | Capítulo (ex: "Chapter 4") | Filtro |
| `metadata.section` | string | Seção (ex: "Section 4.2") | Filtro (novo) |
| `metadata.type` | string | Tipo (code/example/explanation) | Filtro (novo) |

### Analyzer

- **lucene.standard**: Tokeniza palavras, remove pontuação, lowercase
- **Ideal para**: Texto técnico em inglês
- **Alternativas**:
  - `lucene.english` - Remove stop words em inglês
  - `lucene.keyword` - Termo exato (sem tokenização)

### Casos de Uso

```javascript
// Busca simples
{ text: "generics in typescript" }

// Com filtro por capítulo
{ text: "generics", chapter: "Chapter 4" }

// Com filtro por tipo (requer config melhorada)
{ text: "generics", type: "code" }

// Filtro combinado (requer config melhorada)
{ text: "generics", chapter: "Chapter 4", type: "example" }
```

---

## 2. Vector Index (Vector Search)

### Propósito
Permite busca por **similaridade semântica** usando embeddings (3072 dimensões).

### Configuração
```json
{
  "fields": [
    {
      "numDimensions": 3072,
      "path": "embedding",
      "similarity": "cosine",
      "type": "vector"
    },
    {
      "path": "metadata.type",
      "type": "filter"
    },
    {
      "path": "metadata.chapter",
      "type": "filter"
    },
    {
      "path": "metadata.section",
      "type": "filter"
    },
    {
      "path": "metadata.page",
      "type": "filter"
    },
    {
      "path": "metadata.bookTitle",
      "type": "filter"
    }
  ]
}
```

### Campos

| Campo | Tipo | Descrição | Uso |
|-------|------|-----------|-----|
| `embedding` | vector | Embedding do chunk (3072d) | Busca vetorial |
| `metadata.type` | filter | Tipo do chunk | Pre-filtro |
| `metadata.chapter` | filter | Capítulo | Pre-filtro |
| `metadata.section` | filter | Seção | Pre-filtro |
| `metadata.page` | filter | Número da página | Pre-filtro |
| `metadata.bookTitle` | filter | Título do livro | Pre-filtro |

### Parâmetros

- **numDimensions**: 3072 (tamanho do embedding Gemini)
- **similarity**: cosine (similaridade do cosseno)
- **type**: vector (índice vetorial kNN)

### Casos de Uso

```javascript
// Busca vetorial simples
{ vector: [0.1, 0.2, ...], k: 10 }

// Com pre-filtro por tipo
{ vector: [...], k: 10, filter: { type: "code" } }

// Com pre-filtro por capítulo
{ vector: [...], k: 10, filter: { chapter: "Chapter 4" } }

// Filtros combinados
{
  vector: [...],
  k: 10,
  filter: {
    chapter: "Chapter 4",
    type: "example"
  }
}
```

---

## 🔄 Hybrid Search

Combina **text search** + **vector search** para melhores resultados.

### Como Funciona

1. **Vector Search**: Encontra chunks semanticamente similares
2. **Text Search**: Encontra chunks com keywords específicas
3. **Merge**: Combina e re-rankeia os resultados

### Configuração no Backend

Ver: `src/modules/rag/services/vector-store.service.ts`

```typescript
// Exemplo de hybrid search
const results = await vectorStore.hybridSearch(query, {
  k: 10,
  textWeight: 0.3,    // 30% text search
  vectorWeight: 0.7,  // 70% vector search
  filter: { type: "code" }
})
```

---

## 📈 Estatísticas

**Collection**: `ts_rag.embeddings`

| Métrica | Valor |
|---------|-------|
| Total documentos | 1001/1180 |
| Storage size | ~82 MB |
| Logical size | ~41 MB |
| Fulltext index | ~973 KB |
| Vector index | ~11.83 MB |

**Distribuição por tipo:**
- code: 39.8%
- example: 35.0%
- explanation: 25.0%
- reference: 0.3%

---

## 🔧 Atualizando Índices

### Via MongoDB Atlas UI

1. Acesse: https://cloud.mongodb.com
2. Database → Browse Collections
3. Selecione: `ts_rag` → `embeddings`
4. Clique em: **Search Indexes**
5. Clique em: **Edit** no índice desejado
6. Cole a nova configuração JSON
7. Clique em: **Save Changes**
8. Aguarde ~30s-1min para reindexação

### Verificar Status

```bash
pnpm inspect
```

---

## 📚 Referências

- [MongoDB Atlas Search](https://www.mongodb.com/docs/atlas/atlas-search/)
- [Atlas Vector Search](https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-overview/)
- [Analyzers](https://www.mongodb.com/docs/atlas/atlas-search/analyzers/)
- [Hybrid Search](https://www.mongodb.com/docs/atlas/atlas-vector-search/tutorials/hybrid-search/)
