import { ZodError } from 'zod'
import type { FastifyError } from 'fastify'

/**
 * Verifica se o erro é um erro de validação do Zod
 */
export function isZodError(error: unknown): error is ZodError {
  return error instanceof ZodError
}

/**
 * Transforma erros do Zod em FastifyError
 */
export function handleZodError(error: ZodError): FastifyError {
  const formattedErrors = error.flatten()

  return {
    statusCode: 400,
    name: 'ValidationError',
    message: 'Erro de validação',
    validation: formattedErrors.fieldErrors,
  } as FastifyError
}