import fastify from 'fastify'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'

// Plugins
import prismaPlugin from './plugins/prisma.plugin.js'
import corsPlugin from './plugins/cors.plugin.js'
import zodPlugin from './plugins/zod.plugin.js'
import errorHandlerPlugin from './plugins/error-handler.plugin.js'

// Routes
import customersRoutes from './modules/customers/routes.js'
import purchasesRoutes from './modules/purchases/routes.js'
import chatRoutes from './modules/chat/routes.js'

/**
 * Cria e configura a aplicação Fastify
 */
export async function buildApp() {
  const app = fastify({
    logger: {
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
  })

  // Registra Zod type provider
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  // Registra plugins
  await app.register(prismaPlugin)
  await app.register(corsPlugin)
  await app.register(zodPlugin)
  await app.register(errorHandlerPlugin)

  // Health check
  app.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    }
  })

  // Registra routes dos módulos
  await app.register(customersRoutes, { prefix: '/customers' })
  await app.register(purchasesRoutes, { prefix: '/purchases' })
  await app.register(chatRoutes, { prefix: '/chat' })

  return app
}