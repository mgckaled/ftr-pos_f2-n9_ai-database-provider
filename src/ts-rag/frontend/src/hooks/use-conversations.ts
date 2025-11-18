/**
 * useConversations Hook
 * Query hook para listar conversas recentes
 * Follows TanStack Query v5 best practices
 */

import { useQuery } from '@tanstack/react-query'
import { getConversations } from '@/lib/api'

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,

    // Refetch a cada 30 segundos quando a janela está focada
    // (para pegar novas conversas de outras abas/dispositivos)
    refetchInterval: 1000 * 30,

    // Considerar dados frescos por 1 minuto
    staleTime: 1000 * 60,
  })
}
