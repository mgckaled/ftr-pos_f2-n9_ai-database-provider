/**
 * Rate Limiter para API do Gemini
 * Free Tier: 100 RPM (requests per minute)
 */

export class RateLimiter {
  private requests: number[] = []
  private readonly maxRequests: number
  private readonly windowMs: number

  constructor(maxRequests: number = 90, windowMs: number = 60000) {
    // Deixa margem de segurança (90 RPM em vez de 100)
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  /**
   * Aguarda se necessário para respeitar rate limit
   */
  async wait(): Promise<void> {
    const now = Date.now()

    // Remove requests antigas (fora da janela)
    this.requests = this.requests.filter(
      (timestamp) => now - timestamp < this.windowMs
    )

    if (this.requests.length >= this.maxRequests) {
      // Calcula quanto tempo esperar
      const oldestRequest = this.requests[0]
      const waitTime = this.windowMs - (now - oldestRequest) + 100 // +100ms margem

      console.log(
        `⏳ Rate limit atingido. Aguardando ${Math.round(waitTime / 1000)}s...`
      )

      await this.sleep(waitTime)

      // Limpa requests antigas novamente
      const newNow = Date.now()
      this.requests = this.requests.filter(
        (timestamp) => newNow - timestamp < this.windowMs
      )
    }

    // Registra esta request
    this.requests.push(Date.now())
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
  getStats() {
    const now = Date.now()
    const recentRequests = this.requests.filter(
      (timestamp) => now - timestamp < this.windowMs
    )

    return {
      requestsInLastMinute: recentRequests.length,
      remainingRequests: this.maxRequests - recentRequests.length,
      maxRequests: this.maxRequests,
    }
  }

  /**
   * Reseta o contador
   */
  reset() {
    this.requests = []
  }
}
