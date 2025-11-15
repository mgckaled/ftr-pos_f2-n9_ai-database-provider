import { buildApp } from './app.js'
import { env } from './config/env.js'

/**
 * Inicia o servidor
 */
async function start() {
  try {
    const app = await buildApp()

    await app.listen({
      port: env.PORT,
      host: '0.0.0.0', // Permite acesso externo
    })

    console.log(`
🚀 Servidor rodando em http://localhost:${env.PORT}

📚 Documentação da API (Scalar):
   👉 http://localhost:${env.PORT}/docs

📍 Endpoints disponíveis:
   - GET  /health
   - GET  /customers
   - POST /customers
   - GET  /purchases
   - POST /purchases
   - POST /chat/send
   - GET  /chat/conversations/:customerId
   - GET  /chat/rate-limit-stats

📊 Rate Limits (Free Tier - Gemini 2.0 Flash-Lite):
   - 30 RPM (Requests Per Minute)
   - 1.000.000 TPM (Tokens Per Minute)
   - 200 RPD (Requests Per Day)
    `)
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error)
    process.exit(1)
  }
}

// Inicia o servidor
start()