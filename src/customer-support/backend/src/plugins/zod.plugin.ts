import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import {
  createSerializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { Prisma } from '@prisma/client'

/**
 * Plugin que configura validação automática com Zod
 * Permite usar schemas Zod diretamente nas rotas
 */
const zodPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.setValidatorCompiler(validatorCompiler)

  // Configura serializerCompiler customizado para lidar com tipos Prisma
  // Converte Prisma.Decimal para number durante serialização JSON
  const customSerializerCompiler = createSerializerCompiler({
    replacer: function (key, value) {
      // Converte Prisma Decimal para number
      if (value instanceof Prisma.Decimal) {
        return value.toNumber()
      }
      // Converte BigInt para string (JSON não suporta BigInt nativamente)
      if (typeof value === 'bigint') {
        return value.toString()
      }
      // Retorna demais valores sem alteração
      return value
    },
  })

  fastify.setSerializerCompiler(customSerializerCompiler)

  fastify.log.info('Zod validation configured with custom serializer')
}

export default fp(zodPlugin, {
  name: 'zod-plugin',
  fastify: '5.x',
})