/**
 * LRU Cache Service for RAG responses
 * Caches retrieval results to improve performance
 */

import { LRUCache } from 'lru-cache'

export interface CachedResponse {
  query: string
  response: string
  sources: Array<{
    text: string
    metadata: {
      page: number
      chapter: string
      section?: string
      type: string
      score: number
    }
  }>
  timestamp: number
}

export class CacheService {
  private cache: LRUCache<string, CachedResponse>

  constructor(maxSize: number = 100, ttlMs: number = 1000 * 60 * 30) {
    // 30 minutos de TTL por padrão
    this.cache = new LRUCache<string, CachedResponse>({
      max: maxSize, // Máximo de entradas
      ttl: ttlMs, // Time to live em milissegundos
      updateAgeOnGet: true, // Atualiza timestamp ao acessar
      updateAgeOnHas: false,
    })
  }

  /**
   * Gera chave de cache baseada na query
   * Remove espaços e normaliza para lowercase
   */
  private generateKey (query: string): string {
    return query.toLowerCase().trim().replace(/\s+/g, ' ')
  }

  /**
   * Busca resposta no cache
   */
  get (query: string): CachedResponse | undefined {
    const key = this.generateKey(query)
    return this.cache.get(key)
  }

  /**
   * Salva resposta no cache
   */
  set (query: string, response: CachedResponse): void {
    const key = this.generateKey(query)
    this.cache.set(key, response)
  }

  /**
   * Verifica se query está no cache
   */
  has (query: string): boolean {
    const key = this.generateKey(query)
    return this.cache.has(key)
  }

  /**
   * Remove entrada do cache
   */
  delete (query: string): boolean {
    const key = this.generateKey(query)
    return this.cache.delete(key)
  }

  /**
   * Limpa todo o cache
   */
  clear (): void {
    this.cache.clear()
  }

  /**
   * Retorna estatísticas do cache
   */
  getStats () {
    return {
      size: this.cache.size,
      maxSize: this.cache.max,
      calculatedSize: this.cache.calculatedSize,
    }
  }
}
