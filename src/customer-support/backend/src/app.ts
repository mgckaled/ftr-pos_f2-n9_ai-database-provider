import swagger from '@fastify/swagger'
import scalar from '@scalar/fastify-api-reference'
import fastify from 'fastify'
import {
  jsonSchemaTransform,
  validatorCompiler
} from 'fastify-type-provider-zod'

// Plugins
import corsPlugin from './plugins/cors.plugin.js'
import errorHandlerPlugin from './plugins/error-handler.plugin.js'
import prismaPlugin from './plugins/prisma.plugin.js'
import zodPlugin from './plugins/zod.plugin.js'

// Routes
import chatRoutes from './modules/chat/routes.js'
import customersRoutes from './modules/customers/routes.js'
import purchasesRoutes from './modules/purchases/routes.js'

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

  // Registra Zod type provider (validatorCompiler configurado aqui, serializerCompiler no zodPlugin)
  app.setValidatorCompiler(validatorCompiler)

  // Registra Swagger para gerar OpenAPI schema com transformação Zod
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Customer Support API',
        description: 'API de customer support com IA para e-commerce',
        version: '1.0.0',
      },
      servers: [
        {
          url: 'http://localhost:3333',
          description: 'Desenvolvimento',
        },
      ],
      tags: [
        { name: 'customers', description: 'Endpoints de clientes' },
        { name: 'purchases', description: 'Endpoints de compras' },
        { name: 'chat', description: 'Endpoints de chat com IA' },
      ],
    },
    transform: jsonSchemaTransform, // Converte schemas Zod para JSON Schema corretamente
  })

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

  // Registra documentação Scalar (automaticamente detecta @fastify/swagger)
  await app.register(scalar, {
    routePrefix: '/docs',
    configuration: {
      theme: 'purple',
    },
  })

  return app
}