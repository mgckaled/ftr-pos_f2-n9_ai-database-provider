/**
 * Script para testar o RAG Engine
 * Testa retrieval, hybrid search e geração de respostas
 */

import { CacheService } from '../src/modules/rag/services/cache.service.js'
import { RAGService } from '../src/modules/rag/services/rag.service.js'
import { VectorStoreService } from '../src/modules/rag/services/vector-store.service.js'
import { closeMongoConnection } from '../src/shared/config/mongodb.js'

async function testRetrieval () {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`🧪 Teste do RAG Engine`)
  console.log(`${'='.repeat(60)}\n`)

  try {
    // 1. Inicializa serviços
    console.log(`📦 Inicializando serviços...`)
    const vectorStore = new VectorStoreService()
    await vectorStore.initialize()

    const cache = new CacheService(100, 1000 * 60 * 30) // 100 entradas, 30 min TTL
    const rag = new RAGService(vectorStore, cache)

    console.log(`✅ Serviços inicializados\n`)

    // 2. Queries de teste
    const testQueries = [
      {
        name: 'Generics básico',
        query: 'Como funcionam generics no TypeScript?',
      },
      {
        name: 'Interfaces',
        query: 'Explique o que são interfaces em TypeScript',
      },
      {
        name: 'Type annotations',
        query: 'O que são type annotations?',
      },
      {
        name: 'Pergunta fora do escopo (deve rejeitar)',
        query: 'Como fazer um loop em Python?',
      },
    ]

    // 3. Testa cada query
    for (const test of testQueries) {
      console.log(`${'─'.repeat(60)}`)
      console.log(`📝 Teste: ${test.name}`)
      console.log(`❓ Query: "${test.query}"`)
      console.log()

      const startTime = Date.now()

      const result = await rag.query(test.query, {
        useCache: true,
        useHybridSearch: true,
        topK: 3,
      })

      const elapsed = Date.now() - startTime

      console.log(`⏱️  Tempo: ${elapsed}ms`)
      console.log(`💾 Do cache: ${result.fromCache ? 'Sim' : 'Não'}`)
      console.log(`📚 Fontes encontradas: ${result.sources.length}`)

      if (result.sources.length > 0) {
        console.log(`\n📊 Top 3 fontes:`)
        result.sources.forEach((source, index) => {
          console.log(`   ${index + 1}. ${source.metadata.chapter} (pág. ${source.metadata.page})`)
          console.log(`      Tipo: ${source.metadata.type}`)
          console.log(`      Score: ${(source.metadata.score * 100).toFixed(1)}%`)
        })
      }

      console.log(`\n🤖 Resposta (primeiros 300 chars):`)
      console.log(`   ${result.response.substring(0, 300)}...\n`)
    }

    // 4. Testa cache (segunda vez)
    console.log(`${'─'.repeat(60)}`)
    console.log(`📝 Teste de Cache (repetindo primeira query)`)
    console.log()

    const cacheTestStart = Date.now()
    const cachedResult = await rag.query(testQueries[0].query)
    const cacheTestElapsed = Date.now() - cacheTestStart

    console.log(`⏱️  Tempo: ${cacheTestElapsed}ms`)
    console.log(`💾 Do cache: ${cachedResult.fromCache ? 'Sim ✅' : 'Não ❌'}`)
    console.log()

    // 5. Estatísticas do cache
    console.log(`${'─'.repeat(60)}`)
    console.log(`📊 Estatísticas do Cache:`)
    const cacheStats = rag.getCacheStats()
    console.log(`   Entradas: ${cacheStats.size}/${cacheStats.maxSize}`)
    console.log(`   Tamanho calculado: ${cacheStats.calculatedSize}`)
    console.log()

    // 6. Teste de Vector Search puro
    console.log(`${'─'.repeat(60)}`)
    console.log(`📝 Teste de Vector Search (sem hybrid)`)
    console.log()

    const vectorOnlyStart = Date.now()
    const vectorOnlyResult = await rag.query('Explique decorators', {
      useCache: false,
      useHybridSearch: false,
      topK: 3,
    })
    const vectorOnlyElapsed = Date.now() - vectorOnlyStart

    console.log(`⏱️  Tempo: ${vectorOnlyElapsed}ms`)
    console.log(`📚 Fontes: ${vectorOnlyResult.sources.length}`)
    console.log()

    // 7. Teste de filtros
    console.log(`${'─'.repeat(60)}`)
    console.log(`📝 Teste com Filtros (apenas código)`)
    console.log()

    const filterStart = Date.now()
    const filterResult = await rag.query('Mostre exemplos de generics', {
      useCache: false,
      useHybridSearch: true,
      topK: 3,
      filters: {
        type: 'code',
      },
    })
    const filterElapsed = Date.now() - filterStart

    console.log(`⏱️  Tempo: ${filterElapsed}ms`)
    console.log(`📚 Fontes (apenas código): ${filterResult.sources.length}`)
    if (filterResult.sources.length > 0) {
      console.log(`\n   Tipos das fontes:`)
      filterResult.sources.forEach((source, index) => {
        console.log(`   ${index + 1}. ${source.metadata.type}`)
      })
    }
    console.log()

    console.log(`${'='.repeat(60)}`)
    console.log(`✅ Todos os testes concluídos!`)
    console.log(`${'='.repeat(60)}\n`)
  } catch (error) {
    console.error(`❌ Erro durante os testes:`, error)
    throw error
  } finally {
    await closeMongoConnection()
  }
}

testRetrieval().catch((error) => {
  console.error(`❌ Erro fatal:`, error)
  process.exit(1)
})
