import dotenv from 'dotenv'
import { MongoClient } from 'mongodb'

dotenv.config()

async function testConnection () {
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