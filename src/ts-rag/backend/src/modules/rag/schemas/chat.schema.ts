/**
 * Zod Schemas para endpoints de Chat
 */

import { z } from 'zod'

/**
 * Schema para request de chat
 */
export const chatRequestSchema = z.object({
  question: z
    .string()
    .min(3, 'Question must be at least 3 characters')
    .max(500, 'Question must be less than 500 characters'),
  conversationId: z.string().uuid().optional(),
  useCache: z.boolean().optional().default(true),
  useHybridSearch: z.boolean().optional().default(true),
  topK: z.number().int().min(1).max(10).optional().default(5),
  filters: z
    .object({
      type: z.enum(['code', 'explanation', 'example', 'reference']).optional(),
      chapter: z.string().optional(),
      section: z.string().optional(),
    })
    .optional(),
})

export type ChatRequest = z.infer<typeof chatRequestSchema>

/**
 * Schema para source de resposta
 * Estrutura retornada pelo RAGService
 */
export const sourceSchema = z.object({
  text: z.string(),
  metadata: z.object({
    page: z.number(),
    chapter: z.string(),
    section: z.string().optional(),
    type: z.string(), // Tipo genérico pois vem do MongoDB
    score: z.number(),
  }),
})

/**
 * Schema para response de chat
 */
export const chatResponseSchema = z.object({
  response: z.string(),
  sources: z.array(sourceSchema),
  conversationId: z.string().uuid(),
  fromCache: z.boolean(),
  timestamp: z.string().datetime(),
})

export type ChatResponse = z.infer<typeof chatResponseSchema>

/**
 * Schema para histórico de conversa
 */
export const conversationHistorySchema = z.object({
  conversationId: z.string().uuid(),
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
      timestamp: z.string().datetime(),
      sources: z.array(sourceSchema).optional(),
    })
  ),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type ConversationHistory = z.infer<typeof conversationHistorySchema>
