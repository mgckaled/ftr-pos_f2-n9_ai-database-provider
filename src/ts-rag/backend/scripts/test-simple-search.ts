/**
 * Script de teste SIMPLES - busca direta no MongoDB
 * NÃO gera embeddings novos, apenas testa a busca
 */

import { closeMongoConnection, getEmbeddingsCollection } from '../src/shared/config/mongodb.js'

async function testSimpleSearch() {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`🧪 Teste Simples de Busca no MongoDB`)
  console.log(`${'='.repeat(60)}\n`)

  try {
    const collection = await getEmbeddingsCollection()

    // 1. Conta documentos
    console.log(`📊 Contando documentos...`)
    const count = await collection.countDocuments()
    console.log(`✅ Total: ${count} chunks no MongoDB\n`)

    // 2. Busca por texto (full-text simples com regex)
    console.log(`${'─'.repeat(60)}`)
    console.log(`🔍 Teste 1: Busca por palavra-chave "generic"`)

    const genericsResults = await collection
      .find({
        text: { $regex: /generic/i }
      })
      .limit(3)
      .toArray()

    console.log(`✅ Encontrados: ${genericsResults.length} resultados`)
    genericsResults.forEach((doc, i) => {
      console.log(`\n[${i + 1}] ${doc.metadata.chapter} - Pág. ${doc.metadata.page}`)
      console.log(`Tipo: ${doc.metadata.type}`)
      console.log(`Preview: ${doc.text.substring(0, 150)}...\n`)
    })

    // 3. Busca por filtro de metadata
    console.log(`${'─'.repeat(60)}`)
    console.log(`🔍 Teste 2: Busca apenas código`)

    const codeResults = await collection
      .find({
        'metadata.type': 'code'
      })
      .limit(5)
      .toArray()

    console.log(`✅ Encontrados: ${codeResults.length} chunks de código`)
    codeResults.forEach((doc, i) => {
      console.log(`[${i + 1}] ${doc.metadata.chapter} - Pág. ${doc.metadata.page}`)
    })
    console.log()

    // 4. Busca por capítulo específico
    console.log(`${'─'.repeat(60)}`)
    console.log(`🔍 Teste 3: Busca por capítulo específico`)

    const chapterResults = await collection
      .find({
        'metadata.chapter': { $regex: /Chapter 4/i }
      })
      .limit(5)
      .toArray()

    console.log(`✅ Encontrados: ${chapterResults.length} chunks do Chapter 4`)
    chapterResults.forEach((doc, i) => {
      console.log(`[${i + 1}] ${doc.metadata.section || 'Sem seção'} - Pág. ${doc.metadata.page}`)
    })
    console.log()

    // 5. Estatísticas por tipo
    console.log(`${'─'.repeat(60)}`)
    console.log(`📊 Estatísticas por tipo:`)

    const stats = await collection.aggregate([
      {
        $group: {
          _id: '$metadata.type',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]).toArray()

    stats.forEach((stat) => {
      const percentage = ((stat.count / count) * 100).toFixed(1)
      console.log(`   ${stat._id}: ${stat.count} (${percentage}%)`)
    })
    console.log()

    // 6. Pega um embedding de exemplo
    console.log(`${'─'.repeat(60)}`)
    console.log(`🔍 Teste 4: Verificando estrutura de embedding`)

    const sampleDoc = await collection.findOne({ 'metadata.type': 'code' })

    if (sampleDoc && sampleDoc.embedding) {
      console.log(`✅ Embedding encontrado!`)
      console.log(`   Dimensões: ${sampleDoc.embedding.length}`)
      console.log(`   Primeiros 5 valores: [${sampleDoc.embedding.slice(0, 5).join(', ')}...]`)
      console.log(`   Texto associado: "${sampleDoc.text.substring(0, 100)}..."`)
    }
    console.log()

    console.log(`${'='.repeat(60)}`)
    console.log(`✅ Teste de busca simples concluído!`)
    console.log(`${'='.repeat(60)}\n`)

    console.log(`💡 Próximos passos:`)
    console.log(`   - Aguarde reset da quota do Gemini (24h)`)
    console.log(`   - Complete o processamento do PDF (177 chunks restantes)`)
    console.log(`   - Teste o RAG Engine completo com pnpm test:retrieval\n`)

  } catch (error) {
    console.error(`❌ Erro:`, error)
    throw error
  } finally {
    await closeMongoConnection()
  }
}

testSimpleSearch().catch((error) => {
  console.error(`❌ Erro fatal:`, error)
  process.exit(1)
})
