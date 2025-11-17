/**
 * Fastify Server Setup with Type Provider Zod + Scalar API Reference
 */

import cors from '@fastify/cors'
import swagger from '@fastify/swagger'
import scalar from '@scalar/fastify-api-reference'
import fastify from 'fastify'
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'

export async function buildServer() {
  const app = fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
  })

  // Add Zod schema validator and serializer
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  // CORS configuration
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  })

  // Swagger/OpenAPI spec generation (required for Scalar)
  await app.register(swagger, {
    openapi: {
      openapi: '3.1.0',
      info: {
        title: 'TypeScript RAG API',
        description: 'RAG (Retrieval-Augmented Generation) API for TypeScript documentation with vector search, hybrid search, and AI-powered chat',
        version: '1.0.0',
      },
      servers: [
        {
          url: `http://localhost:${process.env.PORT || 3333}`,
          description: 'Development server',
        },
      ],
      tags: [
        { name: 'Chat', description: 'Chat endpoints with AI' },
        { name: 'Search', description: 'Vector/hybrid search endpoints' },
      ],
    },
    transform: jsonSchemaTransform,
  })

  // Scalar API Reference (modern OpenAPI UI)
  await app.register(scalar, {
    routePrefix: '/docs',
    configuration: {
      theme: 'purple',
    },
  })

  // Health check endpoint
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })

  // Custom error handler for Zod validation errors
  app.setErrorHandler((error, request, reply) => {
    // Zod validation errors
    if (error.validation) {
      return reply.status(400).send({
        error: 'Validation Error',
        message: "Request doesn't match the schema",
        statusCode: 400,
        details: error.validation,
      })
    }

    // Generic errors
    request.log.error(error)
    return reply.status(500).send({
      error: 'Internal Server Error',
      message: error.message || 'An unexpected error occurred',
      statusCode: 500,
    })
  })

  return app.withTypeProvider<ZodTypeProvider>()
}
