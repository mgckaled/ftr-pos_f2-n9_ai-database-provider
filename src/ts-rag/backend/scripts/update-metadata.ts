/**
 * Script para atualizar APENAS metadata dos chunks existentes
 * NÃO gera novos embeddings, apenas re-processa metadata
 */

import { closeMongoConnection, getEmbeddingsCollection } from '../src/shared/config/mongodb.js'
import {
  processChunkMetadata,
  resetContext,
  getContextStats,
} from '../src/shared/utils/chunk-classifier-v2.js'

async function updateMetadata() {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`🔄 Atualização de Metadata - Chunk Classifier V2`)
  console.log(`${'='.repeat(60)}\n`)

  try {
    const collection = await getEmbeddingsCollection()

    // 1. Busca todos os chunks (sem sort para evitar limite de memória no FREE tier)
    console.log(`📦 Buscando chunks...`)
    const chunks = await collection
      .find({})
      .toArray()

    console.log(`✅ ${chunks.length} chunks encontrados\n`)

    if (chunks.length === 0) {
      console.log(`⚠️  Nenhum chunk encontrado. Execute process-pdf primeiro.`)
      return
    }

    // 2. Reseta contexto
    resetContext()

    // 3. Re-processa metadata
    console.log(`🔄 Re-processando metadata com Chunk Classifier V2...`)
    console.log(`   - Context propagation: ATIVADO`)
    console.log(`   - Novos padrões de detecção: ATIVADO`)
    console.log(`   - Page range analysis: ATIVADO\n`)

    let updated = 0
    let unknownBefore = 0
    let unknownAfter = 0

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const oldChapter = chunk.metadata.chapter

      // Conta "Unknown Chapter" antes
      if (oldChapter === 'Unknown Chapter') {
        unknownBefore++
      }

      // Re-processa metadata
      const newMetadata = processChunkMetadata(
        chunk.text,
        i,
        chunks.length
      )

      // Conta "Unknown Chapter" depois
      if (newMetadata.chapter === 'Unknown Chapter') {
        unknownAfter++
      }

      // Verifica se houve mudança
      const hasChanged =
        oldChapter !== newMetadata.chapter ||
        chunk.metadata.section !== newMetadata.section

      if (hasChanged) {
        // Atualiza no MongoDB
        await collection.updateOne(
          { _id: chunk._id },
          {
            $set: {
              'metadata.chapter': newMetadata.chapter,
              'metadata.section': newMetadata.section,
              'metadata.page': newMetadata.page,
              'metadata.type': newMetadata.type,
              updatedAt: new Date(),
            },
          }
        )

        updated++
      }

      // Log de progresso a cada 100 chunks
      if ((i + 1) % 100 === 0) {
        const progress = ((i + 1) / chunks.length) * 100
        console.log(`   Processados: ${i + 1}/${chunks.length} (${progress.toFixed(1)}%)`)
      }
    }

    console.log(`\n✅ Metadata re-processada!\n`)

    // 4. Estatísticas
    console.log(`${'─'.repeat(60)}`)
    console.log(`📊 Estatísticas da Atualização:\n`)
    console.log(`   Total de chunks: ${chunks.length}`)
    console.log(`   Chunks atualizados: ${updated}`)
    console.log(`   Sem alterações: ${chunks.length - updated}\n`)

    console.log(`   "Unknown Chapter" ANTES: ${unknownBefore} (${((unknownBefore / chunks.length) * 100).toFixed(1)}%)`)
    console.log(`   "Unknown Chapter" DEPOIS: ${unknownAfter} (${((unknownAfter / chunks.length) * 100).toFixed(1)}%)`)

    const improvement = unknownBefore - unknownAfter
    if (improvement > 0) {
      console.log(`   ✅ Melhoria: ${improvement} chunks agora têm capítulo identificado!`)
    } else if (improvement < 0) {
      console.log(`   ⚠️  ${Math.abs(improvement)} chunks perderam capítulo`)
    } else {
      console.log(`   ℹ️  Nenhuma mudança em "Unknown Chapter"`)
    }

    // 5. Context stats
    console.log(`\n${'─'.repeat(60)}`)
    console.log(`📖 Estatísticas do Context:\n`)
    const contextStats = getContextStats()
    console.log(`   Último capítulo conhecido: ${contextStats.lastKnownChapter}`)
    console.log(`   Capítulos detectados: ${contextStats.chaptersDetected}`)

    if (contextStats.pageRanges.length > 0) {
      console.log(`\n   Capítulos por página:`)
      const uniqueChapters = Array.from(
        new Set(contextStats.pageRanges.map((r) => r.chapter))
      )
      uniqueChapters.slice(0, 10).forEach((chapter) => {
        const firstPage = contextStats.pageRanges.find((r) => r.chapter === chapter)?.page
        console.log(`   - ${chapter} (primeira aparição: pág. ${firstPage})`)
      })

      if (uniqueChapters.length > 10) {
        console.log(`   ... e mais ${uniqueChapters.length - 10} capítulos`)
      }
    }

    // 6. Validação final
    console.log(`\n${'─'.repeat(60)}`)
    console.log(`✅ Validando dados atualizados...\n`)

    const stats = await collection.aggregate([
      {
        $group: {
          _id: '$metadata.chapter',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]).toArray()

    console.log(`   Top 10 capítulos:`)
    stats.forEach((stat) => {
      const percentage = ((stat.count / chunks.length) * 100).toFixed(1)
      console.log(`   - ${stat._id}: ${stat.count} chunks (${percentage}%)`)
    })

    console.log(`\n${'='.repeat(60)}`)
    console.log(`✅ Atualização de metadata concluída!`)
    console.log(`${'='.repeat(60)}\n`)

  } catch (error) {
    console.error(`❌ Erro:`, error)
    throw error
  } finally {
    await closeMongoConnection()
  }
}

updateMetadata().catch((error) => {
  console.error(`❌ Erro fatal:`, error)
  process.exit(1)
})
