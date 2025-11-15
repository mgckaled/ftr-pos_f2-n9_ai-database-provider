import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'

/**
 * Plugin que configura validação automática com Zod
 * Permite usar schemas Zod diretamente nas rotas
 */
const zodPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.setValidatorCompiler(validatorCompiler)
  fastify.setSerializerCompiler(serializerCompiler)

  fastify.log.info('Zod validation configured')
}

export default fp(zodPlugin, {
  name: 'zod-plugin',
  fastify: '5.x',
})