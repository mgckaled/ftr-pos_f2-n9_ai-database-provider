/**
 * Interface principal do chat
 */

import { useMemo } from 'react'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { useChatHistory, useSendMessage } from '@/hooks/useChat'
import { useChatMemory } from '@/hooks/useChatMemory'
import type { Message } from '@/types/chat'

interface ChatInterfaceProps {
  customerId: string
}

export function ChatInterface({ customerId }: ChatInterfaceProps) {
  // Busca histórico do backend
  const { data: historyData, isLoading: isLoadingHistory } = useChatHistory(customerId)

  // Memória local
  const { messages: localMessages, addMessage } = useChatMemory(customerId)

  // Mutation para enviar mensagem
  const { mutate: sendMessage, isPending } = useSendMessage()

  // Combina mensagens do histórico com mensagens locais
  const allMessages = useMemo(() => {
    const history = historyData || []

    // Remove duplicatas baseado no conteúdo e timestamp próximos
    const uniqueMessages = new Map<string, Message>()

    ;[...history, ...localMessages].forEach((msg) => {
      const key = `${msg.role}-${msg.content}-${Math.floor(msg.timestamp.getTime() / 1000)}`
      if (!uniqueMessages.has(key)) {
        uniqueMessages.set(key, msg)
      }
    })

    // Ordena por timestamp
    return Array.from(uniqueMessages.values()).sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    )
  }, [historyData, localMessages])

  const handleSendMessage = (content: string) => {
    // Cria mensagem do usuário
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    }

    // Adiciona à memória local imediatamente
    addMessage(userMessage)

    // Envia para o backend
    sendMessage(
      {
        customerId,
        message: content,
      },
      {
        onSuccess: (response) => {
          if (response.success && response.data && response.data.assistantMessage) {
            // Adiciona resposta da IA à memória local
            const aiMessage: Message = {
              id: `assistant-${response.data.assistantMessage.id}`,
              role: 'assistant',
              content: response.data.assistantMessage.content,
              timestamp: new Date(response.data.assistantMessage.createdAt),
            }
            addMessage(aiMessage)
          }
        },
        onError: (error) => {
          console.error('Erro ao enviar mensagem:', error)
          // TODO: Adicionar toast de erro
        },
      }
    )
  }

  return (
    <div className="flex h-full flex-col">
      <MessageList
        messages={allMessages}
        isLoading={isPending || isLoadingHistory}
      />
      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={isPending}
        placeholder={
          isPending
            ? 'Aguardando resposta...'
            : 'Digite sua mensagem...'
        }
      />
    </div>
  )
}
