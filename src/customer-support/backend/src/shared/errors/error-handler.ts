import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { handlePrismaError, isPrismaError } from './prisma-errors.js'
import { handleZodError, isZodError } from './zod-errors.js'

/**
 * Global error handler para Fastify
 * Trata erros do Prisma, Zod e erros genéricos
 */
export async function globalErrorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const statusCode = error.statusCode || 500

  // Log do erro
  if (statusCode >= 500) {
    request.log.error(error)
  } else if (statusCode >= 400) {
    request.log.info(error)
  }

  // Trata erros do Prisma
  if (isPrismaError(error)) {
    const prismaError = handlePrismaError(error)
    return reply.status(prismaError.statusCode).send({
      success: false,
      error: {
        code: prismaError.code || 'PRISMA_ERROR',
        message: prismaError.message,
        details: prismaError.meta,
      },
      timestamp: new Date().toISOString(),
    })
  }

  // Trata erros do Zod
  if (isZodError(error)) {
    const zodError = handleZodError(error)
    return reply.status(zodError.statusCode).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: zodError.message,
        details: zodError.validation,
      },
      timestamp: new Date().toISOString(),
    })
  }

  // Erro padrão
  return reply.status(statusCode).send({
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || 'Erro interno do servidor',
    },
    timestamp: new Date().toISOString(),
  })
}