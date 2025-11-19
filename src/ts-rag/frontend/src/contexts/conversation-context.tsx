/**
 * Conversation Context
 *
 * Gerencia o estado global da conversa atual entre Sidebar e Chat
 * sem necessidade de prop drilling através do Layout
 */

import { createContext, useContext, useState, type ReactNode } from 'react'

interface ConversationContextType {
  conversationId: string | null
  setConversationId: (id: string | null) => void
  startNewChat: () => void
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined)

export function ConversationProvider({ children }: { children: ReactNode }) {
  const [conversationId, setConversationId] = useState<string | null>(null)

  const startNewChat = () => {
    setConversationId(null)
  }

  return (
    <ConversationContext.Provider value={{ conversationId, setConversationId, startNewChat }}>
      {children}
    </ConversationContext.Provider>
  )
}

export function useConversation() {
  const context = useContext(ConversationContext)
  if (context === undefined) {
    throw new Error('useConversation must be used within a ConversationProvider')
  }
  return context
}
