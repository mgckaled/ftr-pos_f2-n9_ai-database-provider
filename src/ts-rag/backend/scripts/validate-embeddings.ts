/**
 * Script para validar a qualidade dos embeddings no MongoDB
 */

import dotenv from 'dotenv'
import { MongoClient } from 'mongodb'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI!
const DATABASE_NAME = process.env.DATABASE_NAME || 'ts_rag'

async function validateEmbeddings() {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`🔍 Validação de Embeddings - MongoDB Atlas`)
  console.log(`${'='.repeat(60)}\n`)

  const client = new MongoClient(MONGODB_URI)
  await client.connect()

  const db = client.db(DATABASE_NAME)
  const collection = db.collection('embeddings')

  // 1. Contagem total
  console.log(`📊 Contagem de Documentos:`)
  const totalDocs = await collection.countDocuments()
  console.log(`   Total: ${totalDocs}\n`)

  // 2. Validação de estrutura
  console.log(`🔍 Validação de Estrutura:`)

  const sample = await collection.findOne()
  if (!sample) {
    console.log(`   ❌ Nenhum documento encontrado!`)
    await client.close()
    return
  }

  console.log(`   ✅ Documento de exemplo encontrado`)
  console.log(`   - text: ${sample.text ? '✅' : '❌'} (${sample.text?.length || 0} chars)`)
  console.log(`   - embedding: ${sample.embedding ? '✅' : '❌'} (${sample.embedding?.length || 0} dims)`)
  console.log(`   - metadata: ${sample.metadata ? '✅' : '❌'}`)
  console.log(`   - createdAt: ${sample.createdAt ? '✅' : '❌'}\n`)

  // 3. Validação de embeddings
  console.log(`🧮 Validação de Embeddings:`)

  const docsWithEmbeddings = await collection.countDocuments({
    embedding: { $exists: true, $ne: null }
  })
  console.log(`   - Docs com embeddings: ${docsWithEmbeddings}/${totalDocs}`)

  const validDimensions = await collection.countDocuments({
    $expr: { $eq: [{ $size: '$embedding' }, 1536] }
  })
  console.log(`   - Dimensões corretas (1536): ${validDimensions}/${totalDocs}`)

  // Verifica se algum embedding tem valores inválidos
  const sampleEmbedding = sample.embedding as number[]
  const hasNaN = sampleEmbedding?.some((val) => isNaN(val))
  const hasInfinity = sampleEmbedding?.some((val) => !isFinite(val))
  console.log(`   - Valores válidos: ${!hasNaN && !hasInfinity ? '✅' : '❌'}\n`)

  // 4. Validação de metadata
  console.log(`📋 Validação de Metadata:`)

  const metadataStats = await collection.aggregate([
    {
      $group: {
        _id: '$metadata.type',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]).toArray()

  console.log(`   Distribuição por tipo:`)
  metadataStats.forEach((stat) => {
    const percentage = ((stat.count / totalDocs) * 100).toFixed(1)
    console.log(`   - ${stat._id}: ${stat.count} (${percentage}%)`)
  })

  // 5. Validação de texto
  console.log(`\n📝 Validação de Texto:`)

  const emptyTexts = await collection.countDocuments({
    $or: [
      { text: { $exists: false } },
      { text: null },
      { text: '' }
    ]
  })
  console.log(`   - Textos vazios: ${emptyTexts}/${totalDocs}`)

  const avgTextLength = await collection.aggregate([
    {
      $group: {
        _id: null,
        avgLength: { $avg: { $strLenCP: '$text' } },
        minLength: { $min: { $strLenCP: '$text' } },
        maxLength: { $max: { $strLenCP: '$text' } }
      }
    }
  ]).toArray()

  if (avgTextLength.length > 0) {
    const stats = avgTextLength[0]
    console.log(`   - Tamanho médio: ${Math.round(stats.avgLength)} chars`)
    console.log(`   - Tamanho mínimo: ${stats.minLength} chars`)
    console.log(`   - Tamanho máximo: ${stats.maxLength} chars\n`)
  }

  // 6. Exemplos de chunks por tipo
  console.log(`📚 Exemplos de Chunks:\n`)

  const types = ['code', 'explanation', 'example', 'reference']

  for (const type of types) {
    const doc = await collection.findOne({ 'metadata.type': type })
    if (doc) {
      console.log(`   [${type.toUpperCase()}] (${doc.text.length} chars)`)
      console.log(`   Chapter: ${doc.metadata.chapter}`)
      console.log(`   Page: ${doc.metadata.page}`)
      console.log(`   Preview: ${doc.text.substring(0, 100).replace(/\n/g, ' ')}...`)
      console.log()
    }
  }

  // 7. Validação de índices
  console.log(`🔎 Índices da Collection:`)
  const indexes = await collection.indexes()
  indexes.forEach((index) => {
    console.log(`   - ${index.name}: ${JSON.stringify(index.key)}`)
  })

  console.log(`\n${'='.repeat(60)}`)

  // Resumo final
  const isValid =
    totalDocs > 0 &&
    docsWithEmbeddings === totalDocs &&
    validDimensions === totalDocs &&
    emptyTexts === 0 &&
    !hasNaN &&
    !hasInfinity

  if (isValid) {
    console.log(`✅ Validação Concluída: TODOS OS DADOS ESTÃO VÁLIDOS!`)
  } else {
    console.log(`⚠️  Validação Concluída: ALGUNS PROBLEMAS ENCONTRADOS`)
    if (docsWithEmbeddings !== totalDocs) console.log(`   - Embeddings faltando em ${totalDocs - docsWithEmbeddings} docs`)
    if (validDimensions !== totalDocs) console.log(`   - Dimensões incorretas em ${totalDocs - validDimensions} docs`)
    if (emptyTexts > 0) console.log(`   - ${emptyTexts} textos vazios`)
    if (hasNaN || hasInfinity) console.log(`   - Valores inválidos em embeddings`)
  }

  console.log(`${'='.repeat(60)}\n`)

  await client.close()
}

validateEmbeddings().catch((error) => {
  console.error('❌ Erro durante validação:', error)
  process.exit(1)
})
