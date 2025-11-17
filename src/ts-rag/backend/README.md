# TypeScript RAG Backend

Backend API para RAG (Retrieval-Augmented Generation) focado em documentação TypeScript.

## 🚀 Stack

- **Fastify** - Web framework rápido e moderno
- **Zod** - Validação de schemas TypeScript-first
- **MongoDB Atlas** - Vector database + document store
- **LangChain** - Framework para RAG
- **Google Gemini** - LLM (chat) + Embeddings
- **Scalar** - Documentação interativa da API

## 📦 Estrutura do Projeto

```
src/
├── server.ts                    # Entry point
├── shared/
│   ├── http/
│   │   └── server.ts           # Fastify setup + Zod + CORS + Scalar
│   ├── config/
│   │   └── mongodb.ts          # MongoDB client singleton
│   └── utils/
│       ├── chunk-classifier.ts  # Metadata extraction com context propagation
│       └── rate-limiter.ts     # Rate limiting para Gemini API
└── modules/
    └── rag/
        ├── routes/
        │   ├── chat.routes.ts   # POST /api/chat, GET /api/chat/history
        │   └── search.routes.ts # POST /api/search
        ├── schemas/
        │   ├── chat.schema.ts   # Zod schemas para chat
        │   └── search.schema.ts # Zod schemas para search
        └── services/
            ├── cache.service.ts        # LRU cache
            ├── vector-store.service.ts # Vector/hybrid search
            └── rag.service.ts          # RAG engine principal
```

## 🛠️ Scripts Disponíveis

### Desenvolvimento
```bash
pnpm dev              # Inicia servidor em modo watch
pnpm build            # Compila TypeScript para JavaScript
pnpm start            # Inicia servidor compilado
```

### Processamento de Dados
```bash
pnpm process-pdf      # Processa PDF e gera embeddings (usa API Gemini)
pnpm update-metadata  # Re-processa metadata sem gerar embeddings
pnpm inspect          # Inspeção completa do banco MongoDB
```

### Testes
```bash
pnpm test:retrieval   # Testa RAG Engine completo
```

## 📡 Endpoints da API

### Health Check
```bash
GET /health
```

### Chat
```bash
POST /api/chat
Content-Type: application/json

{
  "question": "What are TypeScript generics?",
  "conversationId": "optional-uuid",
  "useCache": true,
  "useHybridSearch": true,
  "topK": 5,
  "filters": {
    "type": "code",
    "chapter": "Chapter 4"
  }
}
```

**Response:**
```json
{
  "response": "TypeScript generics allow...",
  "sources": [
    {
      "text": "...",
      "chapter": "Chapter 4",
      "section": "4.1 Generics",
      "page": 125,
      "type": "explanation",
      "score": 0.95
    }
  ],
  "conversationId": "uuid",
  "fromCache": false,
  "timestamp": "2025-11-17T18:00:00.000Z"
}
```

### Histórico de Conversa
```bash
GET /api/chat/history/:conversationId
```

### Lista de Conversas
```bash
GET /api/chat/conversations
```

### Search (Vector/Hybrid)
```bash
POST /api/search
Content-Type: application/json

{
  "query": "interface inheritance",
  "limit": 5,
  "searchType": "hybrid",
  "filters": {
    "type": "code"
  }
}
```

## 📚 Documentação Interativa

Acesse `/docs` quando o servidor estiver rodando para ver a documentação completa com Scalar.

```bash
http://localhost:3333/docs
```

## ⚙️ Variáveis de Ambiente

Crie um arquivo `.env` baseado em `.env.example`:

```env
# MongoDB Atlas
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/
DATABASE_NAME=ts_rag

# Google Gemini API
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-001

# Server
PORT=3333
HOST=0.0.0.0
LOG_LEVEL=info
CORS_ORIGIN=*
```

## 🔄 Fluxo de Trabalho

### 1. Primeira vez - Processar PDF

```bash
# Processa PDF, gera chunks e embeddings (demora ~20min)
pnpm process-pdf
```

**Nota:** Respeita rate limit de 90 req/min do Gemini FREE tier.

### 2. Validar Dados

```bash
# Inspeção completa do banco
pnpm inspect
```

### 3. Iniciar API

```bash
# Modo desenvolvimento (watch)
pnpm dev
```

### 4. Testar Endpoints

```bash
# Health check
curl http://localhost:3333/health

# Chat
curl -X POST http://localhost:3333/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "What are TypeScript interfaces?"}'

# Search
curl -X POST http://localhost:3333/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "generics", "limit": 3}'
```

## 🎯 Features Implementadas

### Fase 1: Setup TypeScript ✅
- Configuração do projeto
- Dependências instaladas

### Fase 2: PDF Processing ✅
- Extração de texto do PDF
- Chunking com RecursiveCharacterTextSplitter
- Metadata extraction com context propagation
- Geração de embeddings (3072 dims)
- Armazenamento no MongoDB Atlas

### Fase 3: RAG Engine ✅
- Vector Search (cosine similarity)
- Full-Text Search (BM25-like)
- Hybrid Search com Reciprocal Rank Fusion (RRF)
- LRU Cache para performance
- Gemini Chat integration
- Guardrails (TypeScript-only queries)

### Fase 3.1: Metadata Improvements ✅
- Context propagation para chapters
- Unknown Chapter: 91% → 0.5%
- 161 capítulos detectados

### Fase 3.2: Section Metadata ✅
- Context propagation para sections
- Sections: 12.9% → 99.9%
- 124 sections detectadas

### Fase 4: API REST ✅
- Fastify + Zod type provider
- Endpoints de chat com histórico
- Endpoints de search vetorial/híbrida
- CORS configurado
- Documentação Scalar
- Error handling

## 📊 Estatísticas do Banco

**Dados processados:**
- 1002 chunks (85% do PDF)
- 3072 dimensões por embedding
- 99.9% com section metadata
- 0.5% Unknown Chapter

**Distribuição por tipo:**
- code: 39.7%
- example: 34.9%
- explanation: 25.0%
- reference: 0.3%

## 🔜 Próximos Passos

1. **Completar PDF** - Processar 177 chunks restantes quando quota resetar
2. **Frontend** - Interface React para chat
3. **Streaming** - Suporte a streaming de respostas
4. **Auth** - Autenticação de usuários
5. **Analytics** - Métricas de uso

## 📝 Licença

MIT
