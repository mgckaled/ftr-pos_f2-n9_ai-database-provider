import { useState, useEffect } from "react"
import { type Message } from "@/types/chat.types"
import { MessageList } from "./message-list"
import { MessageInput } from "./message-input"
import { MessageSkeleton } from "./message-skeleton"
import { useSendMessage, useConversationHistory } from "@/hooks"
import { ApiError } from "@/lib/api"
import { useConversation } from "@/contexts/conversation-context"

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const { conversationId, setConversationId, startNewChat } = useConversation()

  // TanStack Query hooks
  const { mutate: sendMessage, isPending } = useSendMessage()
  const { data: historyData, isLoading: isLoadingHistory } = useConversationHistory(conversationId)

  // Carrega histórico quando conversationId muda
  useEffect(() => {
    if (conversationId && historyData) {
      // Converte mensagens do backend para formato local
      const loadedMessages: Message[] = historyData.messages.map((msg, index) => ({
        id: `${conversationId}-${index}`,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        sources: msg.sources,
      }))
      setMessages(loadedMessages)
    } else if (!conversationId) {
      // Nova conversa - limpa mensagens
      setMessages([])
    }
  }, [conversationId, historyData])

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

          // Detecta tipo de erro e fornece mensagem apropriada
          let errorMessage = 'Erro ao enviar mensagem. Tente novamente.'

          if (error instanceof ApiError && error.status === 429) {
            // Verifica se é erro de quota de embeddings
            const errorData = error.data as any
            const isEmbeddingQuota = errorData?.message?.includes('embed') ||
                                    errorData?.message?.includes('embedding')

            if (isEmbeddingQuota) {
              errorMessage = '**Quota de Embeddings Excedida**\n\n' +
                'O limite diário da API de embeddings do Gemini foi atingido. ' +
                'A quota reseta à meia-noite (Horário do Pacífico - PST).\n\n' +
                '💡 *Dica:* Para uso contínuo, considere fazer upgrade do plano no Google AI Studio.'
            } else {
              errorMessage = '**Limite de Requisições Atingido**\n\n' +
                'Aguarde alguns segundos e tente novamente. ' +
                'A API do Gemini tem limite de 10 requisições por minuto no plano gratuito.'
            }
          }

          const errorMsg: Message = {
            id: `error-${Date.now()}`,
            role: 'assistant',
            content: `⚠️ ${errorMessage}`,
            timestamp: new Date()
          }

          setMessages(prev => [...prev, errorMsg])
        }
      }
    )
  }

  return (
    <div className="flex flex-col h-full">
      <MessageList messages={messages} isLoadingResponse={isPending}>
        {isPending && <MessageSkeleton />}
      </MessageList>
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
