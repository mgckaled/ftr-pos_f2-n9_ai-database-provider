import { GoogleGenAI } from '@google/genai'
import { env } from '@/config/env.js'

/**
 * Cliente do Google Gemini AI
 * Inicializado com a API Key das variáveis de ambiente
 *
 * Modelo recomendado para customer support: gemini-2.5-flash
 * - Melhor custo-benefício (10 RPM grátis)
 * - 250K tokens por minuto
 * - Latência baixa
 *
 * Modelos disponíveis (free tier):
 * - gemini-2.5-flash: 10 RPM / 250K TPM (recomendado)
 * - gemini-2.0-flash-lite: 30 RPM / 1M TPM (mais rápido, menos preciso)
 * - gemini-2.5-pro: 2 RPM / 125K TPM (mais preciso, mais lento)
 */
export const genAI = new GoogleGenAI({
  apiKey: env.GEMINI_API_KEY,
})

/**
 * Modelo padrão do Gemini
 * Atualizado para gemini-2.5-flash (melhor para chat)
 */
export const defaultModel = 'gemini-2.5-flash'

/**
 * Configuração padrão de geração para customer support
 * Otimizado para respostas naturais e úteis
 */
export const defaultGenerationConfig = {
  temperature: 0.7, // Equilíbrio entre criatividade e precisão
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 2048,
}
