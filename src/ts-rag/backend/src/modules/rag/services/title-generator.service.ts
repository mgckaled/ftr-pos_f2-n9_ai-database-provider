/**
 * Title Generator Service
 * Gera títulos concisos para conversas usando apenas a pergunta do usuário
 */

import dotenv from 'dotenv'

dotenv.config()

export class TitleGeneratorService {
  constructor() {
    // Não precisa mais de Gemini - apenas processa a pergunta do usuário
  }

  /**
   * Gera um título conciso para uma conversa baseado na pergunta
   * @param userQuestion - Primeira pergunta do usuário
   * @param aiResponse - Resposta da IA (não usado mais, mantido por compatibilidade)
   * @returns Título gerado
   */
  async generateTitle(userQuestion: string, aiResponse?: string): Promise<string> {
    console.log('📝 Gerando título para conversa...')
    const title = this.generateFallbackTitle(userQuestion)
    console.log(`✅ Título gerado: "${title}"`)
    return title
  }

  /**
   * Gera um título fallback caso a API do Gemini falhe
   * @param userQuestion - Pergunta original do usuário
   * @returns Título truncado
   */
  private generateFallbackTitle(userQuestion: string): string {
    // Remove quebras de linha e espaços extras
    const cleaned = userQuestion.replace(/\s+/g, ' ').trim()

    // Trunca em 45 caracteres
    const maxLength = 45
    if (cleaned.length <= maxLength) {
      return cleaned
    }

    // Trunca no último espaço antes do limite
    const truncated = cleaned.slice(0, maxLength)
    const lastSpace = truncated.lastIndexOf(' ')

    if (lastSpace > maxLength * 0.6) {
      return truncated.slice(0, lastSpace) + '...'
    }

    return truncated + '...'
  }
}
