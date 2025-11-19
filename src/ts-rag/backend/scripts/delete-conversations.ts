/**
 * Script para deletar conversas específicas do MongoDB
 * Uso: cd src/ts-rag/backend && tsx scripts/delete-conversations.ts
 */

import { getConversationsCollection, closeMongoConnection } from '../src/shared/config/mongodb.js'

async function main() {
  try {
    console.log('📋 Listando todas as conversas...\n')

    const conversationsCollection = await getConversationsCollection()

    // Lista todas as conversas ordenadas por data de criação
    const conversations = await conversationsCollection
      .find({})
      .sort({ createdAt: 1 })
      .toArray()

    if (conversations.length === 0) {
      console.log('❌ Nenhuma conversa encontrada')
      return
    }

    console.log(`✅ ${conversations.length} conversas encontradas:\n`)

    conversations.forEach((conv, index) => {
      console.log(`[${index + 1}] ID: ${conv.conversationId}`)
      console.log(`    Título: ${conv.title || '(sem título)'}`)
      console.log(`    Criada em: ${new Date(conv.createdAt).toLocaleString('pt-BR')}`)
      console.log(`    Última mensagem: ${conv.messages?.[conv.messages.length - 1]?.content?.substring(0, 50) || 'N/A'}...`)
      console.log()
    })

    // Pega as 2 primeiras conversas para deletar
    const conversationsToDelete = conversations.slice(0, 2)

    if (conversationsToDelete.length === 0) {
      console.log('❌ Nenhuma conversa para deletar')
      return
    }

    console.log('🗑️  Deletando as 2 primeiras conversas...\n')

    for (const conv of conversationsToDelete) {
      console.log(`Deletando: ${conv.conversationId} - "${conv.title || '(sem título)'}"`)

      const result = await conversationsCollection.deleteOne({
        conversationId: conv.conversationId
      })

      if (result.deletedCount > 0) {
        console.log(`✅ Conversa deletada com sucesso\n`)
      } else {
        console.log(`❌ Falha ao deletar conversa\n`)
      }
    }

    console.log('✅ Operação concluída!')

  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await closeMongoConnection()
  }
}

main()
