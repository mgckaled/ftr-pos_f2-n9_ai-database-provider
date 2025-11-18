/**
 * Script para processar o PDF e gerar embeddings
 *
 * Etapas:
 * 1. Extrair texto do PDF
 * 2. Dividir em chunks (RecursiveCharacterTextSplitter)
 * 3. Classificar metadata de cada chunk
 * 4. Gerar embeddings com Gemini (respeitando rate limit)
 * 5. Salvar no MongoDB Atlas
 */

import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import dotenv from 'dotenv'
import { MongoClient } from 'mongodb'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pdfParse from 'pdf-parse'
import { processChunkMetadata, resetContext } from '../src/shared/utils/chunk-classifier.js'
import { RateLimiter } from '../src/shared/utils/rate-limiter.js'

// Load environment variables
dotenv.config()

// Resolve paths
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PDF_PATH = path.resolve(__dirname, '../../data/Essential-typescript-5-third-edition.pdf')

const MONGODB_URI = process.env.MONGODB_URI!
const DATABASE_NAME = process.env.DATABASE_NAME || 'ts_rag'
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!

/**
 * Extrai texto do PDF
 */
async function extractPDFText(pdfPath: string): Promise<string> {
  console.log(`\n📄 Extraindo texto do PDF: ${path.basename(pdfPath)}`)

  const dataBuffer = fs.readFileSync(pdfPath)
  const data = await pdfParse(dataBuffer)

  console.log(`✅ PDF extraído com sucesso!`)
  console.log(`   - Páginas: ${data.numpages}`)
  console.log(`   - Caracteres: ${data.text.length.toLocaleString()}`)

  return data.text
}

/**
 * Divide texto em chunks com metadata
 */
async function createChunks(text: string) {
  console.log(`\n✂️  Dividindo texto em chunks...`)

  // RecursiveCharacterTextSplitter: melhor opção para texto longo
  // - Tenta manter parágrafos juntos
  // - Fallback para sentenças, depois palavras
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000, // ~200-300 tokens (1 char ~= 0.25 tokens)
    chunkOverlap: 200, // Overlap para manter contexto entre chunks
    separators: ['\n\n', '\n', '. ', ' ', ''], // Ordem de preferência
  })

  const docs = await splitter.createDocuments([text])

  console.log(`✅ ${docs.length} chunks criados`)
  console.log(`   - Tamanho médio: ${Math.round(text.length / docs.length)} chars`)

  // Reseta contexto antes de processar (importante para context propagation)
  console.log(`\n🔄 Resetando contexto do Chunk Classifier V2...`)
  resetContext()

  // Adiciona metadata a cada chunk
  const chunksWithMetadata = docs.map((doc, index) => {
    const metadata = processChunkMetadata(doc.pageContent, index, docs.length)

    return {
      text: doc.pageContent,
      metadata: {
        ...metadata,
        bookTitle: 'Essential TypeScript 5',
      },
    }
  })

  // Log de estatísticas por tipo
  const typeStats = chunksWithMetadata.reduce((acc, chunk) => {
    const type = chunk.metadata.type
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  console.log(`\n📊 Distribuição por tipo:`)
  Object.entries(typeStats).forEach(([type, count]) => {
    const percentage = ((count / chunksWithMetadata.length) * 100).toFixed(1)
    console.log(`   - ${type}: ${count} (${percentage}%)`)
  })

  return chunksWithMetadata
}

/**
 * Gera embeddings e salva no MongoDB
 */
async function processEmbeddings(chunks: Array<{
  text: string
  metadata: any
}>) {
  console.log(`\n🔌 Conectando ao MongoDB Atlas...`)

  const client = new MongoClient(MONGODB_URI)
  await client.connect()

  const db = client.db(DATABASE_NAME)
  const collection = db.collection('embeddings')

  console.log(`✅ Conectado!`)

  // Verifica documentos existentes (modo incremental)
  const existingCount = await collection.countDocuments()

  if (existingCount > 0) {
    console.log(`\n📊 Collection já contém ${existingCount} documentos`)
    console.log(`   Modo: INCREMENTAL (continua de onde parou)`)
    console.log(`   Total de chunks: ${chunks.length}`)
    console.log(`   Restantes: ${chunks.length - existingCount}`)

    // Se já processou todos, não faz nada
    if (existingCount >= chunks.length) {
      console.log(`\n✅ Todos os chunks já foram processados!`)
      await client.close()
      return
    }
  } else {
    console.log(`\n📊 Collection vazia - iniciando processamento completo`)
  }

  // Inicializa embeddings model
  console.log(`\n🤖 Inicializando Gemini Embeddings...`)

  const embeddingModel = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001'

  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: GEMINI_API_KEY,
    model: embeddingModel,
  })

  console.log(`✅ Gemini Embeddings pronto! (${embeddingModel})`)

  // Rate limiter (90 RPM com margem de segurança)
  const rateLimiter = new RateLimiter(90, 60000)

  // Processa apenas chunks restantes (modo incremental)
  const chunksToProcess = chunks.slice(existingCount)
  const totalToProcess = chunksToProcess.length

  console.log(`\n⚡ Processando ${totalToProcess} chunks restantes...`)
  console.log(`   Já processados: ${existingCount}`)
  console.log(`   Rate limit: 90 req/min (FREE tier: 100 RPM)`)
  console.log(`   Tempo estimado: ~${Math.ceil(totalToProcess / 90)} minutos\n`)

  let processed = 0
  const startTime = Date.now()

  for (const chunk of chunksToProcess) {
    // Aguarda rate limit
    await rateLimiter.wait()

    try {
      // Gera embedding
      const embedding = await embeddings.embedQuery(chunk.text)

      // Insere no MongoDB
      await collection.insertOne({
        text: chunk.text,
        embedding,
        metadata: chunk.metadata,
        createdAt: new Date(),
      })

      processed++

      // Log de progresso a cada 10 chunks
      if (processed % 10 === 0 || processed === totalToProcess) {
        const elapsed = Math.round((Date.now() - startTime) / 1000)
        const rate = (processed / elapsed) * 60
        const remaining = totalToProcess - processed
        const eta = remaining > 0 ? Math.round(remaining / rate) : 0

        const stats = rateLimiter.getStats()

        const totalProcessed = existingCount + processed

        console.log(
          `📊 [${totalProcessed}/${chunks.length}] ` +
          `${((totalProcessed / chunks.length) * 100).toFixed(1)}% | ` +
          `Taxa: ${rate.toFixed(1)} req/min | ` +
          `ETA: ${eta}min | ` +
          `Restantes: ${stats.remainingRequests} req`
        )
      }
    } catch (error) {
      console.error(`❌ Erro ao processar chunk ${processed + 1}:`, error)
      throw error
    }
  }

  const totalTime = Math.round((Date.now() - startTime) / 1000)
  const totalProcessed = existingCount + processed

  console.log(`\n✅ Processamento concluído!`)
  console.log(`   - Chunks nesta sessão: ${processed}`)
  console.log(`   - Total no banco: ${totalProcessed}/${chunks.length}`)
  console.log(`   - Progresso: ${((totalProcessed / chunks.length) * 100).toFixed(1)}%`)
  console.log(`   - Tempo desta sessão: ${Math.floor(totalTime / 60)}min ${totalTime % 60}s`)
  console.log(`   - Taxa média: ${((processed / totalTime) * 60).toFixed(1)} req/min`)

  if (totalProcessed < chunks.length) {
    console.log(`\n⚠️  Ainda faltam ${chunks.length - totalProcessed} chunks`)
    console.log(`   Execute o script novamente quando o quota resetar`)
  }

  await client.close()
  console.log(`\n🔌 Conexão fechada`)
}

/**
 * Main
 */
async function main() {
  try {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`🚀 TypeScript RAG - Processamento do PDF`)
    console.log(`${'='.repeat(60)}`)

    // 1. Extrai PDF
    const text = await extractPDFText(PDF_PATH)

    // 2. Cria chunks com metadata
    const chunks = await createChunks(text)

    // 3. Gera embeddings e salva
    await processEmbeddings(chunks)

    console.log(`\n${'='.repeat(60)}`)
    console.log(`✅ Processo concluído com sucesso!`)
    console.log(`${'='.repeat(60)}\n`)

    process.exit(0)
  } catch (error) {
    console.error(`\n❌ Erro durante o processamento:`, error)
    process.exit(1)
  }
}

main()
