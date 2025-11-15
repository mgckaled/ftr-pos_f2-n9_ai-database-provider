import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import cors from '@fastify/cors'
import { env } from '../config/env.js'

/**
 * Plugin que configura CORS
 */
const corsPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  fastify.log.info(`CORS configured with origin: ${env.CORS_ORIGIN}`)
}

export default fp(corsPlugin, {
  name: 'cors-plugin',
  fastify: '5.x',
})
