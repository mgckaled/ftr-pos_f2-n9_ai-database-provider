/**
 * useSendMessage Hook
 * Mutation hook para enviar mensagens ao chat RAG
 * Follows TanStack Query v5 best practices
 */

import { useMutation } from '@tanstack/react-query'
import { sendMessage } from '@/lib/api'
import type { ChatRequest, ChatResponse } from '@/types/chat.types'

export function useSendMessage() {
  return useMutation({
    mutationFn: (request: ChatRequest) => sendMessage(request),

    // Mutation key para identificação e debug
    mutationKey: ['send-message'],

    // Callback de sucesso (opcional, pode ser usado no componente)
    // onSuccess: (data: ChatResponse) => {
    //   console.log('Mensagem enviada com sucesso:', data)
    // },

    // Callback de erro (opcional, pode ser usado no componente)
    // onError: (error: Error) => {
    //   console.error('Erro ao enviar mensagem:', error)
    // },
  })
}
