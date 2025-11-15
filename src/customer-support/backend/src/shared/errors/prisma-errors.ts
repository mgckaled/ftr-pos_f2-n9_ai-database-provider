import { Prisma } from '@prisma/client'
import type { FastifyError } from 'fastify'

/**
 * Verifica se o erro é um erro conhecido do Prisma
 */
export function isPrismaError(
  error: unknown
): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError
}

/**
 * Mapeia erros do Prisma para respostas HTTP
 */
export function handlePrismaError(
  error: Prisma.PrismaClientKnownRequestError
): FastifyError {
  const errorMap: Record<string, { statusCode: number; message: string }> = {
    // Unique constraint violation
    P2002: {
      statusCode: 409,
      message: 'Já existe um registro com esse valor único',
    },
    // Record not found
    P2025: {
      statusCode: 404,
      message: 'Registro não encontrado',
    },
    // Foreign key constraint failed
    P2003: {
      statusCode: 400,
      message: 'Referência inválida',
    },
    // Required relation violation
    P2014: {
      statusCode: 400,
      message: 'Violação de relação obrigatória',
    },
  }

  const mapped = errorMap[error.code] || {
    statusCode: 500,
    message: 'Erro no banco de dados',
  }

  return {
    statusCode: mapped.statusCode,
    name: 'PrismaError',
    message: mapped.message,
    code: error.code,
    meta: error.meta,
  } as FastifyError
}