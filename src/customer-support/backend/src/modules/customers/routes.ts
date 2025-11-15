import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { CustomersRepository } from './repositories/customers.repository.js'
import { CustomersService } from './services/customers.service.js'
import {
  CreateCustomerSchema,
  UpdateCustomerSchema,
  PaginationQuerySchema,
  CustomerIdParamSchema,
  CustomerSchema,
} from './schemas/customer.schema.js'
import { PurchaseSchema } from '../purchases/schemas/purchase.schema.js'
import {
  sendSuccess,
  sendPaginated,
} from '../../shared/utils/response-helpers.js'
import { z } from 'zod'

/**
 * Routes do módulo Customers
 */
const customersRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // Dependency Injection
  const repository = new CustomersRepository(fastify.prisma)
  const service = new CustomersService(repository)

  // GET /customers - Listar todos
  fastify.route({
    method: 'GET',
    url: '/',
    schema: {
      querystring: PaginationQuerySchema,
      response: {
        200: z.object({
          success: z.literal(true),
          data: z.array(CustomerSchema),
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
      const { page, limit } = request.query
      const { customers, total } = await service.listCustomers(page, limit)
      return sendPaginated(reply, customers, { page, limit, total })
    },
  })

  // GET /customers/:id - Buscar por ID
  fastify.route({
    method: 'GET',
    url: '/:id',
    schema: {
      params: CustomerIdParamSchema,
      response: {
        200: z.object({
          success: z.literal(true),
          data: CustomerSchema,
          timestamp: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params
      const customer = await service.getCustomerById(id)
      return sendSuccess(reply, customer)
    },
  })

  // GET /customers/:id/purchases - Listar compras do customer
  fastify.route({
    method: 'GET',
    url: '/:id/purchases',
    schema: {
      params: CustomerIdParamSchema,
      querystring: z.object({
        limit: z.coerce.number().int().positive().max(100).default(10),
      }),
      response: {
        200: z.object({
          success: z.literal(true),
          data: z.array(PurchaseSchema),
          timestamp: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params
      const { limit } = request.query
      const purchases = await service.getCustomerPurchases(id, limit)
      return sendSuccess(reply, purchases)
    },
  })

  // POST /customers - Criar novo
  fastify.route({
    method: 'POST',
    url: '/',
    schema: {
      body: CreateCustomerSchema,
      response: {
        201: z.object({
          success: z.literal(true),
          data: CustomerSchema,
          timestamp: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const customer = await service.createCustomer(request.body)
      return sendSuccess(reply, customer, 201)
    },
  })

  // PATCH /customers/:id - Atualizar
  fastify.route({
    method: 'PATCH',
    url: '/:id',
    schema: {
      params: CustomerIdParamSchema,
      body: UpdateCustomerSchema,
      response: {
        200: z.object({
          success: z.literal(true),
          data: CustomerSchema,
          timestamp: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params
      const customer = await service.updateCustomer(id, request.body)
      return sendSuccess(reply, customer)
    },
  })

  // DELETE /customers/:id - Deletar
  fastify.route({
    method: 'DELETE',
    url: '/:id',
    schema: {
      params: CustomerIdParamSchema,
      response: {
        200: z.object({
          success: z.literal(true),
          data: CustomerSchema,
          timestamp: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params
      const customer = await service.deleteCustomer(id)
      return sendSuccess(reply, customer)
    },
  })
}

export default customersRoutes