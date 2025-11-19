/**
 * useSendMessage Hook
 * Mutation hook para enviar mensagens ao chat RAG
 * Follows TanStack Query v5 best practices
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sendMessage } from '@/lib/api'
import type { ChatRequest, ChatResponse } from '@/types/chat.types'

export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: ChatRequest) => sendMessage(request),

    // Mutation key para identificação e debug
    mutationKey: ['send-message'],

    // Invalida cache das conversas e histórico após enviar mensagem
    onSuccess: (data: ChatResponse) => {
      // Invalida lista de conversas para mostrar título atualizado
      queryClient.invalidateQueries({ queryKey: ['conversations'] })

      // Invalida histórico da conversa atual
      queryClient.invalidateQueries({
        queryKey: ['conversation-history', data.conversationId]
      })
    },
  })
}
