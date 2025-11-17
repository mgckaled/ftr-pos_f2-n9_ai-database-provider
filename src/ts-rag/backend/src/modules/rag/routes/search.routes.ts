/**
 * Rotas de Search (busca vetorial/híbrida)
 */

import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { VectorStoreService } from '../services/vector-store.service.js'
import { searchRequestSchema, searchResponseSchema } from '../schemas/search.schema.js'

export async function searchRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>()

  // Initialize service
  const vectorStore = new VectorStoreService()

  /**
   * POST /api/search
   * Busca semantic/híbrida no vector store
   */
  server.route({
    method: 'POST',
    url: '/api/search',
    schema: {
      description: 'Search for relevant content using vector/hybrid search',
      tags: ['Search'],
      body: searchRequestSchema,
      response: {
        200: searchResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const { query, limit, searchType, filters } = request.body

      let results

      // Seleciona tipo de busca
      switch (searchType) {
        case 'vector':
          results = await vectorStore.similaritySearch(query, limit, filters)
          break
        case 'text':
          results = await vectorStore.fullTextSearch(query, limit, filters)
          break
        case 'hybrid':
        default:
          results = await vectorStore.hybridSearch(query, limit, filters)
          break
      }

      // Formata resposta
      const formatted = results.map((result) => ({
        text: result.text,
        metadata: {
          chapter: result.metadata.chapter,
          section: result.metadata.section,
          page: result.metadata.page,
          type: result.metadata.type,
          bookTitle: result.metadata.bookTitle,
        },
        score: result.score || 0,
      }))

      return reply.send({
        results: formatted,
        total: formatted.length,
        searchType: searchType || 'hybrid',
        timestamp: new Date().toISOString(),
      })
    },
  })
}
