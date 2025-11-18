import { useState } from "react"
import { type Message } from "@/types/chat.types"
import { MessageList } from "./message-list"
import { MessageInput } from "./message-input"
import { useSendMessage } from "@/hooks"
import { ApiError } from "@/lib/api"

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)

  // TanStack Query mutation hook
  const { mutate: sendMessage, isPending, isError, error } = useSendMessage()

  const handleSendMessage = (content: string) => {
    // Adiciona mensagem do usuário imediatamente (optimistic update)
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])

    // Envia para o backend usando TanStack Query
    sendMessage(
      {
        question: content,
        conversationId: conversationId || undefined,
        useCache: true,
        useHybridSearch: true,
        topK: 5,
      },
      {
        onSuccess: (data) => {
          // Salva conversationId para próximas mensagens
          if (!conversationId) {
            setConversationId(data.conversationId)
          }

          // Adiciona resposta do assistente
          const assistantMessage: Message = {
            id: data.conversationId + '-' + data.timestamp,
            role: 'assistant',
            content: data.response,
            timestamp: new Date(data.timestamp),
            sources: data.sources,
          }

          setMessages(prev => [...prev, assistantMessage])
        },
        onError: (error) => {
          console.error('Erro ao enviar mensagem:', error)

          // Remove a mensagem do usuário em caso de erro
          setMessages(prev => prev.filter(m => m.id !== userMessage.id))

          // Adiciona mensagem de erro
          const errorMessage = error instanceof ApiError && error.status === 429
            ? 'Limite de requisições atingido. Aguarde alguns segundos e tente novamente.'
            : 'Erro ao enviar mensagem. Tente novamente.'

          const errorMsg: Message = {
            id: `error-${Date.now()}`,
            role: 'assistant',
            content: `⚠️ **Erro:** ${errorMessage}`,
            timestamp: new Date()
          }

          setMessages(prev => [...prev, errorMsg])
        }
      }
    )
  }

  return (
    <div className="flex flex-col h-full">
      <MessageList messages={messages} />
      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={isPending}
        placeholder={
          isPending
            ? "Aguardando resposta..."
            : messages.length === 0
            ? "Pergunte sobre TypeScript..."
            : "Continue a conversa..."
        }
      />
    </div>
  )
}
