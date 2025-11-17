# Avaliação e Planejamento - TypeScript RAG Chat

## Visão Geral

Sistema de chat com RAG (Retrieval-Augmented Generation) focado em consultas sobre TypeScript, baseado no PDF "Essential TypeScript 5, Third Edition" (5MB, 620 páginas).

**Veredicto**: ✅ **TOTALMENTE VIÁVEL** com Gemini API Free Tier

---

## Rate Limits - Gemini API (Free Tier)

### Para Embeddings (Processamento do PDF)

**Gemini Embedding:**

- 100 RPM (requests per minute)
- 30.000 TPM (tokens per minute)
- 1.000 RPD (requests per day)

**Estimativa de processamento:**

- PDF: 620 páginas → ~500-700 chunks (1000 tokens cada)
- Tempo de processamento: **7-10 minutos** (one-time, respeitando RPM)
- Estratégia: Processar em batches de 90 chunks/min

### Para Consultas (Chat)

**Gemini 2.0 Flash (Recomendado):**

- 15 RPM
- 1.000.000 TPM ← **Ideal para RAG** (contexto grande)
- 200 RPD

**Alternativa (mais RPD):**

- Gemini 2.5 Flash-Lite: 15 RPM, 250k TPM, 1.000 RPD

---

## Stack Tecnológica

### Backend

```json
{
  "dependencies": {
    "@langchain/google-genai": "^0.1.0",
    "@langchain/community": "^0.3.0",
    "@langchain/core": "^0.3.0",
    "chromadb": "^1.9.0",
    "pdf-parse": "^1.1.1",
    "fastify": "^5.6.0",
    "zod": "^4.1.0",
    "@fastify/swagger": "^9.0.0",
    "@fastify/cors": "^10.0.0",
    "@scalar/fastify-api-reference": "^2.0.0",
    "@prisma/client": "^6.2.0"
  },
  "devDependencies": {
    "prisma": "^6.2.0",
    "tsx": "^4.0.0",
    "typescript": "^5.8.0",
    "@types/node": "^22.0.0"
  }
}
```

### Banco de Dados

**PostgreSQL 17** para histórico de conversas:

```prisma
model Conversation {
  id        String   @id @default(uuid())
  title     String   // Auto-gerado da primeira pergunta
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  messages  Message[]
}

model Message {
  id             Int      @id @default(autoincrement())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  role           String   // 'user' ou 'assistant'
  content        String   @db.Text
  metadata       Json?    // Retrieved chunks, sources (página, capítulo)
  createdAt      DateTime @default(now())
}
```

**ChromaDB** para vector store (embeddings do PDF):

- Persistência local em disco
- Sem custos adicionais
- Busca vetorial eficiente

---

## Estrutura de Arquivos

```plaintext
src/ts-rag/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   └── chat/
│   │   │       ├── routes.ts              # Endpoints da API
│   │   │       ├── schemas.ts             # Validação Zod
│   │   │       ├── services/
│   │   │       │   ├── rag.service.ts     # RAG engine (retrieval + generation)
│   │   │       │   └── conversation.service.ts
│   │   │       └── repositories/
│   │   │           └── conversation.repository.ts
│   │   ├── plugins/
│   │   │   ├── prisma.ts                  # Prisma client
│   │   │   └── chromadb.ts                # ChromaDB client
│   │   ├── shared/
│   │   │   └── utils/
│   │   │       ├── rate-limiter.ts        # Rate limiting
│   │   │       └── retry.ts               # Exponential backoff
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── server.ts                      # Entry point
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── .env
├── data/
│   ├── essential-typescript-5.pdf         # PDF fonte
│   └── chromadb/                          # Persistência do ChromaDB
├── scripts/
│   └── process-pdf.ts                     # Script de processamento one-time
└── README.md
```

---

## API Endpoints

### Chat

```http
POST /chat/send
Content-Type: application/json

{
  "conversationId": "uuid" | null,  # null = nova conversa
  "message": "Como funcionam generics no TypeScript?"
}

Response:
{
  "success": true,
  "data": {
    "conversationId": "uuid",
    "userMessage": { ... },
    "assistantMessage": {
      "content": "Generics no TypeScript...",
      "metadata": {
        "sources": [
          { "page": 145, "chapter": "Chapter 5", "relevance": 0.92 },
          { "page": 148, "chapter": "Chapter 5", "relevance": 0.87 }
        ]
      }
    }
  }
}
```

### Conversas

```http
GET /conversations?page=1&limit=20
# Lista todas as conversas (para sidebar)

GET /conversations/:id
# Busca conversa específica com histórico completo

DELETE /conversations/:id
# Deleta conversa
```

### Health

```http
GET /health
# Status da API e ChromaDB
```

---

## Roadmap de Implementação

### Fase 1: Setup Inicial (30min)

- [ ] Inicializar projeto TypeScript
- [ ] Configurar Prisma + PostgreSQL
- [ ] Instalar dependências
- [ ] Configurar `.env`

```env
DATABASE_URL="postgresql://user:password@localhost:5432/ts_rag"
GEMINI_API_KEY="your_key_here"
GEMINI_MODEL="gemini-2.0-flash-exp"
GEMINI_EMBEDDING_MODEL="text-embedding-004"
PORT=3333
```

### Fase 2: Processamento do PDF (1-2h)

**Script:** `scripts/process-pdf.ts`

1. Extrair texto do PDF com `pdf-parse`
2. Implementar chunking:

```typescript
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
  separators: ['\n\n', '\n', '. ', ' ', ''],
})
```

3. Adicionar metadata nos chunks:

```typescript
interface ChunkMetadata {
  page: number
  chapter?: string
  section?: string
  type: 'code' | 'explanation' | 'example'
}
```

4. Gerar embeddings com rate limiting:

```typescript
// Batch de 90 chunks/min (respeitando 100 RPM)
for (const batch of chunks) {
  await generateEmbeddings(batch)
  await sleep(600) // 0.6s entre batches
}
```

5. Armazenar em ChromaDB com metadata

### Fase 3: RAG Engine (2-3h)

**Service:** `services/rag.service.ts`

#### 1. Hybrid Retrieval

Combina busca vetorial + keyword search:

```typescript
class RAGService {
  async retrieve(query: string, topK = 5) {
    // 1. Vector similarity (ChromaDB)
    const vectorResults = await this.chromadb.query({
      queryEmbeddings: await this.embed(query),
      nResults: topK * 2, // Busca mais para filtrar depois
    })

    // 2. Keyword search (BM25)
    const keywordResults = await this.bm25Search(query, topK)

    // 3. Rerank combinando scores
    return this.rerank(vectorResults, keywordResults, topK)
  }
}
```

**Vantagens:**

- Vector search: captura similaridade semântica
- Keyword search: captura matches exatos (nomes de APIs, syntax)
- Reranking: melhora precision

#### 2. Metadata Filtering

Filtrar chunks por tipo de conteúdo:

```typescript
async retrieve(query: string, filters?: {
  type?: 'code' | 'explanation' | 'example'
  chapter?: string
  minPage?: number
  maxPage?: number
}) {
  return this.chromadb.query({
    queryEmbeddings: await this.embed(query),
    where: {
      type: filters?.type,
      chapter: filters?.chapter,
      page: { $gte: filters?.minPage, $lte: filters?.maxPage }
    }
  })
}
```

**Uso futuro:**

- "Mostre apenas exemplos de código sobre generics"
- "Explique interfaces do capítulo 3"

#### 3. Prompt Template

```typescript
const SYSTEM_PROMPT = `Você é um assistente especializado em TypeScript.

REGRAS ESTRITAS:
- Responda APENAS sobre TypeScript
- Use APENAS o contexto fornecido dos chunks do livro
- Se a pergunta não for sobre TypeScript, recuse educadamente
- Cite as páginas do livro nas suas respostas

CONTEXTO DO LIVRO:
{context}

HISTÓRICO DA CONVERSA:
{history}

PERGUNTA DO USUÁRIO:
{question}

Responda em português de forma clara e didática.`
```

#### 4. Context Window Management

```typescript
async generateResponse(query: string, conversationId?: string) {
  // 1. Retrieve chunks relevantes (3-5k tokens)
  const chunks = await this.retrieve(query, 5)

  // 2. Buscar histórico (últimas 10 msgs, ~2-3k tokens)
  const history = conversationId
    ? await this.getHistory(conversationId, 10)
    : []

  // 3. Montar prompt (~6-9k tokens total)
  const prompt = this.buildPrompt({
    context: chunks,
    history,
    question: query,
  })

  // 4. Gerar resposta
  return this.gemini.generate(prompt)
}
```

#### 5. Guardrails

```typescript
class RAGService {
  private isTypeScriptRelated(query: string): boolean {
    const keywords = [
      'typescript',
      'ts',
      'type',
      'interface',
      'generic',
      'enum',
      // ... mais keywords
    ]

    const lowercaseQuery = query.toLowerCase()
    return keywords.some((kw) => lowercaseQuery.includes(kw))
  }

  async chat(query: string, conversationId?: string) {
    if (!this.isTypeScriptRelated(query)) {
      return {
        content:
          'Desculpe, só posso responder perguntas sobre TypeScript.',
        metadata: { rejected: true },
      }
    }

    // ... continua com RAG normal
  }
}
```

### Fase 4: API REST (2h)

**Routes:** `modules/chat/routes.ts`

```typescript
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'

const chatRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.post(
    '/send',
    {
      schema: {
        body: z.object({
          conversationId: z.string().uuid().nullable(),
          message: z.string().min(1).max(2000),
        }),
        response: {
          200: ChatResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const response = await chatService.sendMessage(request.body)
      return reply.send(response)
    }
  )
}
```

**Scalar Documentation:**

```typescript
import ScalarApiReference from '@scalar/fastify-api-reference'

await fastify.register(ScalarApiReference, {
  routePrefix: '/docs',
  configuration: {
    spec: {
      content: () => fastify.swagger(),
    },
  },
})
```

### Fase 5: Histórico de Conversas (1-2h)

**Repository:** `repositories/conversation.repository.ts`

```typescript
export class ConversationRepository {
  async create(firstMessage: string) {
    // Auto-gera título da primeira pergunta
    const title = this.generateTitle(firstMessage)

    return prisma.conversation.create({
      data: { title },
    })
  }

  private generateTitle(message: string): string {
    // Trunca para 50 caracteres
    return message.length > 50
      ? message.substring(0, 47) + '...'
      : message
  }

  async addMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: any
  ) {
    return prisma.message.create({
      data: {
        conversationId,
        role,
        content,
        metadata,
      },
    })
  }

  async getHistory(conversationId: string, limit = 10) {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return messages.reverse() // Mais antiga → mais recente
  }
}
```

### Fase 6: Testes (1h)

1. Teste de retrieval accuracy
2. Teste de API endpoints
3. Teste de rate limiting
4. Validação de guardrails

---

## Otimizações Implementadas

### 1. Hybrid Search (Vector + Keyword)

**Implementação:**

```typescript
import { BM25Retriever } from '@langchain/community/retrievers/bm25'

class RAGService {
  private bm25Retriever: BM25Retriever

  async initializeBM25(documents: Document[]) {
    this.bm25Retriever = BM25Retriever.fromDocuments(documents, {
      k: 5, // Top-k results
    })
  }

  async hybridRetrieval(query: string, topK = 5) {
    // 1. Vector search (semântico)
    const vectorResults = await this.vectorSearch(query, topK * 2)

    // 2. Keyword search (BM25)
    const keywordResults = await this.bm25Retriever.getRelevantDocuments(
      query
    )

    // 3. Reciprocal Rank Fusion (RRF) para combinar
    return this.reciprocalRankFusion(
      vectorResults,
      keywordResults,
      topK
    )
  }

  private reciprocalRankFusion(
    vectorResults: Document[],
    keywordResults: Document[],
    k: number,
    constant = 60
  ): Document[] {
    const scores = new Map<string, number>()

    // Score dos vector results
    vectorResults.forEach((doc, index) => {
      const id = doc.metadata.id
      scores.set(id, (scores.get(id) || 0) + 1 / (constant + index + 1))
    })

    // Score dos keyword results
    keywordResults.forEach((doc, index) => {
      const id = doc.metadata.id
      scores.set(id, (scores.get(id) || 0) + 1 / (constant + index + 1))
    })

    // Ordena por score combinado
    const rankedDocs = [...scores.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, k)
      .map(([id]) => {
        return (
          vectorResults.find((d) => d.metadata.id === id) ||
          keywordResults.find((d) => d.metadata.id === id)
        )
      })
      .filter(Boolean)

    return rankedDocs as Document[]
  }
}
```

**Benefícios:**

- ✅ Captura consultas semânticas: "Como tipar funções assíncronas?"
- ✅ Captura matches exatos: "Promise<T>", "async/await"
- ✅ Melhor precision: combina o melhor dos dois mundos

### 2. Cache de Respostas em Memória

**Implementação com LRU Cache:**

```typescript
import { LRUCache } from 'lru-cache'

class RAGService {
  private responseCache: LRUCache<string, string>

  constructor() {
    this.responseCache = new LRUCache({
      max: 100, // Máximo de 100 perguntas em cache
      maxSize: 5 * 1024 * 1024, // 5 MB total
      sizeCalculation: (value) => value.length * 2, // ~2 bytes por char (UTF-16)
      ttl: 1000 * 60 * 60 * 24, // 24 horas
    })
  }

  async chat(query: string, conversationId?: string) {
    // Gera hash da query (normalizada)
    const cacheKey = this.normalizeQuery(query)

    // Verifica cache
    const cached = this.responseCache.get(cacheKey)
    if (cached) {
      console.log('✅ Cache HIT:', query)
      return {
        content: cached,
        metadata: { fromCache: true },
      }
    }

    // Se não está em cache, gera resposta
    console.log('❌ Cache MISS:', query)
    const response = await this.generateResponse(query, conversationId)

    // Salva em cache (apenas se não é conversa contextual)
    if (!conversationId) {
      this.responseCache.set(cacheKey, response.content)
    }

    return response
  }

  private normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .trim()
      .replace(/[?!.,]/g, '')
      .replace(/\s+/g, ' ')
  }
}
```

**Análise de Uso de Memória:**

**Estimativas:**

- **Embedding de 1 chunk**: ~1536 floats × 4 bytes = ~6 KB
- **500-700 chunks em ChromaDB**: ~3-4 MB (em disco, não em RAM)
- **Cache de 100 respostas**: ~5 MB (configurável)
- **Node.js overhead**: ~50-100 MB
- **ChromaDB client**: ~20-50 MB
- **Prisma client**: ~10-20 MB

**Total estimado de RAM**: ~100-200 MB

**Para seu notebook:**

Assumindo que seu notebook tenha pelo menos **4 GB de RAM**:

- ✅ **Totalmente seguro** usar cache em memória
- ✅ **5 MB de cache** é negligível
- ✅ ChromaDB persiste em disco, não ocupa RAM significativa
- ✅ Pode aumentar cache para 50 MB se tiver 8+ GB RAM

**Configuração recomendada por RAM disponível:**

```typescript
// 4 GB RAM
const cache = new LRUCache({ max: 50, maxSize: 2 * 1024 * 1024 }) // 2 MB

// 8 GB RAM
const cache = new LRUCache({ max: 100, maxSize: 5 * 1024 * 1024 }) // 5 MB

// 16+ GB RAM
const cache = new LRUCache({ max: 200, maxSize: 10 * 1024 * 1024 }) // 10 MB
```

**Monitoramento de memória:**

```typescript
setInterval(() => {
  const usage = process.memoryUsage()
  console.log({
    rss: `${Math.round(usage.rss / 1024 / 1024)} MB`, // Total
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)} MB`, // Heap
    cacheSize: `${Math.round(this.responseCache.size / 1024)} KB`,
  })
}, 60000) // A cada 1 minuto
```

**Vantagens do cache:**

- ✅ Economiza RPD (200/day é limitado)
- ✅ Respostas instantâneas para perguntas repetidas
- ✅ Reduz latência de ~2-3s para ~10ms
- ✅ Uso de memória controlado (LRU expira automaticamente)

**Desvantagens:**

- ❌ Não funciona para conversas contextuais (desabilitado se `conversationId`)
- ❌ Pode retornar resposta "antiga" se PDF for re-processado

### 3. Metadata Filtering

**Implementação no ChromaDB:**

```typescript
interface ChunkMetadata {
  id: string
  page: number
  chapter: string
  section?: string
  type: 'code' | 'explanation' | 'example' | 'reference'
  language?: 'typescript' // Para chunks de código
}

class RAGService {
  async retrieve(
    query: string,
    options?: {
      type?: ChunkMetadata['type']
      chapter?: string
      pageRange?: [number, number]
      topK?: number
    }
  ) {
    const { type, chapter, pageRange, topK = 5 } = options || {}

    // Monta filtros do ChromaDB (where clause)
    const where: any = {}

    if (type) {
      where.type = type
    }

    if (chapter) {
      where.chapter = chapter
    }

    if (pageRange) {
      where.page = {
        $gte: pageRange[0],
        $lte: pageRange[1],
      }
    }

    // Query com filtros
    return this.chromadb.query({
      queryEmbeddings: await this.embed(query),
      nResults: topK,
      where: Object.keys(where).length > 0 ? where : undefined,
    })
  }
}
```

**Extração de metadata durante processamento:**

```typescript
async function processChunk(chunk: string, pageNum: number) {
  const metadata: ChunkMetadata = {
    id: uuidv4(),
    page: pageNum,
    chapter: extractChapter(chunk), // Regex para "Chapter X"
    type: classifyChunkType(chunk),
  }

  return { text: chunk, metadata }
}

function classifyChunkType(chunk: string): ChunkMetadata['type'] {
  // Heurística simples
  if (chunk.match(/```|function |class |interface /)) {
    return 'code'
  }
  if (chunk.match(/^Example \d+/i)) {
    return 'example'
  }
  if (chunk.match(/^See also|^Note:|^Tip:/i)) {
    return 'reference'
  }
  return 'explanation'
}

function extractChapter(chunk: string): string {
  const match = chunk.match(/Chapter (\d+): (.+)/i)
  return match ? `Chapter ${match[1]}` : 'Unknown'
}
```

**Uso no prompt (futuro frontend):**

```typescript
// Usuário pode especificar filtros
const response = await fetch('/chat/send', {
  method: 'POST',
  body: JSON.stringify({
    message: 'Como usar generics?',
    filters: {
      type: 'code', // Apenas exemplos de código
      chapter: 'Chapter 5',
    },
  }),
})
```

**Benefícios:**

- ✅ Respostas mais precisas (filtra ruído)
- ✅ Usuário pode pedir "apenas exemplos de código"
- ✅ Permite navegação por capítulos
- ✅ Melhora precision do retrieval

---

## Estimativa de Tempo Total

| Fase                   | Tempo     |
| ---------------------- | --------- |
| Setup Inicial          | 30min     |
| Processamento do PDF   | 1-2h      |
| RAG Engine             | 2-3h      |
| API REST               | 2h        |
| Histórico de Conversas | 1-2h      |
| Testes                 | 1h        |
| **TOTAL**              | **8-11h** |

---

## Checklist de Features (MVP)

### Backend Core

- [ ] Processar PDF e gerar embeddings
- [ ] ChromaDB funcionando com persistência
- [ ] Hybrid retrieval (vector + BM25)
- [ ] Metadata filtering
- [ ] Cache LRU de respostas

### API

- [ ] POST /chat/send
- [ ] GET /conversations
- [ ] GET /conversations/:id
- [ ] DELETE /conversations/:id
- [ ] GET /health
- [ ] Documentação Scalar
- [ ] CORS configurado

### Guardrails

- [ ] Validação de tópicos (apenas TypeScript)
- [ ] Rate limiting
- [ ] Retry com exponential backoff
- [ ] Error handling robusto

### Persistência

- [ ] PostgreSQL com Prisma
- [ ] Migrations
- [ ] Repository pattern
- [ ] Auto-título de conversas
- [ ] Metadata em mensagens (sources, pages)

---

## Próximos Passos

1. ✅ Esboço salvo em `.claude/docs/ts-rag-avaliacao.md`
2. ⏳ Aguardando confirmação para iniciar implementação
3. 📋 Roadmap pronto para execução fase por fase

---

**Observações finais:**

- Rate limits são adequados para uso educacional/pessoal
- Stack moderna e bem documentada
- Preparado para integração futura com frontend
- Otimizações balanceadas (performance vs simplicidade)
- Uso de memória controlado e monitorável
