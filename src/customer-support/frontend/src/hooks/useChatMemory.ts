/**
 * Hook para gerenciar memória do chat em localStorage
 */

import { useEffect, useState } from 'react'
import type { Conversation, Message } from '@/types/chat'

const STORAGE_KEY = 'customer-support-chat-memory'

interface ChatMemory {
  [customerId: string]: Conversation
}

export function useChatMemory(customerId: string | null) {
  const [localMessages, setLocalMessages] = useState<Message[]>([])

  // Carrega mensagens do localStorage ao montar/trocar cliente
  useEffect(() => {
    if (!customerId) {
      setLocalMessages([])
      return
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const memory: ChatMemory = JSON.parse(stored)
        const conversation = memory[customerId]

        if (conversation) {
          // Converte timestamps de string para Date
          const messages = conversation.messages.map((msg) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }))
          setLocalMessages(messages)
        } else {
          setLocalMessages([])
        }
      }
    } catch (error) {
      console.error('Error loading chat memory:', error)
      setLocalMessages([])
    }
  }, [customerId])

  const saveMessages = (messages: Message[]) => {
    if (!customerId) return

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      const memory: ChatMemory = stored ? JSON.parse(stored) : {}

      memory[customerId] = {
        customerId,
        messages,
        lastUpdated: new Date(),
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(memory))
      setLocalMessages(messages)
    } catch (error) {
      console.error('Error saving chat memory:', error)
    }
  }

  const addMessage = (message: Message) => {
    const newMessages = [...localMessages, message]
    saveMessages(newMessages)
  }

  const clearMessages = () => {
    if (!customerId) return

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const memory: ChatMemory = JSON.parse(stored)
        delete memory[customerId]
        localStorage.setItem(STORAGE_KEY, JSON.stringify(memory))
      }
      setLocalMessages([])
    } catch (error) {
      console.error('Error clearing chat memory:', error)
    }
  }

  return {
    messages: localMessages,
    saveMessages,
    addMessage,
    clearMessages,
  }
}
