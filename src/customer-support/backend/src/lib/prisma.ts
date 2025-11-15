import { PrismaClient } from '@prisma/client'
import { env, isDevelopment } from '@/config/env.js'

/**
 * Global type augmentation para Prisma Client
 * Necessário para o padrão singleton em desenvolvimento
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Prisma Client Singleton
 *
 * Em desenvolvimento, reutiliza a instância para evitar
 * múltiplas conexões durante hot-reload
 *
 * Em produção, cria uma nova instância
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    errorFormat: isDevelopment ? 'pretty' : 'minimal',
  })

/**
 * Armazenar instância em globalThis apenas em desenvolvimento
 * Previne múltiplas instâncias durante hot-reload
 */
if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

/**
 * Graceful shutdown
 * Desconecta do banco ao encerrar a aplicação
 */
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})
