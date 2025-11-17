/**
 * Rotas de Chat
 */

import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { CacheService } from '../services/cache.service.js'
import { RAGService } from '../services/rag.service.js'
import { VectorStoreService } from '../services/vector-store.service.js'
import {
  chatRequestSchema,
  chatResponseSchema,
  conversationHistorySchema,
} from '../schemas/chat.schema.js'
import { getConversationsCollection } from '../../../shared/config/mongodb.js'

export async function chatRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>()

  // Initialize services
  const vectorStore = new VectorStoreService()
  const cache = new CacheService()
  const ragService = new RAGService(vectorStore, cache)

  /**
   * POST /api/chat
   * Envia mensagem e recebe resposta do RAG
   */
  server.route({
    method: 'POST',
    url: '/api/chat',
    schema: {
      description: 'Send a question and get AI-powered response with sources',
      tags: ['Chat'],
      body: chatRequestSchema,
      response: {
        200: chatResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const { question, conversationId, useCache, useHybridSearch, topK, filters } = request.body

      // Gera ou usa conversationId existente
      const currentConversationId = conversationId || randomUUID()

      // Query no RAG
      const result = await ragService.query(question, {
        useCache,
        useHybridSearch,
        topK,
        filters,
      })

      // Salva no histórico
      const conversationsCollection = await getConversationsCollection()

      const timestamp = new Date().toISOString()

      await conversationsCollection.updateOne(
        { conversationId: currentConversationId },
        {
          $push: {
            messages: {
              $each: [
                {
                  role: 'user',
                  content: question,
                  timestamp,
                },
                {
                  role: 'assistant',
                  content: result.response,
                  timestamp,
                  sources: result.sources,
                },
              ],
            },
          },
          $setOnInsert: {
            conversationId: currentConversationId,
            createdAt: timestamp,
          },
          $set: {
            updatedAt: timestamp,
          },
        },
        { upsert: true }
      )

      return reply.send({
        response: result.response,
        sources: result.sources,
        conversationId: currentConversationId,
        fromCache: result.fromCache,
        timestamp,
      })
    },
  })

  /**
   * GET /api/chat/history/:conversationId
   * Obtém histórico de uma conversa
   */
  server.route({
    method: 'GET',
    url: '/api/chat/history/:conversationId',
    schema: {
      description: 'Get conversation history by ID',
      tags: ['Chat'],
      params: z.object({
        conversationId: z.string().uuid(),
      }),
      response: {
        200: conversationHistorySchema,
        404: z.object({
          error: z.string(),
          message: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { conversationId } = request.params

      const conversationsCollection = await getConversationsCollection()
      const conversation = await conversationsCollection.findOne({ conversationId })

      if (!conversation) {
        return reply.status(404).send({
          error: 'Not Found',
          message: `Conversation ${conversationId} not found`,
        })
      }

      return reply.send({
        conversationId: conversation.conversationId,
        messages: conversation.messages,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      })
    },
  })

  /**
   * GET /api/chat/conversations
   * Lista todas as conversas (últimas 20)
   */
  server.route({
    method: 'GET',
    url: '/api/chat/conversations',
    schema: {
      description: 'List recent conversations',
      tags: ['Chat'],
      response: {
        200: z.object({
          conversations: z.array(
            z.object({
              conversationId: z.string().uuid(),
              messageCount: z.number(),
              lastMessage: z.string(),
              createdAt: z.string().datetime(),
              updatedAt: z.string().datetime(),
            })
          ),
          total: z.number(),
        }),
      },
    },
    handler: async (request, reply) => {
      const conversationsCollection = await getConversationsCollection()

      const conversations = await conversationsCollection
        .find()
        .sort({ updatedAt: -1 })
        .limit(20)
        .toArray()

      const formatted = conversations.map((conv) => ({
        conversationId: conv.conversationId,
        messageCount: conv.messages.length,
        lastMessage: conv.messages[conv.messages.length - 1]?.content || '',
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      }))

      return reply.send({
        conversations: formatted,
        total: formatted.length,
      })
    },
  })
}
