/**
 * TypeScript RAG Backend Server
 * Fastify + Zod + MongoDB + LangChain + Gemini
 */

import dotenv from 'dotenv'
import { chatRoutes } from './modules/rag/routes/chat.routes.js'
import { searchRoutes } from './modules/rag/routes/search.routes.js'
import { buildServer } from './shared/http/server.js'
import { closeMongoConnection, getMongoClient } from './shared/config/mongodb.js'

// Load environment variables
dotenv.config()

const PORT = Number(process.env.PORT) || 3333
const HOST = process.env.HOST || '0.0.0.0'

async function start() {
  try {
    // Build Fastify server
    const app = await buildServer()

    // Test MongoDB connection
    await getMongoClient()
    app.log.info('✅ MongoDB connected')

    // Register routes BEFORE swagger is ready
    await app.register(chatRoutes)
    await app.register(searchRoutes)

    app.log.info('✅ Routes registered')

    // Ready swagger (must be after routes)
    await app.ready()

    // Start server
    await app.listen({ port: PORT, host: HOST })

    app.log.info(`🚀 Server running at http://${HOST}:${PORT}`)
    app.log.info(`📊 Health check: http://${HOST}:${PORT}/health`)
    app.log.info(`💬 Chat endpoint: http://${HOST}:${PORT}/api/chat`)
    app.log.info(`🔍 Search endpoint: http://${HOST}:${PORT}/api/search`)
  } catch (error) {
    console.error('❌ Error starting server:', error)
    process.exit(1)
  }
}

// Graceful shutdown
const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT']

signals.forEach((signal) => {
  process.on(signal, async () => {
    console.log(`\n⚠️  Received ${signal}, closing server...`)
    await closeMongoConnection()
    process.exit(0)
  })
})

// Start server
start()
