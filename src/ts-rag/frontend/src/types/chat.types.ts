/**
 * Chat Types - TypeScript RAG Frontend
 *
 * Type definitions for chat messages, conversations, and API responses
 */

export type MessageRole = 'user' | 'assistant'

export interface Message {
  id: string
  role: MessageRole
  content: string
  timestamp: Date
  sources?: Source[]
}

export interface Source {
  text: string
  metadata: {
    page: number
    chapter: string
    section?: string
    type: string
    score: number
  }
}

export interface Conversation {
  id: string
  title: string
  createdAt: Date
  updatedAt: Date
  messages: Message[]
}

// API Request/Response types (aligned with backend Zod schemas)
export interface ChatRequest {
  question: string
  conversationId?: string
  useCache?: boolean
  useHybridSearch?: boolean
  topK?: number
  filters?: {
    type?: 'code' | 'explanation' | 'example' | 'reference'
    chapter?: string
    section?: string
  }
}

export interface ChatResponse {
  response: string
  sources: Source[]
  conversationId: string
  fromCache: boolean
  timestamp: string
}

export interface ConversationsResponse {
  conversations: Array<{
    conversationId: string
    title?: string
    messageCount: number
    lastMessage: string
    createdAt: string
    updatedAt: string
  }>
  total: number
}

export interface ConversationHistoryResponse {
  conversationId: string
  title?: string
  messages: Array<{
    role: MessageRole
    content: string
    timestamp: string
    sources?: Source[]
  }>
  createdAt: string
  updatedAt: string
}
