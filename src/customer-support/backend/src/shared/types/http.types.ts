import { z } from 'zod'

/**
 * Response padrão de sucesso
 */
export interface SuccessResponse<T = unknown> {
  success: true
  data: T
  timestamp: string
}

/**
 * Response padrão de erro
 */
export interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
  timestamp: string
}

/**
 * Response com paginação
 */
export interface PaginatedResponse<T> {
  success: true
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  timestamp: string
}

/**
 * Parâmetros de paginação
 */
export interface PaginationParams {
  page: number
  limit: number
}

/**
 * Helper para inferir tipos de schemas Zod
 */
export type InferZodSchema<T extends z.ZodTypeAny> = z.infer<T>