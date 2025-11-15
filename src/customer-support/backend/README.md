<!-- markdownlint-disable -->

# Customer Support API - Backend

API REST de customer support com IA integrada para e-commerce, desenvolvida com Node.js, TypeScript, Fastify e Prisma.

## Stack Tecnológica

- **Runtime**: Node.js 22
- **Framework**: Fastify 5.6
- **Linguagem**: TypeScript 5.8
- **ORM**: Prisma 6.2
- **Banco de Dados**: PostgreSQL 17
- **Validação**: Zod 4.1
- **IA**: Google Gemini 2.0 Flash-Lite
- **Documentação**: Scalar API Reference

## Estrutura do Projeto

```plaintext
src/
├── modules/              # Módulos de negócio
│   ├── customers/       # Gestão de clientes
│   ├── purchases/       # Gestão de compras
│   └── chat/           # Chat com IA e guardrails
├── plugins/            # Plugins Fastify
├── shared/            # Utilitários compartilhados
└── prisma/           # Schema e migrations
```

## Funcionalidades

### Módulo Customers
- CRUD completo de clientes
- Validação de CPF e email
- Suporte a endereços (JSONB)
- Paginação de resultados

### Módulo Purchases
- CRUD completo de compras
- Rastreamento de status (PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED)
- Filtros avançados (status, cliente, período)
- Cálculo automático de totais

### Módulo Chat (IA)
- Integração com Google Gemini AI
- Guardrails para respostas focadas em customer support
- Rate limiting (30 RPM, 1M TPM, 200 RPD)
- Histórico de conversas por cliente
- Contexto automático (dados do cliente e compras)

## Requisitos

- Node.js >= 22.0.0
- PostgreSQL >= 17
- pnpm >= 9.0.0

## Instalação

```bash
# Instalar dependências
pnpm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais

# Executar migrations
pnpm prisma migrate dev

# Seed do banco de dados (100 clientes com compras)
pnpm prisma db seed
```

## Desenvolvimento

```bash
# Modo watch com tsx
pnpm dev

# Build para produção
pnpm build

# Executar build
pnpm start
```

## Configuração

### Variáveis de Ambiente

```env
DATABASE_URL="postgresql://user:password@localhost:5432/customer_support"
GEMINI_API_KEY="your_gemini_api_key"
PORT=3333
```

### Rate Limits (Gemini Free Tier)

- 30 requisições por minuto (RPM)
- 1.000.000 tokens por minuto (TPM)
- 200 requisições por dia (RPD)

## API Endpoints

### Health Check
```
GET /health
```

### Customers
```
GET    /customers          # Listar com paginação
GET    /customers/:id      # Buscar por ID
POST   /customers          # Criar novo
PATCH  /customers/:id      # Atualizar
DELETE /customers/:id      # Deletar
GET    /customers/:id/purchases  # Compras do cliente
```

### Purchases
```
GET    /purchases               # Listar com filtros
GET    /purchases/:id           # Buscar por ID
POST   /purchases               # Criar nova
PATCH  /purchases/:id           # Atualizar
DELETE /purchases/:id           # Deletar
PATCH  /purchases/:id/status    # Atualizar status
GET    /purchases/order/:orderNumber  # Buscar por número do pedido
```

### Chat
```
POST   /chat/send                    # Enviar mensagem
GET    /chat/conversations/:customerId  # Histórico
GET    /chat/rate-limit-stats        # Status do rate limit
```

## Documentação da API

Acesse a documentação interativa em:

```
http://localhost:3333/docs
```

A documentação é gerada automaticamente via Scalar API Reference a partir dos schemas Zod.

## Arquitetura

### Padrões Utilizados

- **Repository Pattern**: Separação de lógica de dados
- **Service Pattern**: Lógica de negócio centralizada
- **Type Provider**: Type-safe com Zod
- **Plugin System**: Modularização com Fastify plugins

### Validação e Serialização

O projeto utiliza uma solução customizada para serialização de tipos Prisma (Decimal, BigInt):

- `createSerializerCompiler` com função `replacer`
- Conversão automática de `Prisma.Decimal` para `number`
- Conversão de `BigInt` para `string`

Veja `docs/prisma-zod-serialization.md` para detalhes técnicos.

### Guardrails de IA

O módulo de chat implementa guardrails para garantir respostas focadas:

- Sistema de prompts com escopo estrito
- Validação de tópicos permitidos/proibidos
- Contexto limitado a dados do cliente e compras
- Rate limiting para conformidade com API gratuita

## Testes

```bash
# Executar testes unitários
pnpm test

# Testes com coverage
pnpm test:coverage

# Testes end-to-end
pnpm test:e2e
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

### Erro de Serialização

Se encontrar erros `FST_ERR_RESPONSE_SERIALIZATION`, consulte a documentação em `docs/prisma-zod-serialization.md`.

### Rate Limit Excedido

O Gemini Free Tier tem limites rigorosos. Monitore o status em `/chat/rate-limit-stats` e implemente cache ou fallback se necessário.

### Problemas de Conexão com PostgreSQL

Verifique se o PostgreSQL está rodando e as credenciais em `.env` estão corretas:

```bash
psql $DATABASE_URL -c "SELECT 1"
```

## Licença

MIT

## Autores

Desenvolvido como projeto educacional na Rocketseat.
