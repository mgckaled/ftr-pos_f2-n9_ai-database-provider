<!-- markdownlint-disable -->

# Customer Support - Sistema Completo

Sistema completo de customer support com IA integrada para e-commerce, desenvolvido com arquitetura full-stack moderna.

## Visão Geral

Sistema de atendimento ao cliente que integra:

- **Backend**: API REST com Fastify, Prisma e PostgreSQL
- **Frontend**: Interface React com chat em tempo real
- **IA**: Google Gemini AI para respostas contextualizadas
- **Persistência**: Histórico completo de conversas e dados de clientes

## Stack Tecnológica

### Backend

- **Runtime**: Node.js 22
- **Framework**: Fastify 5.6
- **Linguagem**: TypeScript 5.8
- **ORM**: Prisma 6.2
- **Banco de Dados**: PostgreSQL 17
- **Validação**: Zod 4.1
- **IA**: Google Gemini 2.5 Flash
- **Documentação**: Scalar API Reference

### Frontend

- **Framework**: React 19
- **Build Tool**: Vite 7
- **Linguagem**: TypeScript 5.9
- **Estilização**: TailwindCSS 4.1
- **UI Components**: Radix UI + shadcn/ui
- **State Management**: TanStack Query 5
- **HTTP Client**: Axios 1.13
- **Validação**: Zod 4.1
- **Temas**: next-themes (dark/light mode)

## Estrutura do Projeto

```plaintext
customer-support/
├── backend/                # API REST
│   ├── src/
│   │   ├── modules/       # Módulos de negócio
│   │   │   ├── customers/ # Gestão de clientes
│   │   │   ├── purchases/ # Gestão de compras
│   │   │   └── chat/      # Chat com IA
│   │   ├── plugins/       # Plugins Fastify
│   │   ├── shared/        # Utilitários compartilhados
│   │   └── prisma/        # Schema e migrations
│   └── package.json
│
└── frontend/              # Interface React
    ├── src/
    │   ├── components/    # Componentes React
    │   │   ├── ui/       # Componentes base (shadcn)
    │   │   ├── layout/   # Layout e navegação
    │   │   └── chat/     # Interface do chat
    │   ├── hooks/        # Custom React hooks
    │   ├── lib/          # Configurações e utils
    │   └── types/        # TypeScript types
    └── package.json
```

## Funcionalidades

### Módulo Customers

- CRUD completo de clientes
- Validação de CPF e email
- Suporte a endereços (JSONB)
- Paginação e busca

### Módulo Purchases

- CRUD completo de compras
- Rastreamento de status (PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED)
- Filtros avançados (status, cliente, período)
- Cálculo automático de totais

### Módulo Chat (IA)

- **Interface em tempo real** com histórico persistente
- **Integração com Google Gemini AI**
- **Guardrails** para respostas focadas em customer support
- **Context injection** automático:
  - Dados do cliente (nome, email)
  - Histórico de compras recentes
  - Conversas anteriores
- **Rate limiting** (30 RPM, 1M TPM, 200 RPD)
- **Persistência** dual:
  - Backend (PostgreSQL)
  - Frontend (localStorage para otimistic updates)
- **Auto-scroll** para novas mensagens
- **Timestamps** formatados em pt-BR

## Requisitos

- Node.js >= 22.0.0
- PostgreSQL >= 17
- pnpm >= 9.0.0

## Instalação

### 1. Backend

```bash
cd backend

# Instalar dependências
pnpm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais

# Executar migrations
pnpm prisma migrate dev

# Seed do banco (100 clientes com compras)
pnpm prisma db seed
```

### 2. Frontend

```bash
cd frontend

# Instalar dependências
pnpm install

# Configurar variáveis de ambiente (se necessário)
# A URL da API é configurada em src/lib/api.ts
```

## Desenvolvimento

### Executando o Backend

```bash
cd backend

# Modo watch com tsx
pnpm dev

# Build para produção
pnpm build

# Executar build
pnpm start
```

**Backend estará disponível em**: `http://localhost:3333`

### Executando o Frontend

```bash
cd frontend

# Modo desenvolvimento com HMR
pnpm dev

# Build para produção
pnpm build

# Preview do build
pnpm preview
```

**Frontend estará disponível em**: `http://localhost:5173`

## Configuração

### Variáveis de Ambiente - Backend

```env
DATABASE_URL="postgresql://user:password@localhost:5432/customer_support"
GEMINI_API_KEY="your_gemini_api_key"
GEMINI_MODEL="gemini-2.5-flash"
PORT=3333
```

### Configuração da API - Frontend

Edite `frontend/src/lib/api.ts`:

```typescript
export const api = axios.create({
  baseURL: 'http://localhost:3333', // URL do backend
})
```

### Rate Limits (Gemini Free Tier)

- 30 requisições por minuto (RPM)
- 1.000.000 tokens por minuto (TPM)
- 200 requisições por dia (RPD)

## API Endpoints

### Health Check

```http
GET /health
```

### Customers

```http
GET    /customers                    # Listar com paginação
GET    /customers/:id                # Buscar por ID
POST   /customers                    # Criar novo
PATCH  /customers/:id                # Atualizar
DELETE /customers/:id                # Deletar
GET    /customers/:id/purchases      # Compras do cliente
```

### Purchases

```http
GET    /purchases                    # Listar com filtros
GET    /purchases/:id                # Buscar por ID
POST   /purchases                    # Criar nova
PATCH  /purchases/:id                # Atualizar
DELETE /purchases/:id                # Deletar
PATCH  /purchases/:id/status         # Atualizar status
GET    /purchases/order/:orderNumber # Buscar por número do pedido
```

### Chat

```http
POST   /chat/send                         # Enviar mensagem e receber resposta da IA
GET    /chat/conversations/:customerId    # Histórico completo de conversas
GET    /chat/conversation/:id             # Buscar conversa específica
GET    /chat/conversation/:id/messages    # Mensagens de uma conversa
POST   /chat/conversation                 # Criar nova conversa
PATCH  /chat/conversation/:id/status      # Atualizar status
DELETE /chat/conversation/:id             # Deletar conversa
GET    /chat/rate-limit-stats             # Status do rate limit
```

## Documentação da API

Acesse a documentação interativa (Scalar) em:

```
http://localhost:3333/docs
```

A documentação é gerada automaticamente via Scalar API Reference a partir dos schemas Zod.

## Arquitetura

### Backend - Padrões Utilizados

- **Repository Pattern**: Separação de lógica de dados
- **Service Pattern**: Lógica de negócio centralizada
- **Type Provider**: Type-safe com Zod
- **Plugin System**: Modularização com Fastify plugins

### Frontend - Padrões Utilizados

- **Component-Based**: Componentização com React
- **Custom Hooks**: Lógica reutilizável (useChat, useCustomers, useChatMemory)
- **Server State**: TanStack Query para cache e sincronização
- **Optimistic Updates**: Mensagens aparecem instantaneamente
- **Theme Provider**: Dark/Light mode com next-themes

### Validação e Serialização

O projeto utiliza uma solução customizada para serialização de tipos Prisma (Decimal, BigInt):

- `createSerializerCompiler` com função `replacer`
- Conversão automática de `Prisma.Decimal` para `number`
- Conversão de `BigInt` para `string`

### Guardrails de IA

O módulo de chat implementa guardrails para garantir respostas focadas:

- Sistema de prompts com escopo estrito
- Validação de tópicos permitidos/proibidos
- Contexto limitado a dados do cliente e compras
- Rate limiting para conformidade com API gratuita
- Retry com exponential backoff em caso de falhas

### Fluxo de Chat

1. **Usuário digita mensagem** → Adicionada instantaneamente no frontend (optimistic update)
2. **Mensagem enviada ao backend** → Salva no banco de dados
3. **Backend busca contexto** → Dados do cliente + compras recentes
4. **IA gera resposta** → Google Gemini com contexto injetado
5. **Resposta salva** → Banco de dados + retornada ao frontend
6. **Frontend atualiza** → Exibe resposta + sincroniza histórico
7. **Persistência dual** → PostgreSQL + localStorage

## Componentes do Frontend

### Layout

- `AppLayout`: Layout principal com sidebar e header
- `CustomerSidebar`: Lista de clientes com busca e seleção
- `Header`: Barra superior com tema toggle

### Chat

- `ChatInterface`: Orquestrador principal do chat
- `MessageList`: Lista de mensagens com auto-scroll
- `MessageBubble`: Bolha de mensagem individual
- `MessageInput`: Input de texto com suporte Enter/Shift+Enter

### UI (shadcn/ui)

- Button, Avatar, ScrollArea, Select, DropdownMenu
- Todos componentes seguem padrão Radix UI + TailwindCSS

## Hooks Customizados

### useChat

```typescript
useChatHistory(customerId) // Busca histórico do backend
useSendMessage()           // Mutation para enviar mensagem
```

### useCustomers

```typescript
useCustomers({ page, limit }) // Lista clientes com paginação
useCustomer(id)               // Busca cliente específico
```

### useChatMemory

```typescript
useChatMemory(customerId) // Gerencia localStorage
// Retorna: { messages, addMessage, saveMessages, clearMessages }
```

### useSelectedCustomer

```typescript
useSelectedCustomer() // Gerencia cliente selecionado
// Retorna: { selectedCustomerId, selectCustomer }
```

## Prisma

### Comandos Úteis

```bash
# Abrir Prisma Studio
pnpm prisma studio

# Gerar client após mudanças no schema
pnpm prisma generate

# Criar nova migration
pnpm prisma migrate dev --name description

# Reset do banco (cuidado!)
pnpm prisma migrate reset
```

## Troubleshooting

### Erro de Serialização (Backend)

Se encontrar erros `FST_ERR_RESPONSE_SERIALIZATION`, verifique:

- Conversão de `Prisma.Decimal` para `number`
- Serialização de `Date` para ISO string

### Rate Limit Excedido (IA)

O Gemini Free Tier tem limites rigorosos. Monitore em `/chat/rate-limit-stats`:

- Implementado retry automático com exponential backoff
- Aguarda automaticamente se atingir 30 RPM
- Considere implementar cache de respostas comuns

### Mensagens não aparecem no Frontend

Verifique:

1. Backend está rodando em `http://localhost:3333`
2. Frontend configurado com URL correta em `src/lib/api.ts`
3. Console do navegador para erros de CORS ou rede
4. Network tab para verificar status das requisições

### Histórico não carrega

Problemas comuns:

- Verifique se `customerId` é válido
- Confirme que há conversas no banco de dados
- Veja logs do backend para erros de query

### Problemas de Conexão com PostgreSQL

Verifique se o PostgreSQL está rodando:

```bash
psql $DATABASE_URL -c "SELECT 1"
```

## Estatísticas do Projeto

- **Total**: 91 arquivos, ~5.096 linhas de código
- **Backend**: 30 arquivos, 2.906 linhas (TypeScript)
- **Frontend**: 29 arquivos, 1.861 linhas (TypeScript/TSX)
- **Proporção**: 61% backend, 39% frontend

## Próximos Passos

### Melhorias Sugeridas

- [ ] Implementar autenticação e autorização
- [ ] Adicionar testes unitários e E2E
- [ ] Implementar WebSocket para chat em tempo real
- [ ] Cache de respostas da IA para perguntas frequentes
- [ ] Métricas e observabilidade (logs estruturados)
- [ ] Deploy automatizado (CI/CD)
- [ ] Containerização com Docker
- [ ] Internacionalização (i18n)
