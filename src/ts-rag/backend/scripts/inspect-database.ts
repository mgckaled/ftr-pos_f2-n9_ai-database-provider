/**
 * Script consolidado para inspeção completa do banco de dados MongoDB
 * Substitui: test-connection.ts, test-simple-search.ts, validate-embeddings.ts
 *
 * Funcionalidades:
 * - Validação de conexão
 * - Contagem e estatísticas de documentos
 * - Validação de embeddings (dimensões, valores, estrutura)
 * - Validação de metadata (chapter, section, type, page)
 * - Buscas de exemplo (regex, filtros)
 * - Exemplos de chunks por tipo
 * - Validação de índices
 */

import { closeMongoConnection, getEmbeddingsCollection } from '../src/shared/config/mongodb.js'

async function inspectDatabase() {
  console.log(`\n${'='.repeat(70)}`)
  console.log(`🔍 Inspeção Completa do Banco de Dados MongoDB`)
  console.log(`${'='.repeat(70)}\n`)

  try {
    // ============================================================
    // 1. CONEXÃO E CONTAGEM
    // ============================================================
    console.log(`📊 1. CONEXÃO E CONTAGEM\n`)

    const collection = await getEmbeddingsCollection()
    const totalDocs = await collection.countDocuments()

    console.log(`   ✅ Conexão estabelecida`)
    console.log(`   Total de documentos: ${totalDocs}\n`)

    if (totalDocs === 0) {
      console.log(`   ⚠️  Nenhum documento encontrado!`)
      console.log(`   Execute: pnpm process-pdf\n`)
      return
    }

    // ============================================================
    // 2. VALIDAÇÃO DE ESTRUTURA
    // ============================================================
    console.log(`${'─'.repeat(70)}`)
    console.log(`📋 2. VALIDAÇÃO DE ESTRUTURA\n`)

    const sample = await collection.findOne()
    if (!sample) {
      console.log(`   ❌ Erro ao buscar documento de exemplo\n`)
      return
    }

    // Detecta dimensões automaticamente
    const embeddingDims = sample.embedding?.length || 0

    console.log(`   Campos do documento:`)
    console.log(`   - _id: ${sample._id ? '✅' : '❌'}`)
    console.log(`   - text: ${sample.text ? '✅' : '❌'} (${sample.text?.length || 0} chars)`)
    console.log(`   - embedding: ${sample.embedding ? '✅' : '❌'} (${embeddingDims} dims)`)
    console.log(`   - metadata: ${sample.metadata ? '✅' : '❌'}`)
    console.log(`   - createdAt: ${sample.createdAt ? '✅' : '❌'}`)
    console.log(`   - updatedAt: ${sample.updatedAt ? '✅' : '❌'}\n`)

    // ============================================================
    // 3. VALIDAÇÃO DE EMBEDDINGS
    // ============================================================
    console.log(`${'─'.repeat(70)}`)
    console.log(`🧮 3. VALIDAÇÃO DE EMBEDDINGS\n`)

    const docsWithEmbeddings = await collection.countDocuments({
      embedding: { $exists: true, $ne: null }
    })
    console.log(`   Documentos com embeddings: ${docsWithEmbeddings}/${totalDocs}`)

    // Valida dimensões (detecta automaticamente do primeiro doc)
    const validDimensions = await collection.countDocuments({
      $expr: { $eq: [{ $size: '$embedding' }, embeddingDims] }
    })
    console.log(`   Dimensões corretas (${embeddingDims}): ${validDimensions}/${totalDocs}`)

    // Verifica valores inválidos (NaN, Infinity)
    const sampleEmbedding = sample.embedding as number[]
    const hasNaN = sampleEmbedding?.some((val) => isNaN(val))
    const hasInfinity = sampleEmbedding?.some((val) => !isFinite(val))
    console.log(`   Valores numéricos válidos: ${!hasNaN && !hasInfinity ? '✅' : '❌'}`)

    // Range de valores
    if (sampleEmbedding && sampleEmbedding.length > 0) {
      const min = Math.min(...sampleEmbedding)
      const max = Math.max(...sampleEmbedding)
      const avg = sampleEmbedding.reduce((a, b) => a + b, 0) / sampleEmbedding.length
      console.log(`   Range de valores: [${min.toFixed(4)}, ${max.toFixed(4)}]`)
      console.log(`   Média: ${avg.toFixed(4)}\n`)
    }

    // ============================================================
    // 4. VALIDAÇÃO DE METADATA
    // ============================================================
    console.log(`${'─'.repeat(70)}`)
    console.log(`📖 4. VALIDAÇÃO DE METADATA\n`)

    // Distribuição por tipo
    console.log(`   Distribuição por tipo:`)
    const typeStats = await collection.aggregate([
      {
        $group: {
          _id: '$metadata.type',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]).toArray()

    typeStats.forEach((stat) => {
      const percentage = ((stat.count / totalDocs) * 100).toFixed(1)
      console.log(`   - ${stat._id}: ${stat.count} (${percentage}%)`)
    })

    // Top 10 capítulos
    console.log(`\n   Top 10 capítulos:`)
    const chapterStats = await collection.aggregate([
      {
        $group: {
          _id: '$metadata.chapter',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray()

    chapterStats.forEach((stat) => {
      const percentage = ((stat.count / totalDocs) * 100).toFixed(1)
      console.log(`   - ${stat._id}: ${stat.count} (${percentage}%)`)
    })

    // Estatísticas de "Unknown Chapter"
    const unknownCount = await collection.countDocuments({
      'metadata.chapter': 'Unknown Chapter'
    })
    const unknownPercentage = ((unknownCount / totalDocs) * 100).toFixed(1)
    console.log(`\n   "Unknown Chapter": ${unknownCount} (${unknownPercentage}%)`)

    // Documentos com section
    const withSection = await collection.countDocuments({
      'metadata.section': { $exists: true, $ne: null, $nin: [''] }
    })
    const sectionPercentage = ((withSection / totalDocs) * 100).toFixed(1)
    console.log(`   Com section: ${withSection} (${sectionPercentage}%)\n`)

    // ============================================================
    // 5. VALIDAÇÃO DE TEXTO
    // ============================================================
    console.log(`${'─'.repeat(70)}`)
    console.log(`📝 5. VALIDAÇÃO DE TEXTO\n`)

    // Textos vazios
    const emptyTexts = await collection.countDocuments({
      $or: [
        { text: { $exists: false } },
        { text: null },
        { text: '' }
      ]
    })
    console.log(`   Textos vazios: ${emptyTexts}/${totalDocs}`)

    // Estatísticas de tamanho
    const textStats = await collection.aggregate([
      {
        $group: {
          _id: null,
          avgLength: { $avg: { $strLenCP: '$text' } },
          minLength: { $min: { $strLenCP: '$text' } },
          maxLength: { $max: { $strLenCP: '$text' } }
        }
      }
    ]).toArray()

    if (textStats.length > 0) {
      const stats = textStats[0]
      console.log(`   Tamanho médio: ${Math.round(stats.avgLength)} chars`)
      console.log(`   Tamanho mínimo: ${stats.minLength} chars`)
      console.log(`   Tamanho máximo: ${stats.maxLength} chars\n`)
    }

    // ============================================================
    // 6. EXEMPLOS DE BUSCAS
    // ============================================================
    console.log(`${'─'.repeat(70)}`)
    console.log(`🔎 6. EXEMPLOS DE BUSCAS\n`)

    // Busca por palavra-chave
    console.log(`   Busca por "generic":`)
    const genericResults = await collection
      .find({ text: { $regex: /generic/i } })
      .limit(3)
      .toArray()

    console.log(`   Encontrados: ${genericResults.length} resultados`)
    genericResults.forEach((doc, i) => {
      console.log(`   [${i + 1}] ${doc.metadata.chapter} - Pág. ${doc.metadata.page}`)
    })

    // Busca por tipo
    console.log(`\n   Chunks do tipo "code":`)
    const codeCount = await collection.countDocuments({
      'metadata.type': 'code'
    })
    console.log(`   Total: ${codeCount} chunks`)

    // Busca por capítulo
    console.log(`\n   Chunks do "Chapter 4":`)
    const chapter4Count = await collection.countDocuments({
      'metadata.chapter': { $regex: /Chapter 4/i }
    })
    console.log(`   Total: ${chapter4Count} chunks\n`)

    // ============================================================
    // 7. EXEMPLOS DE CHUNKS POR TIPO
    // ============================================================
    console.log(`${'─'.repeat(70)}`)
    console.log(`📚 7. EXEMPLOS DE CHUNKS POR TIPO\n`)

    const types = ['code', 'explanation', 'example', 'reference']

    for (const type of types) {
      const doc = await collection.findOne({ 'metadata.type': type })
      if (doc) {
        console.log(`   [${type.toUpperCase()}]`)
        console.log(`   Chapter: ${doc.metadata.chapter}`)
        console.log(`   Page: ${doc.metadata.page}`)
        if (doc.metadata.section) {
          console.log(`   Section: ${doc.metadata.section}`)
        }
        console.log(`   Preview: ${doc.text.substring(0, 120).replace(/\n/g, ' ')}...`)
        console.log()
      }
    }

    // ============================================================
    // 8. VALIDAÇÃO DE ÍNDICES
    // ============================================================
    console.log(`${'─'.repeat(70)}`)
    console.log(`🔎 8. ÍNDICES DA COLLECTION\n`)

    const indexes = await collection.indexes()
    console.log(`   Total de índices: ${indexes.length}\n`)
    indexes.forEach((index) => {
      console.log(`   - ${index.name}`)
      console.log(`     Keys: ${JSON.stringify(index.key)}`)
      if (index.vectorSearchConfiguration) {
        console.log(`     Type: Vector Search`)
        console.log(`     Dimensions: ${index.vectorSearchConfiguration.dimensions || 'N/A'}`)
        console.log(`     Similarity: ${index.vectorSearchConfiguration.similarity || 'N/A'}`)
      }
      console.log()
    })

    // ============================================================
    // 9. RESUMO FINAL
    // ============================================================
    console.log(`${'─'.repeat(70)}`)
    console.log(`✅ 9. RESUMO FINAL\n`)

    const issues = []

    if (totalDocs === 0) issues.push('Nenhum documento no banco')
    if (docsWithEmbeddings !== totalDocs) issues.push(`${totalDocs - docsWithEmbeddings} docs sem embedding`)
    if (validDimensions !== totalDocs) issues.push(`${totalDocs - validDimensions} docs com dimensões incorretas`)
    if (emptyTexts > 0) issues.push(`${emptyTexts} textos vazios`)
    if (hasNaN || hasInfinity) issues.push('Valores inválidos em embeddings')
    if (unknownCount > totalDocs * 0.1) issues.push(`${unknownPercentage}% de "Unknown Chapter" (>10%)`)

    if (issues.length === 0) {
      console.log(`   ✅ BANCO DE DADOS VÁLIDO E SAUDÁVEL!`)
      console.log(`   - ${totalDocs} documentos processados`)
      console.log(`   - ${embeddingDims} dimensões de embedding`)
      console.log(`   - ${unknownPercentage}% de "Unknown Chapter"`)
      console.log(`   - ${sectionPercentage}% com metadata de section`)
    } else {
      console.log(`   ⚠️  PROBLEMAS ENCONTRADOS:\n`)
      issues.forEach((issue) => {
        console.log(`   - ${issue}`)
      })
    }

    console.log(`\n${'='.repeat(70)}`)
    console.log(`✅ Inspeção concluída!`)
    console.log(`${'='.repeat(70)}\n`)

  } catch (error) {
    console.error(`❌ Erro durante inspeção:`, error)
    throw error
  } finally {
    await closeMongoConnection()
  }
}

inspectDatabase().catch((error) => {
  console.error(`❌ Erro fatal:`, error)
  process.exit(1)
})
