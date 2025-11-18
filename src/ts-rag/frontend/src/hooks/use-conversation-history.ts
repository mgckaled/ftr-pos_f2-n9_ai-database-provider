/**
 * useConversationHistory Hook
 * Query hook para obter histórico de uma conversa específica
 * Follows TanStack Query v5 best practices
 */

import { useQuery } from '@tanstack/react-query'
import { getConversationHistory } from '@/lib/api'

export function useConversationHistory(conversationId: string | null) {
  return useQuery({
    queryKey: ['conversation-history', conversationId],
    queryFn: () => getConversationHistory(conversationId!),

    // Só executa se conversationId existir
    enabled: !!conversationId,

    // Dados de histórico raramente mudam, podem ficar frescos por mais tempo
    staleTime: 1000 * 60 * 10, // 10 minutos
  })
}
