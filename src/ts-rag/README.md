# TypeScript RAG

Sistema RAG (Retrieval-Augmented Generation) especializado em TypeScript, baseado no livro "Essential TypeScript 5".

## Arquitetura

```
ts-rag/
├── backend/    # API Fastify + LangChain + MongoDB
├── frontend/   # React + TanStack Query + Tailwind
└── data/       # Embeddings e documentos processados
```

## Stack Tecnológica

### Backend
- **Runtime**: Node.js + TypeScript
- **Framework**: Fastify 5 + Zod validation
- **LLM**: Google Gemini 2.5 Flash via LangChain
- **Vector Store**: MongoDB Atlas Vector Search
- **Embeddings**: Google Gemini Embedding Model
- **Search**: Hybrid Search (Vector + Full-Text) com RRF

### Frontend
- **Framework**: React 19 + Vite
- **Estado**: TanStack Query v5 (cache + invalidation)
- **UI**: Radix UI + Tailwind CSS v4
- **Markdown**: react-markdown + syntax highlighting

## Funcionalidades

- Chat conversacional com histórico persistente
- Geração automática de títulos para conversas
- Busca híbrida (semântica + texto completo)
- Cache de respostas com LRU
- Guardrails: validação de queries sobre TypeScript
- Skeleton loading durante geração de respostas
- Dark mode

## Configuração

### Backend

```bash
cd backend
pnpm install

# Configurar .env
GEMINI_API_KEY=
MONGODB_URI=
DATABASE_NAME=ts_rag
```

### Frontend

```bash
cd frontend
pnpm install
```

## Desenvolvimento

```bash
# Backend (porta 3333)
cd backend
pnpm dev

# Frontend (porta 5173)
cd frontend
pnpm dev
```

## Scripts Úteis

```bash
# Backend
pnpm process-pdf          # Processar PDF e gerar embeddings
pnpm inspect              # Inspecionar banco de dados
pnpm test:retrieval       # Testar recuperação de chunks

# Utilitários
tsx backend/scripts/delete-conversations.ts  # Deletar conversas
```

## Estrutura do Banco

### Collection: `embeddings`
- Chunks de texto do livro
- Embeddings (Google Gemini)
- Metadata: page, chapter, section, type

### Collection: `conversations`
- conversationId (UUID)
- title (gerado automaticamente)
- messages[] (role, content, timestamp, sources)
- createdAt, updatedAt

## Índices MongoDB

- **Vector Search**: `vector_index` (campo: embedding)
- **Full-Text Search**: `fulltext_index` (campo: text)

## Migração de Dados

O sistema usa `z.preprocess()` para compatibilidade retroativa com dados antigos do MongoDB, convertendo automaticamente arrays em strings durante validação.