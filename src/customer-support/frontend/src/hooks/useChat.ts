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

      const response = await api.get<{
        success: boolean
        data: Array<{
          id: string
          customerId: string
          status: string
          createdAt: string
          updatedAt: string
          messages: Array<{
            id: number
            conversationId: string
            role: 'USER' | 'ASSISTANT'
            content: string
            metadata: Record<string, string> | null
            createdAt: string
          }>
        }>
        pagination: {
          page: number
          limit: number
          total: number
          totalPages: number
        }
      }>(`/chat/conversations/${customerId}`, {
        params: { page: 1, limit: 100 }, // Busca até 100 conversas
      })

      if (!response.data.success || !response.data.data) {
        return []
      }

      // Extrai todas as mensagens de todas as conversações
      const allMessages: Message[] = []

      response.data.data.forEach((conversation) => {
        conversation.messages.forEach((msg) => {
          allMessages.push({
            id: `msg-${msg.id}`,
            role: msg.role === 'USER' ? 'user' : 'assistant',
            content: msg.content,
            timestamp: new Date(msg.createdAt),
          })
        })
      })

      // Ordena por timestamp (mais antigas primeiro)
      return allMessages.sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
      )
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
