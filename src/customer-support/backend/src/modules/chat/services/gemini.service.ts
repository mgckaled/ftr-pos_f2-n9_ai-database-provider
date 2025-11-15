import { GoogleGenAI } from '@google/genai'
import { env } from '../../../config/env.js'
import { CUSTOMER_SUPPORT_SYSTEM_INSTRUCTION } from '../prompts/system-prompt.js'
import type { Message } from '../schemas/chat.schema.js'

/**
 * Configuração de retry com exponential backoff
 */
interface RetryConfig {
  maxRetries: number
  initialDelayMs: number
  maxDelayMs: number
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
}

/**
 * Rate Limiter simples para controlar 30 RPM (free tier)
 */
class RateLimiter {
  private requestTimestamps: number[] = []
  private readonly maxRequestsPerMinute = 30

  async waitIfNeeded(): Promise<void> {
    const now = Date.now()
    const oneMinuteAgo = now - 60000

    // Remove timestamps antigos (mais de 1 minuto)
    this.requestTimestamps = this.requestTimestamps.filter(
      (timestamp) => timestamp > oneMinuteAgo
    )

    // Se atingiu o limite, aguarda
    if (this.requestTimestamps.length >= this.maxRequestsPerMinute) {
      const oldestTimestamp = this.requestTimestamps[0]
      const waitTime = 60000 - (now - oldestTimestamp)

      if (waitTime > 0) {
        console.warn(
          `[RateLimiter] Limite de ${this.maxRequestsPerMinute} RPM atingido. Aguardando ${Math.ceil(waitTime / 1000)}s...`
        )
        await this.sleep(waitTime)
      }
    }

    // Registra nova requisição
    this.requestTimestamps.push(Date.now())
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  getStats() {
    const now = Date.now()
    const oneMinuteAgo = now - 60000
    const recentRequests = this.requestTimestamps.filter(
      (timestamp) => timestamp > oneMinuteAgo
    )

    return {
      requestsInLastMinute: recentRequests.length,
      remainingRequests: Math.max(
        0,
        this.maxRequestsPerMinute - recentRequests.length
      ),
    }
  }
}

/**
 * Service para integração com Google Gemini AI
 *
 * Rate Limits (Free Tier - Gemini 2.0 Flash-Lite):
 * - 30 RPM (Requests Per Minute)
 * - 1.000.000 TPM (Tokens Per Minute)
 * - 200 RPD (Requests Per Day)
 */
export class GeminiService {
  private client: GoogleGenAI
  private rateLimiter: RateLimiter

  constructor() {
    this.client = new GoogleGenAI({
      apiKey: env.GEMINI_API_KEY,
    })
    this.rateLimiter = new RateLimiter()
  }

  /**
   * Gera resposta do chat com retry e rate limiting
   */
  async generateChatResponse(
    userMessage: string,
    conversationHistory: Message[],
    systemContext?: string
  ): Promise<string> {
    // Aguarda se necessário pelo rate limiter
    await this.rateLimiter.waitIfNeeded()

    return this.retryWithBackoff(async () => {
      // Monta system instruction completo
      const fullSystemInstruction = systemContext
        ? `${CUSTOMER_SUPPORT_SYSTEM_INSTRUCTION}\n\n${systemContext}`
        : CUSTOMER_SUPPORT_SYSTEM_INSTRUCTION

      // Converte histórico para formato Gemini
      const history = conversationHistory.map((msg) => ({
        role: msg.role === 'USER' ? ('user' as const) : ('model' as const),
        parts: [{ text: msg.content }],
      }))

      // Cria chat session
      const chat = this.client.models.chat({
        model: 'gemini-2.0-flash-lite', // Melhor modelo para free tier (30 RPM)
        config: {
          systemInstruction: fullSystemInstruction,
          temperature: 0.3, // Baixa para respostas consistentes
          topP: 0.8,
          topK: 30,
          maxOutputTokens: 800, // Respostas concisas
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
              category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
          ],
        },
      })

      // Inicia chat com histórico
      const session = chat.startChat({
        history,
      })

      // Envia mensagem e recebe resposta
      const result = await session.sendMessage(userMessage)
      const response = result.text()

      if (!response) {
        throw new Error('Gemini retornou resposta vazia')
      }

      return response
    })
  }

  /**
   * Implementa retry com exponential backoff
   */
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    config: RetryConfig = DEFAULT_RETRY_CONFIG
  ): Promise<T> {
    let lastError: Error | undefined

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error

        // Se for erro 429 (rate limit), faz retry
        if (this.isRateLimitError(error)) {
          if (attempt < config.maxRetries) {
            const delay = Math.min(
              config.initialDelayMs * Math.pow(2, attempt),
              config.maxDelayMs
            )

            console.warn(
              `[GeminiService] Rate limit atingido (429). Tentativa ${attempt + 1}/${config.maxRetries}. Aguardando ${delay}ms...`
            )

            await this.sleep(delay)
            continue
          }
        }

        // Se for outro tipo de erro, lança imediatamente
        throw error
      }
    }

    throw lastError || new Error('Falha após múltiplas tentativas')
  }

  /**
   * Verifica se erro é de rate limit (429)
   */
  private isRateLimitError(error: unknown): boolean {
    if (error && typeof error === 'object') {
      const err = error as { status?: number; statusCode?: number }
      return err.status === 429 || err.statusCode === 429
    }
    return false
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Retorna estatísticas do rate limiter
   */
  getRateLimitStats() {
    return this.rateLimiter.getStats()
  }
}