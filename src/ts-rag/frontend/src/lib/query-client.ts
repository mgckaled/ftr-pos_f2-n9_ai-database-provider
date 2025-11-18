/**
 * TanStack Query Client Configuration
 * Optimized defaults based on TanStack Query v5 best practices
 * Includes Gemini API rate limit handling
 */

import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './api'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Dados considerados "frescos" por 5 minutos
      staleTime: 1000 * 60 * 5,

      // Cache mantido em memória por 10 minutos
      gcTime: 1000 * 60 * 10,

      // Retry strategy adaptada para Gemini API rate limits
      retry: (failureCount, error) => {
        // Se for 429 (rate limit), permite até 2 retries com backoff
        if (error instanceof ApiError && error.status === 429) {
          return failureCount < 2
        }
        // Outros erros: apenas 1 retry
        return failureCount < 1
      },

      // Exponential backoff com consideração especial para 429
      retryDelay: (attemptIndex, error) => {
        // Para rate limit (429): exponential backoff mais agressivo
        if (error instanceof ApiError && error.status === 429) {
          // 1s, 2s, 4s, 8s... máximo 30s
          return Math.min(1000 * 2 ** attemptIndex, 30000)
        }
        // Outros erros: delay fixo de 1s
        return 1000
      },

      // Não refetch automaticamente ao focar na janela
      refetchOnWindowFocus: false,

      // Refetch ao reconectar à internet
      refetchOnReconnect: true,

      // Usar Error como tipo padrão de erro (não unknown)
      // Isso permite melhor inferência de tipos
    },
    mutations: {
      // Mutations: retry apenas para 429 (rate limit)
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status === 429) {
          return failureCount < 2
        }
        return false
      },

      // Mesmo backoff exponencial para mutations
      retryDelay: (attemptIndex, error) => {
        if (error instanceof ApiError && error.status === 429) {
          return Math.min(1000 * 2 ** attemptIndex, 30000)
        }
        return 1000
      },
    },
  },
})
