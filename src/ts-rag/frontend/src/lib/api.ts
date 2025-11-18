/**
 * API Client Layer
 * Type-safe fetch wrapper for backend integration
 * Using native fetch (no Axios) following TanStack Query v5 best practices
 */

import type {
  ChatRequest,
  ChatResponse,
  ConversationsResponse,
  ConversationHistoryResponse,
} from '@/types/chat.types'

// API Base URL - configurável via env
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3333'

/**
 * Custom error class for API errors
 * Follows MongoDB REST API best practices for error handling
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Type-safe fetch wrapper with error handling
 * Throws ApiError for non-2xx responses (required by TanStack Query)
 */
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    // Fetch doesn't throw on non-2xx by default, so we check manually
    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new ApiError(
        errorData?.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      )
    }

    // Parse JSON response
    return await response.json()
  } catch (error) {
    // Re-throw ApiError as-is
    if (error instanceof ApiError) {
      throw error
    }

    // Network or parsing errors
    throw new ApiError(
      error instanceof Error ? error.message : 'An unknown error occurred',
      0
    )
  }
}

/**
 * POST /api/chat
 * Send a question and get AI-powered response with sources
 */
export async function sendMessage(request: ChatRequest): Promise<ChatResponse> {
  return fetchApi<ChatResponse>('/api/chat', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

/**
 * GET /api/chat/conversations
 * List recent conversations (últimas 20)
 */
export async function getConversations(): Promise<ConversationsResponse> {
  return fetchApi<ConversationsResponse>('/api/chat/conversations')
}

/**
 * GET /api/chat/history/:conversationId
 * Get conversation history by ID
 */
export async function getConversationHistory(
  conversationId: string
): Promise<ConversationHistoryResponse> {
  return fetchApi<ConversationHistoryResponse>(
    `/api/chat/history/${conversationId}`
  )
}
