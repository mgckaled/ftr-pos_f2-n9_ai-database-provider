/**
 * MongoDB Client Configuration
 * Singleton pattern for MongoDB connection
 */

import dotenv from 'dotenv'
import { Db, MongoClient } from 'mongodb'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI!
const DATABASE_NAME = process.env.DATABASE_NAME || 'ts_rag'

let client: MongoClient | null = null
let db: Db | null = null

/**
 * Get MongoDB client (singleton pattern)
 */
export async function getMongoClient (): Promise<MongoClient> {
  if (!client) {
    client = new MongoClient(MONGODB_URI, {
      // Fix para erro SSL no Windows com mongodb@7.0
      // @ts-ignore - autoSelectFamily não está nos types mas funciona
      autoSelectFamily: false,
    })
    await client.connect()
    console.log('✅ MongoDB connected')
  }

  return client
}

/**
 * Get MongoDB database
 */
export async function getDatabase (): Promise<Db> {
  if (!db) {
    const mongoClient = await getMongoClient()
    db = mongoClient.db(DATABASE_NAME)
  }

  return db
}

/**
 * Close MongoDB connection
 */
export async function closeMongoConnection (): Promise<void> {
  if (client) {
    await client.close()
    client = null
    db = null
    console.log('✅ MongoDB connection closed')
  }
}

/**
 * Get embeddings collection
 */
export async function getEmbeddingsCollection () {
  const database = await getDatabase()
  return database.collection('embeddings')
}

/**
 * Get conversations collection
 */
export async function getConversationsCollection () {
  const database = await getDatabase()
  return database.collection('conversations')
}
