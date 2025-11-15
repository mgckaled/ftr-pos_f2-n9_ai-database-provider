/**
 * Hook para gerenciar chat com IA
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  ChatHistoryResponse,
  ChatSendRequest,
  ChatSendResponse,
  Message,
} from '@/types/chat'

export function useChatHistory(customerId: string | null) {
  return useQuery({
    queryKey: ['chat-history', customerId],
    queryFn: async () => {
      if (!customerId) return null

      const response = await api.get<ChatHistoryResponse>(
        `/chat/conversations/${customerId}`,
      )

      if (!response.data.success || !response.data.data) {
        return []
      }

      // Converte para formato Message[]
      const messages: Message[] = response.data.data.conversations.map(
        (conv, index) => ({
          id: `${customerId}-${index}`,
          role: conv.role,
          content: conv.content,
          timestamp: new Date(conv.timestamp),
        }),
      )

      return messages
    },
    enabled: !!customerId,
    staleTime: 1000 * 60, // 1 minuto
  })
}

export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: ChatSendRequest) => {
      const response = await api.post<ChatSendResponse>('/chat/send', request)
      return response.data
    },
    onSuccess: (data, variables) => {
      // Invalida o histórico do chat para recarregar
      queryClient.invalidateQueries({
        queryKey: ['chat-history', variables.customerId],
      })
    },
  })
}
