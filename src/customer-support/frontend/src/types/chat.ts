/**
 * Types para Chat (consistente com backend)
 */

export type MessageRole = 'user' | 'assistant'

export interface Message {
  id: string
  role: MessageRole
  content: string
  timestamp: Date
}

export interface Conversation {
  customerId: string
  messages: Message[]
  lastUpdated: Date
}

export interface ChatSendRequest {
  customerId: string
  message: string
}

export interface ChatSendResponse {
  success: boolean
  data?: {
    customerId: string
    userMessage: string
    aiResponse: string
    timestamp: string
  }
  error?: {
    code: string
    message: string
  }
}

export interface ChatHistoryResponse {
  success: boolean
  data?: {
    customerId: string
    conversations: Array<{
      role: MessageRole
      content: string
      timestamp: string
    }>
  }
  error?: {
    code: string
    message: string
  }
}