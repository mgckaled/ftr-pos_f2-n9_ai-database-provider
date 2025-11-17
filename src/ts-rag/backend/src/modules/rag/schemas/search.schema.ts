/**
 * Zod Schemas para endpoints de Search
 */

import { z } from 'zod'

/**
 * Schema para request de busca
 */
export const searchRequestSchema = z.object({
  query: z
    .string()
    .min(2, 'Query must be at least 2 characters')
    .max(200, 'Query must be less than 200 characters'),
  limit: z.number().int().min(1).max(20).optional().default(5),
  searchType: z.enum(['vector', 'text', 'hybrid']).optional().default('hybrid'),
  filters: z
    .object({
      type: z.enum(['code', 'explanation', 'example', 'reference']).optional(),
      chapter: z.string().optional(),
      section: z.string().optional(),
    })
    .optional(),
})

export type SearchRequest = z.infer<typeof searchRequestSchema>

/**
 * Schema para resultado de busca
 */
export const searchResultSchema = z.object({
  text: z.string(),
  metadata: z.object({
    chapter: z.string(),
    section: z.string().optional(),
    page: z.number(),
    type: z.enum(['code', 'explanation', 'example', 'reference']),
    bookTitle: z.string(),
  }),
  score: z.number(),
})

/**
 * Schema para response de busca
 */
export const searchResponseSchema = z.object({
  results: z.array(searchResultSchema),
  total: z.number(),
  searchType: z.enum(['vector', 'text', 'hybrid']),
  timestamp: z.string().datetime(),
})

export type SearchResponse = z.infer<typeof searchResponseSchema>
