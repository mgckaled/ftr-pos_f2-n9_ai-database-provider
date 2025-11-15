import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { ConversationsRepository } from './repositories/conversations.repository.js'
import { MessagesRepository } from './repositories/messages.repository.js'
import { CustomersRepository } from '../customers/repositories/customers.repository.js'
import { PurchasesRepository } from '../purchases/repositories/purchases.repository.js'
import { GeminiService } from './services/gemini.service.js'
import { ChatService } from './services/chat.service.js'
import {
  SendMessageSchema,
  ChatResponseSchema,
  ConversationIdParamSchema,
  CustomerIdParamSchema,
  MessagePaginationSchema,
  CreateConversationSchema,
  UpdateConversationStatusSchema,
  ConversationSchema,
  MessageSchema,
} from './schemas/chat.schema.js'
import { sendSuccess, sendPaginated } from '../../shared/utils/response-helpers.js'
import { z } from 'zod'

/**
 * Routes do módulo Chat
 */
const chatRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // Dependency Injection
  const conversationsRepo = new ConversationsRepository(fastify.prisma)
  const messagesRepo = new MessagesRepository(fastify.prisma)
  const customersRepo = new CustomersRepository(fastify.prisma)
  const purchasesRepo = new PurchasesRepository(fastify.prisma)
  const geminiService = new GeminiService()
  const service = new ChatService(
    conversationsRepo,
    messagesRepo,
    customersRepo,
    purchasesRepo,
    geminiService
  )

  // POST /chat/send - Enviar mensagem e receber resposta
  fastify.route({
    method: 'POST',
    url: '/send',
    schema: {
      body: SendMessageSchema,
      response: {
        200: z.object({
          success: z.literal(true),
          data: ChatResponseSchema,
          timestamp: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const response = await service.sendMessage(request.body)
      return sendSuccess(reply, response)
    },
  })

  // GET /chat/conversations/:customerId - Listar conversations de um customer
  fastify.route({
    method: 'GET',
    url: '/conversations/:customerId',
    schema: {
      params: CustomerIdParamSchema,
      querystring: z.object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(10),
      }),
      response: {
        200: z.object({
          success: z.literal(true),
          data: z.array(
            ConversationSchema.extend({
              messages: z.array(MessageSchema),
            })
          ),
          pagination: z.object({
            page: z.number(),
            limit: z.number(),
            total: z.number(),
            totalPages: z.number(),
          }),
          timestamp: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { customerId } = request.params
      const { page, limit } = request.query
      const { conversations, total } = await service.listCustomerConversations(
        customerId,
        page,
        limit
      )
      return sendPaginated(reply, conversations, { page, limit, total })
    },
  })

  // GET /chat/conversation/:id - Buscar conversation com mensagens
  fastify.route({
    method: 'GET',
    url: '/conversation/:id',
    schema: {
      params: ConversationIdParamSchema,
      querystring: z.object({
        messageLimit: z.coerce.number().int().positive().max(200).default(50),
      }),
      response: {
        200: z.object({
          success: z.literal(true),
          data: ConversationSchema.extend({
            messages: z.array(MessageSchema),
            customer: z.object({
              id: z.string(),
              firstName: z.string(),
              lastName: z.string(),
              email: z.string(),
            }),
          }),
          timestamp: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params
      const { messageLimit } = request.query
      const conversation = await service.getConversationById(id, messageLimit)
      return sendSuccess(reply, conversation)
    },
  })

  // GET /chat/conversation/:id/messages - Buscar mensagens de uma conversation
  fastify.route({
    method: 'GET',
    url: '/conversation/:id/messages',
    schema: {
      params: ConversationIdParamSchema,
      querystring: MessagePaginationSchema,
      response: {
        200: z.object({
          success: z.literal(true),
          data: z.array(MessageSchema),
          pagination: z.object({
            offset: z.number(),
            limit: z.number(),
            total: z.number(),
          }),
          timestamp: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params
      const { offset, limit } = request.query
      const { messages, total } = await service.getConversationMessages(
        id,
        offset,
        limit
      )
      return reply.status(200).send({
        success: true,
        data: messages,
        pagination: { offset, limit, total },
        timestamp: new Date().toISOString(),
      })
    },
  })

  // POST /chat/conversation - Criar nova conversation
  fastify.route({
    method: 'POST',
    url: '/conversation',
    schema: {
      body: CreateConversationSchema,
      response: {
        201: z.object({
          success: z.literal(true),
          data: ConversationSchema,
          timestamp: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const conversation = await service.createConversation(request.body)
      return sendSuccess(reply, conversation, 201)
    },
  })

  // PATCH /chat/conversation/:id/status - Atualizar status da conversation
  fastify.route({
    method: 'PATCH',
    url: '/conversation/:id/status',
    schema: {
      params: ConversationIdParamSchema,
      body: UpdateConversationStatusSchema,
      response: {
        200: z.object({
          success: z.literal(true),
          data: ConversationSchema,
          timestamp: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params
      const conversation = await service.updateConversationStatus(id, request.body)
      return sendSuccess(reply, conversation)
    },
  })

  // DELETE /chat/conversation/:id - Deletar conversation
  fastify.route({
    method: 'DELETE',
    url: '/conversation/:id',
    schema: {
      params: ConversationIdParamSchema,
      response: {
        200: z.object({
          success: z.literal(true),
          data: ConversationSchema,
          timestamp: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params
      const conversation = await service.deleteConversation(id)
      return sendSuccess(reply, conversation)
    },
  })

  // GET /chat/rate-limit-stats - Estatísticas do rate limiter
  fastify.route({
    method: 'GET',
    url: '/rate-limit-stats',
    schema: {
      response: {
        200: z.object({
          success: z.literal(true),
          data: z.object({
            requestsInLastMinute: z.number(),
            remainingRequests: z.number(),
          }),
          timestamp: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const stats = service.getRateLimitStats()
      return sendSuccess(reply, stats)
    },
  })
}

export default chatRoutes