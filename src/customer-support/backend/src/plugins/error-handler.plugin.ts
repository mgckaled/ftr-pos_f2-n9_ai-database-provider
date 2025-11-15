import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import { globalErrorHandler } from '../shared/errors/error-handler.js'

/**
 * Plugin que configura o error handler global
 * Trata erros do Prisma, Zod e erros genéricos
 */
const errorHandlerPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.setErrorHandler(globalErrorHandler)

  fastify.log.info('Global error handler configured')
}

export default fp(errorHandlerPlugin, {
  name: 'error-handler-plugin',
  fastify: '5.x',
})
