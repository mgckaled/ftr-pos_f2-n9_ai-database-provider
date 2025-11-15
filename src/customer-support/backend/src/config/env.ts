import { z } from 'zod'
import dotenv from 'dotenv'

// Carregar variáveis de ambiente
dotenv.config()

/**
 * Schema de validação das variáveis de ambiente
 * Usando Zod para garantir type-safety e validação em runtime
 */
const envSchema = z.object({
  // Server
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3333),
  HOST: z.string().default('0.0.0.0'),

  // Database
  DATABASE_URL: z.string().url('DATABASE_URL deve ser uma URL válida'),
  DIRECT_URL: z.string().url().optional(),

  // Google Gemini AI
  GEMINI_API_KEY: z
    .string()
    .min(1, 'GEMINI_API_KEY é obrigatória')
    .describe('API Key do Google Gemini AI'),
  GEMINI_MODEL: z.string().default('gemini-1.5-flash'),

  // CORS
  CORS_ORIGIN: z.string().url().default('http://localhost:5173'),

  // Logging
  LOG_LEVEL: z
    .enum(['debug', 'info', 'warn', 'error'])
    .default('info'),
})

/**
 * Tipo inferido do schema de validação
 */
export type Env = z.infer<typeof envSchema>

/**
 * Validar e exportar variáveis de ambiente
 * Lança erro se alguma variável estiver inválida ou faltando
 */
function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env)

  if (!parsed.success) {
    console.error('❌ Erro na validação das variáveis de ambiente:')
    console.error(parsed.error.format())
    throw new Error('Variáveis de ambiente inválidas')
  }

  return parsed.data
}

/**
 * Variáveis de ambiente validadas e tipadas
 * Use este objeto em toda a aplicação ao invés de process.env
 */
export const env = validateEnv()

/**
 * Helper para verificar se está em ambiente de desenvolvimento
 */
export const isDevelopment = env.NODE_ENV === 'development'

/**
 * Helper para verificar se está em ambiente de produção
 */
export const isProduction = env.NODE_ENV === 'production'

/**
 * Helper para verificar se está em ambiente de teste
 */
export const isTest = env.NODE_ENV === 'test'
