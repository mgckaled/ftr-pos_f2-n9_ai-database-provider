import type { FastifyReply } from 'fastify'
import type {
  SuccessResponse,
  PaginatedResponse,
} from '../types/http.types.js'

/**
 * Envia uma resposta de sucesso padronizada
 */
export function sendSuccess<T>(
  reply: FastifyReply,
  data: T,
  statusCode: number = 200
): FastifyReply {
  const response: SuccessResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  }
  return reply.status(statusCode).send(response)
}

/**
 * Envia uma resposta com paginação
 */
export function sendPaginated<T>(
  reply: FastifyReply,
  data: T[],
  pagination: { page: number; limit: number; total: number }
): FastifyReply {
  const response: PaginatedResponse<T> = {
    success: true,
    data,
    pagination: {
      ...pagination,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    },
    timestamp: new Date().toISOString(),
  }
  return reply.status(200).send(response)
}