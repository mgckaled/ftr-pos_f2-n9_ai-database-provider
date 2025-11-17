# TypeScript RAG - Arquitetura com MongoDB Atlas

## Decisão: MongoDB Atlas em vez de PostgreSQL + ChromaDB

### Vantagens do MongoDB Atlas

#### 1. **Vector Search Nativo**
- ✅ **Tudo em um só lugar**: Conversas + Embeddings no mesmo banco
- ✅ **Atlas Vector Search**: Vector store integrado, sem necessidade de ChromaDB
- ✅ **Hybrid Search**: Combina vector search + full-text search (BM25) nativamente
- ✅ **Metadata Filtering**: Filtros nativos em queries vetoriais

#### 2. **Estrutura Natural para Chat**
```javascript
// Documento MongoDB - estrutura natural:
{
  _id: ObjectId("..."),
  title: "Como usar generics?",
  createdAt: ISODate("2025-01-17"),
  messages: [
    {
      role: "user",
      content: "Como funcionam generics no TypeScript?",
      timestamp: ISODate("...")
    },
    {
      role: "assistant",
      content: "Generics no TypeScript...",
      metadata: {
        sources: [
          { page: 145, chapter: "Chapter 5", relevance: 0.92 }
        ]
      },
      timestamp: ISODate("...")
    }
  ]
}
```

#### 3. **Vector Search Features**
- ✅ Cosine, Euclidean, dotProduct similarity
- ✅ Pre-filtering com metadata
- ✅ Relevance scores automáticos
- ✅ Pagination nativa
- ✅ Index otimizado para queries

#### 4. **Custo Zero**
- ✅ MongoDB Atlas Free Tier (512MB)
- ✅ Suficiente para:
  - ~500-700 chunks do PDF (~3-4MB)
  - Histórico de conversas ilimitado
  - Embeddings (1536 dims × 500 chunks = ~3MB)

## Arquitetura Proposta

### Coleções MongoDB

```typescript
// Collection: conversations
{
  _id: ObjectId,
  title: string,
  createdAt: Date,
  updatedAt: Date,
  messages: [
    {
      _id: ObjectId,
      role: 'user' | 'assistant',
      content: string,
      metadata?: {
        sources?: [
          {
            page: number,
            chapter: string,
            relevance: number,
            content: string // snippet do chunk
          }
        ]
      },
      createdAt: Date
    }
  ]
}

// Collection: embeddings (chunks do PDF)
{
  _id: ObjectId,
  text: string, // Conteúdo do chunk
  embedding: number[], // Vector de 1536 dimensões (Gemini)
  metadata: {
    page: number,
    chapter: string,
    section?: string,
    type: 'code' | 'explanation' | 'example' | 'reference',
    bookTitle: 'Essential TypeScript 5'
  },
  createdAt: Date
}
```

### Vector Search Index (embeddings collection)

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1536,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "metadata.type"
    },
    {
      "type": "filter",
      "path": "metadata.chapter"
    },
    {
      "type": "filter",
      "path": "metadata.page"
    }
  ]
}
```

### Full-Text Search Index (embeddings collection)

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

## Stack Tecnológica Atualizada

### Dependências

```json
{
  "dependencies": {
    "mongodb": "^6.0.0",
    "@langchain/mongodb": "^0.1.0",
    "@langchain/google-genai": "^1.0.1",
    "@langchain/community": "^1.0.3",
    "@langchain/core": "^1.0.5",
    "@langchain/textsplitters": "^1.0.0",
    "pdf-parse": "^1.1.1",
    "fastify": "^5.6.0",
    "fastify-type-provider-zod": "^6.0.0",
    "@fastify/cors": "^11.0.0",
    "@scalar/fastify-api-reference": "^1.39.0",
    "zod": "^3.23.8",
    "lru-cache": "^11.0.0",
    "dotenv": "^16.4.5"
  },
  "devDependencies": {
    "typescript": "^5.9.0",
    "tsx": "^4.0.0",
    "@types/node": "^22.0.0",
    "@types/pdf-parse": "^1.1.0"
  }
}
```

**Removido:**
- ❌ `chromadb` (substituído por MongoDB Atlas Vector Search)
- ❌ `@prisma/client` + `prisma` (substituído por MongoDB native driver)

**Adicionado:**
- ✅ `mongodb` - Driver nativo
- ✅ `@langchain/mongodb` - LangChain MongoDB integration

## Fluxo de Implementação

### Fase 1: Setup MongoDB Atlas

1. ✅ Criar cluster gratuito no MongoDB Atlas
2. ✅ Criar database `ts_rag`
3. ✅ Criar collections: `conversations`, `embeddings`
4. ✅ Configurar Vector Search Index
5. ✅ Configurar Full-Text Search Index
6. ✅ Obter connection string

### Fase 2: Processamento do PDF

```typescript
// Script: scripts/process-pdf.ts
import { MongoClient } from 'mongodb'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai'

// 1. Extrair PDF
const pdfText = await extractPDF('data/essential-typescript-5.pdf')

// 2. Chunking com metadata
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
})

const chunks = await splitter.createDocuments([pdfText])

// 3. Adicionar metadata
const chunksWithMetadata = chunks.map((chunk, i) => ({
  text: chunk.pageContent,
  metadata: {
    page: extractPageNumber(chunk),
    chapter: extractChapter(chunk),
    type: classifyType(chunk.pageContent),
    bookTitle: 'Essential TypeScript 5'
  }
}))

// 4. Gerar embeddings (Gemini)
const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: 'text-embedding-004'
})

// 5. Inserir no MongoDB com rate limiting
const client = new MongoClient(process.env.MONGODB_URI)
const collection = client.db('ts_rag').collection('embeddings')

for (const chunk of chunksWithMetadata) {
  const embedding = await embeddings.embedQuery(chunk.text)

  await collection.insertOne({
    text: chunk.text,
    embedding,
    metadata: chunk.metadata,
    createdAt: new Date()
  })

  await sleep(600) // Rate limiting: ~90 chunks/min
}
```

### Fase 3: RAG Engine

#### Hybrid Retrieval (Vector + BM25)

```typescript
import { MongoDBAtlasVectorSearch } from '@langchain/mongodb'

class RAGService {
  private vectorStore: MongoDBAtlasVectorSearch
  private collection: Collection

  async initializeVectorStore() {
    const client = new MongoClient(process.env.MONGODB_URI)
    const collection = client.db('ts_rag').collection('embeddings')

    this.vectorStore = new MongoDBAtlasVectorSearch(
      collection,
      embeddings,
      {
        indexName: 'vector_index',
        textKey: 'text',
        embeddingKey: 'embedding'
      }
    )
  }

  async hybridRetrieval(query: string, options?: {
    type?: string
    chapter?: string
    topK?: number
  }) {
    const { type, chapter, topK = 5 } = options || {}

    // 1. Vector Search com metadata filtering
    const vectorResults = await this.vectorStore.similaritySearchWithScore(
      query,
      topK * 2, // Busca mais para filtrar
      {
        preFilter: {
          ...(type && { 'metadata.type': type }),
          ...(chapter && { 'metadata.chapter': chapter })
        }
      }
    )

    // 2. Full-Text Search (BM25) via MongoDB aggregation
    const ftsResults = await this.collection.aggregate([
      {
        $search: {
          index: 'fulltext_index',
          text: {
            query,
            path: 'text'
          }
        }
      },
      {
        $limit: topK
      },
      {
        $project: {
          text: 1,
          metadata: 1,
          score: { $meta: 'searchScore' }
        }
      }
    ]).toArray()

    // 3. Reciprocal Rank Fusion
    return this.reciprocalRankFusion(vectorResults, ftsResults, topK)
  }

  private reciprocalRankFusion(
    vectorResults: any[],
    ftsResults: any[],
    k: number
  ) {
    const scores = new Map<string, number>()
    const constant = 60

    // Score de vector results
    vectorResults.forEach(([doc, score], index) => {
      const id = doc._id.toString()
      scores.set(id, (scores.get(id) || 0) + 1 / (constant + index + 1))
    })

    // Score de FTS results
    ftsResults.forEach((doc, index) => {
      const id = doc._id.toString()
      scores.set(id, (scores.get(id) || 0) + 1 / (constant + index + 1))
    })

    // Ordena e retorna top-k
    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, k)
      .map(([id]) => {
        return vectorResults.find(([doc]) => doc._id.toString() === id)?.[0] ||
               ftsResults.find(doc => doc._id.toString() === id)
      })
  }
}
```

#### Cache LRU

```typescript
import { LRUCache } from 'lru-cache'

class RAGService {
  private cache: LRUCache<string, string>

  constructor() {
    this.cache = new LRUCache({
      max: 100,
      maxSize: 5 * 1024 * 1024, // 5 MB
      sizeCalculation: (value) => value.length * 2,
      ttl: 1000 * 60 * 60 * 24 // 24h
    })
  }

  async chat(query: string, conversationId?: string) {
    // Normaliza query para cache
    const cacheKey = query.toLowerCase().trim().replace(/\s+/g, ' ')

    // Verifica cache (apenas se não for conversa contextual)
    if (!conversationId) {
      const cached = this.cache.get(cacheKey)
      if (cached) {
        console.log('✅ Cache HIT:', query)
        return { content: cached, metadata: { fromCache: true } }
      }
    }

    // Gera resposta
    const response = await this.generateResponse(query, conversationId)

    // Salva em cache
    if (!conversationId) {
      this.cache.set(cacheKey, response.content)
    }

    return response
  }
}
```

### Fase 4: Histórico de Conversas

```typescript
class ConversationService {
  private collection: Collection

  async createConversation(firstMessage: string) {
    const title = firstMessage.length > 50
      ? firstMessage.substring(0, 47) + '...'
      : firstMessage

    const result = await this.collection.insertOne({
      title,
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: []
    })

    return result.insertedId
  }

  async addMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: any
  ) {
    await this.collection.updateOne(
      { _id: new ObjectId(conversationId) },
      {
        $push: {
          messages: {
            _id: new ObjectId(),
            role,
            content,
            metadata,
            createdAt: new Date()
          }
        },
        $set: { updatedAt: new Date() }
      }
    )
  }

  async getHistory(conversationId: string, limit = 10) {
    const conversation = await this.collection.findOne(
      { _id: new ObjectId(conversationId) },
      {
        projection: {
          messages: { $slice: -limit }
        }
      }
    )

    return conversation?.messages || []
  }

  async listConversations(page = 1, limit = 20) {
    return this.collection
      .find({}, {
        projection: {
          _id: 1,
          title: 1,
          createdAt: 1,
          updatedAt: 1,
          'messages': { $slice: -1 } // Última mensagem apenas
        }
      })
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray()
  }
}
```

## Comparação: MongoDB vs PostgreSQL+ChromaDB

| Característica | MongoDB Atlas | PostgreSQL + ChromaDB |
|----------------|---------------|----------------------|
| **Vector Store** | ✅ Nativo (Atlas Vector Search) | ⚠️ ChromaDB separado |
| **Hybrid Search** | ✅ Nativo (Vector + FTS) | ❌ Precisa implementar RRF |
| **Schema** | ✅ Flexível (JSON nativo) | ⚠️ Rígido (schema SQL) |
| **Metadata Filtering** | ✅ Nativo em queries | ⚠️ Precisa WHERE clauses |
| **Embedded Documents** | ✅ Nativo (messages dentro de conversation) | ❌ JOIN necessário |
| **Free Tier** | ✅ 512MB | ✅ Ilimitado (local) |
| **Setup** | ✅ Cloud-based (zero config) | ⚠️ PostgreSQL local + ChromaDB |
| **ORM** | ✅ Native driver | ⚠️ Prisma |
| **Relevance Scores** | ✅ Automático ($meta) | ⚠️ Manual |
| **Full-Text Search** | ✅ Nativo (BM25) | ⚠️ PostgreSQL FTS |

## Estimativa de Espaço

### MongoDB Atlas Free Tier: 512MB

**Embeddings Collection:**
- 500 chunks × 8KB (text + embedding + metadata) = ~4MB
- ✅ Cabe tranquilamente

**Conversations Collection:**
- 1000 conversas × 50KB (histórico médio) = ~50MB
- ✅ Cabe tranquilamente

**Total estimado**: ~60-100MB (muito abaixo do limite)

## Decisão Final

✅ **MongoDB Atlas é a escolha ideal porque:**

1. ✅ **Simplifica arquitetura**: 1 banco em vez de 2 (PostgreSQL + ChromaDB)
2. ✅ **Hybrid Search nativo**: Não precisa implementar RRF manualmente
3. ✅ **Metadata filtering nativo**: Queries mais simples
4. ✅ **Schema natural**: Conversas com mensagens aninhadas
5. ✅ **Free tier generoso**: 512MB é mais do que suficiente
6. ✅ **Zero setup**: Cloud-based, sem instalação local
7. ✅ **LangChain suporta**: `@langchain/mongodb` oficial

**Desvantagem aceita:**
- ⚠️ Menos SQL familiar (mas TypeScript + MongoDB é comum)
- ⚠️ Cloud-only para free tier (mas é vantagem também)

## Próximos Passos

1. ✅ Criar conta MongoDB Atlas
2. ✅ Configurar cluster free tier
3. ✅ Criar indexes (vector + full-text)
4. ✅ Atualizar `.env` com connection string
5. ✅ Continuar implementação
