# Guia Passo a Passo - MongoDB Atlas Setup

## Passo 1: Criar Conta (2 min)

1. **Acesse**: https://www.mongodb.com/cloud/atlas/register

2. **Opções de cadastro:**
   - ✅ **Recomendado**: Sign up with Google (mais rápido)
   - Ou: Email + senha

3. **Preencha informações básicas:**
   - Nome
   - Empresa (pode deixar "Personal" ou "Student")
   - Goal: "Learn MongoDB" ou "Build a new app"

4. Clique em **"Finish"**

---

## Passo 2: Criar Cluster FREE (M0) - 3 min

### 2.1. Tela Inicial

Após login, você verá:
- **"Create a deployment"** ou **"Build a Database"**

Clique nesse botão verde.

### 2.2. Escolher Tier

Você verá 3 opções:

| Tier | Preço | Especificações |
|------|-------|----------------|
| M0 Sandbox | **FREE** | 512 MB storage ← **ESCOLHA ESTE** |
| M2/M5 | $9-25/mês | Mais recursos |
| M10+ | $57+/mês | Produção |

**✅ Selecione: M0 (FREE FOREVER)**

### 2.3. Escolher Provider e Região

**Cloud Provider:**
- AWS (recomendado)
- Google Cloud
- Azure

**Região:**
- Escolha a **mais próxima** de você:
  - 🇧🇷 Brasil: `São Paulo (sa-east-1)` ← **RECOMENDADO**
  - 🇺🇸 EUA: `N. Virginia (us-east-1)` (boa latência para BR)
  - 🇪🇺 Europa: `Frankfurt (eu-central-1)`

**Cluster Tier:**
- Confirme que está **M0 Sandbox** (FREE)

### 2.4. Nomear o Cluster

**Cluster Name:**
```
ts-rag-cluster
```

Ou qualquer nome descritivo (ex: `typescript-rag`, `learning-cluster`)

### 2.5. Criar!

- Clique em **"Create Deployment"** (botão verde no canto inferior direito)
- ⏳ Aguarde **1-3 minutos** (o cluster está sendo provisionado)

---

## Passo 3: Configurar Segurança (2 min)

### 3.1. Criar Database User

Logo após criar o cluster, aparecerá um popup:

**"Security Quickstart"**

**Username:**
```
ts_rag_user
```

**Password:**
- Clique em **"Autogenerate Secure Password"** (botão ao lado)
- **⚠️ IMPORTANTE**: Copie e salve a senha gerada!

```
Exemplo de senha gerada:
Xy9$mK2pQw7nR4tL
```

**Salve em um arquivo temporário:**
```
Username: ts_rag_user
Password: Xy9$mK2pQw7nR4tL
```

Clique em **"Create Database User"**

### 3.2. Adicionar IP Address (Whitelist)

**Opção 1: Permitir de qualquer lugar (desenvolvimento)** ← Recomendado para iniciar

- Clique em **"Add My Current IP Address"**
- Ou manualmente adicione: `0.0.0.0/0` (permite de qualquer IP)

**Opção 2: Apenas seu IP atual**

- O Atlas detecta automaticamente
- Clique em **"Add Current IP Address"**

Clique em **"Finish and Close"**

---

## Passo 4: Obter Connection String (1 min)

### 4.1. Acessar Cluster

- Você voltará para a dashboard
- Verá seu cluster: **ts-rag-cluster** com status **"ACTIVE"**

### 4.2. Clicar em "Connect"

- Localize seu cluster na lista
- Clique no botão **"Connect"** (ao lado do nome do cluster)

### 4.3. Escolher Método

Você verá 3 opções:

1. **Drivers** ← **ESCOLHA ESTE**
2. MongoDB Shell
3. Compass (GUI)

Clique em **"Drivers"**

### 4.4. Copiar Connection String

**Driver:** Node.js

**Version:** 6.0 or later (padrão)

**Connection String:**

Você verá algo assim:

```
mongodb+srv://ts_rag_user:<password>@ts-rag-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=ts-rag-cluster
```

**⚠️ IMPORTANTE:**

1. **Copie** a string completa
2. **Substitua** `<password>` pela senha que você salvou:

```
mongodb+srv://ts_rag_user:Xy9$mK2pQw7nR4tL@ts-rag-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=ts-rag-cluster
```

**Salve no arquivo `.env`:**

```env
MONGODB_URI="mongodb+srv://ts_rag_user:Xy9$mK2pQw7nR4tL@ts-rag-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=ts-rag-cluster"
```

---

## Passo 5: Criar Database e Collections (2 min)

### 5.1. Acessar "Database" (menu lateral)

- No menu esquerdo, clique em **"Database"**
- Você verá seu cluster

### 5.2. Browse Collections

- Clique em **"Browse Collections"** (no card do cluster)

### 5.3. Criar Database

- Clique em **"+ Create Database"** (botão verde)

**Database name:**
```
ts_rag
```

**Collection name:**
```
embeddings
```

Clique em **"Create"**

### 5.4. Criar Segunda Collection

- Com o database `ts_rag` selecionado
- Clique em **"+ Create Collection"**

**Collection name:**
```
conversations
```

Clique em **"Create"**

**Resultado esperado:**
```
📁 ts_rag
├── 📄 embeddings
└── 📄 conversations
```

---

## Passo 6: Criar Vector Search Index (3 min)

### 6.1. Acessar Atlas Search

- Menu lateral: **"Atlas Search"**
- Ou pelo card do cluster: **"Create Search Index"**

### 6.2. Criar Vector Search Index

Você verá duas opções:

- **JSON Editor** ← **USE ESTE**
- Visual Editor

Clique em **"Next"**

### 6.3. Selecionar Database e Collection

**Database:** `ts_rag`

**Collection:** `embeddings`

Clique em **"Next"**

### 6.4. Configurar Index (JSON)

**Index Name:**
```
vector_index
```

**Index Definition (JSON):**

Cole este JSON:

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

Clique em **"Next"**

### 6.5. Review e Create

- Revise as configurações
- Clique em **"Create Search Index"**

⏳ **Aguarde 1-2 minutos** (status mudará de "Building" para "Active")

---

## Passo 7: Criar Full-Text Search Index (opcional - 2 min)

### 7.1. Criar Outro Index

- Ainda na tela "Atlas Search"
- Clique em **"Create Search Index"**

### 7.2. Configurar FTS Index

**Index Name:**
```
fulltext_index
```

**Database:** `ts_rag`

**Collection:** `embeddings`

**Index Definition (JSON):**

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

Clique em **"Create Search Index"**

---

## Passo 8: Testar Conexão (1 min)

### Criar arquivo `.env`

No diretório `src/ts-rag/backend/`, crie:

```env
# MongoDB
MONGODB_URI="mongodb+srv://ts_rag_user:SUA_SENHA_AQUI@ts-rag-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority"
DATABASE_NAME="ts_rag"

# Gemini API
GEMINI_API_KEY="your_gemini_api_key_here"
GEMINI_MODEL="gemini-2.0-flash-exp"
GEMINI_EMBEDDING_MODEL="text-embedding-004"

# Server
PORT=3333
NODE_ENV="development"

# Cache
CACHE_MAX_SIZE_MB=5
CACHE_TTL_HOURS=24
```

### Script de teste

Crie `src/ts-rag/backend/scripts/test-connection.ts`:

```typescript
import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'

dotenv.config()"ignoreDeprecations": "6.0"

async function testConnection() {
  const client = new MongoClient(process.env.MONGODB_URI!)

  try {
    console.log('🔌 Conectando ao MongoDB Atlas...')
    await client.connect()

    console.log('✅ Conectado com sucesso!')

    const db = client.db('ts_rag')
    const collections = await db.listCollections().toArray()

    console.log('\n📁 Collections encontradas:')
    collections.forEach(col => {
      console.log(`  - ${col.name}`)
    })

    // Testa inserção
    const testDoc = { test: true, timestamp: new Date() }
    await db.collection('embeddings').insertOne(testDoc)
    console.log('\n✅ Teste de inserção: OK')

    // Remove documento de teste
    await db.collection('embeddings').deleteOne({ test: true })
    console.log('✅ Teste de remoção: OK')

  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await client.close()
    console.log('\n🔌 Conexão fechada')
  }
}

testConnection()
```

### Rodar teste

```bash
cd src/ts-rag/backend
tsx scripts/test-connection.ts
```

**Saída esperada:**

```
🔌 Conectando ao MongoDB Atlas...
✅ Conectado com sucesso!

📁 Collections encontradas:
  - embeddings
  - conversations

✅ Teste de inserção: OK
✅ Teste de remoção: OK

🔌 Conexão fechada
```

---

## Checklist Final

- [ ] Cluster M0 criado (FREE)
- [ ] Database user criado
- [ ] IP whitelist configurado
- [ ] Connection string copiado
- [ ] Database `ts_rag` criado
- [ ] Collections `embeddings` e `conversations` criadas
- [ ] Vector Search Index criado (status: Active)
- [ ] Full-Text Search Index criado (opcional, status: Active)
- [ ] `.env` configurado
- [ ] Teste de conexão passou ✅

---

## Próximos Passos

Após completar todos os passos:

1. ✅ Me avise que o cluster está pronto
2. ✅ Confirme que o teste de conexão funcionou
3. 🚀 Continuo a implementação do RAG!

---

## Troubleshooting

### Erro: "Authentication failed"

- ✅ Verifique se substituiu `<password>` pela senha real
- ✅ Senha contém caracteres especiais? Encode: `encodeURIComponent(password)`

### Erro: "Network timeout"

- ✅ Verifique IP whitelist (adicione `0.0.0.0/0` temporariamente)
- ✅ Firewall corporativo pode bloquear MongoDB (porta 27017)

### Cluster não aparece como "Active"

- ⏳ Aguarde mais 1-2 minutos
- 🔄 Refresh a página

### Vector Index em "Building" por muito tempo

- ⏳ Normal para primeiro index (até 5 min)
- Collection vazia cria index mais rápido

---

**Dúvidas? Me avise em qual passo está! 🚀**
