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
    chapter?: string
    section?: string
    page?: number
    type?: string
    bookTitle?: string
  }
  score?: number
}

export interface Conversation {
  id: string
  title: string
  createdAt: Date
  updatedAt: Date
  messages: Message[]
}

// API Request/Response types
export interface ChatRequest {
  message: string
  conversationId?: string
}

export interface ChatResponse {
  message: Message
  conversationId: string
  sources: Source[]
}

export interface ConversationsListResponse {
  conversations: Array<{
    id: string
    title: string
    createdAt: string
    updatedAt: string
    messageCount: number
  }>
}

export interface ConversationHistoryResponse {
  conversation: {
    id: string
    title: string
    createdAt: string
    updatedAt: string
  }
  messages: Array<{
    id: string
    role: MessageRole
    content: string
    timestamp: string
    sources?: Source[]
  }>
}
