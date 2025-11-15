import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import { prisma } from '../lib/prisma.js'

/**
 * Extend Fastify types para incluir o Prisma Client
 */
declare module 'fastify' {
  interface FastifyInstance {
    prisma: typeof prisma
  }
}

/**
 * Plugin que registra o Prisma Client no Fastify
 * Disponibiliza via fastify.prisma em todos os handlers
 */
const prismaPlugin: FastifyPluginAsync = async (fastify) => {
  // Decora o Fastify com o Prisma Client
  fastify.decorate('prisma', prisma)

  fastify.log.info('Prisma Client registered')

  // Graceful shutdown - desconecta do banco ao encerrar
  fastify.addHook('onClose', async (instance) => {
    await instance.prisma.$disconnect()
    instance.log.info('Prisma Client disconnected')
  })
}

export default fp(prismaPlugin, {
  name: 'prisma-plugin',
  fastify: '5.x',
})
