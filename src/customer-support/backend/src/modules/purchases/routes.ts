import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { PurchasesRepository } from './repositories/purchases.repository.js'
import { PurchasesService } from './services/purchases.service.js'
import {
  CreatePurchaseSchema,
  UpdatePurchaseSchema,
  UpdatePurchaseStatusSchema,
  PurchaseFiltersSchema,
  PurchaseIdParamSchema,
  OrderNumberParamSchema,
  PurchaseSchema,
} from './schemas/purchase.schema.js'
import {
  sendSuccess,
  sendPaginated,
} from '../../shared/utils/response-helpers.js'
import { z } from 'zod'

/**
 * Routes do módulo Purchases
 */
const purchasesRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // Dependency Injection
  const repository = new PurchasesRepository(fastify.prisma)
  const service = new PurchasesService(repository)

  // GET /purchases - Listar com filtros
  fastify.route({
    method: 'GET',
    url: '/',
    schema: {
      querystring: PurchaseFiltersSchema,
      response: {
        200: z.object({
          success: z.literal(true),
          data: z.array(PurchaseSchema.extend({
            customer: z.object({
              id: z.string(),
              firstName: z.string(),
              lastName: z.string(),
              email: z.string(),
            }),
          })),
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
      const filters = request.query
      const { purchases, total } = await service.listPurchases(filters)
      return sendPaginated(reply, purchases, {
        page: filters.page,
        limit: filters.limit,
        total,
      })
    },
  })

  // GET /purchases/:id - Buscar por ID
  fastify.route({
    method: 'GET',
    url: '/:id',
    schema: {
      params: PurchaseIdParamSchema,
      response: {
        200: z.object({
          success: z.literal(true),
          data: PurchaseSchema.extend({
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
      const purchase = await service.getPurchaseById(id)
      return sendSuccess(reply, purchase)
    },
  })

  // GET /purchases/order/:orderNumber - Buscar por número do pedido
  fastify.route({
    method: 'GET',
    url: '/order/:orderNumber',
    schema: {
      params: OrderNumberParamSchema,
      response: {
        200: z.object({
          success: z.literal(true),
          data: PurchaseSchema,
          timestamp: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { orderNumber } = request.params
      const purchase = await service.getPurchaseByOrderNumber(orderNumber)
      return sendSuccess(reply, purchase)
    },
  })

  // POST /purchases - Criar novo
  fastify.route({
    method: 'POST',
    url: '/',
    schema: {
      body: CreatePurchaseSchema,
      response: {
        201: z.object({
          success: z.literal(true),
          data: PurchaseSchema,
          timestamp: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const purchase = await service.createPurchase(request.body)
      return sendSuccess(reply, purchase, 201)
    },
  })

  // PATCH /purchases/:id - Atualizar
  fastify.route({
    method: 'PATCH',
    url: '/:id',
    schema: {
      params: PurchaseIdParamSchema,
      body: UpdatePurchaseSchema,
      response: {
        200: z.object({
          success: z.literal(true),
          data: PurchaseSchema,
          timestamp: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params
      const purchase = await service.updatePurchase(id, request.body)
      return sendSuccess(reply, purchase)
    },
  })

  // PATCH /purchases/:id/status - Atualizar apenas status
  fastify.route({
    method: 'PATCH',
    url: '/:id/status',
    schema: {
      params: PurchaseIdParamSchema,
      body: UpdatePurchaseStatusSchema,
      response: {
        200: z.object({
          success: z.literal(true),
          data: PurchaseSchema,
          timestamp: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params
      const purchase = await service.updatePurchaseStatus(id, request.body)
      return sendSuccess(reply, purchase)
    },
  })

  // DELETE /purchases/:id - Deletar
  fastify.route({
    method: 'DELETE',
    url: '/:id',
    schema: {
      params: PurchaseIdParamSchema,
      response: {
        200: z.object({
          success: z.literal(true),
          data: PurchaseSchema,
          timestamp: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params
      const purchase = await service.deletePurchase(id)
      return sendSuccess(reply, purchase)
    },
  })
}

export default purchasesRoutes