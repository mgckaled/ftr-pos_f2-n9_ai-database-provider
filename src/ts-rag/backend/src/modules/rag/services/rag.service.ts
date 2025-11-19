/**
 * RAG Service - Retrieval-Augmented Generation
 * Combina retrieval (vector store) + generation (Gemini)
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import dotenv from 'dotenv'
import type { CachedResponse, CacheService } from './cache.service.js'
import type { SearchFilters, SearchResult, VectorStoreService } from './vector-store.service.js'

dotenv.config()

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

export interface RAGResponse {
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
  fromCache: boolean
}

export interface RAGOptions {
  useCache?: boolean
  useHybridSearch?: boolean
  topK?: number
  filters?: SearchFilters
}

export class RAGService {
  private llm: ChatGoogleGenerativeAI
  private vectorStore: VectorStoreService
  private cache: CacheService

  constructor(vectorStore: VectorStoreService, cache: CacheService) {
    this.vectorStore = vectorStore
    this.cache = cache

    this.llm = new ChatGoogleGenerativeAI({
      apiKey: GEMINI_API_KEY,
      model: GEMINI_MODEL,
      temperature: 0.3,
      maxOutputTokens: 2048,
    })
  }

  /**
   * Guardrails: Valida se a query é sobre TypeScript
   */
  private isTypeScriptRelated (query: string): boolean {
    const keywords = [
      'typescript',
      'ts',
      'type',
      'interface',
      'generic',
      'enum',
      'class',
      'function',
      'const',
      'let',
      'var',
      'import',
      'export',
      'module',
      'namespace',
      'decorator',
      'async',
      'await',
      'promise',
      'array',
      'object',
      'string',
      'number',
      'boolean',
      'void',
      'never',
      'any',
      'unknown',
      'tuple',
      'union',
      'intersection',
      'literal',
      'readonly',
      'partial',
      'required',
      'pick',
      'omit',
      'record',
    ]

    const lowercaseQuery = query.toLowerCase()

    // Se mencionar outra linguagem explicitamente, rejeita
    const otherLanguages = ['python', 'java', 'c++', 'rust', 'go', 'ruby', 'php']
    if (
      otherLanguages.some(
        (lang) => lowercaseQuery.includes(lang) && !lowercaseQuery.includes('typescript')
      )
    ) {
      return false
    }

    // Aceita se mencionar alguma keyword do TypeScript
    return keywords.some((keyword) => lowercaseQuery.includes(keyword))
  }

  /**
   * Constrói o prompt do sistema
   */
  private buildSystemPrompt (): string {
    return `Você é um assistente especializado em TypeScript, baseado no livro "Essential TypeScript 5".

REGRAS ESTRITAS:
- Responda APENAS sobre TypeScript
- Use APENAS o contexto fornecido dos chunks do livro
- Se a pergunta não for sobre TypeScript, recuse educadamente
- Seja claro, didático e objetivo
- Se o contexto não tiver informação suficiente, diga isso claramente
- NÃO inclua referências a capítulos ou páginas no texto da resposta
- NÃO escreva frases como "Conforme o Capítulo X" ou "(página Y)"

FORMATO DA RESPOSTA:
- Explique o conceito de forma clara e direta
- Use exemplos de código quando apropriado
- Escreva de forma fluida, sem mencionar fontes ou referências no texto
- Se houver múltiplas abordagens, mencione as diferenças
- Foque no conteúdo técnico, não nas citações

Responda sempre em português (Brasil).`
  }

  /**
   * Constrói o contexto a partir dos chunks recuperados
   */
  private buildContext (results: SearchResult[]): string {
    if (results.length === 0) {
      return 'Nenhum contexto relevante encontrado no livro.'
    }

    return results
      .map((result, index) => {
        const { page, chapter, section, type } = result.metadata
        return `[Fonte ${index + 1}]
Capítulo: ${chapter}
${section ? `Seção: ${section}` : ''}
Página: ${page}
Tipo: ${type}
Relevância: ${(result.score * 100).toFixed(1)}%

Conteúdo:
${result.text}
`
      })
      .join('\n---\n\n')
  }

  /**
   * Gera resposta usando RAG
   */
  async query (
    userQuery: string,
    options: RAGOptions = {}
  ): Promise<RAGResponse> {
    const {
      useCache = true,
      useHybridSearch = true,
      topK = 5,
      filters,
    } = options

    // 1. Guardrails: Verifica se é sobre TypeScript
    if (!this.isTypeScriptRelated(userQuery)) {
      return {
        response:
          'Desculpe, eu só posso responder perguntas sobre TypeScript. Meu conhecimento é baseado no livro "Essential TypeScript 5". Por favor, faça uma pergunta relacionada a TypeScript.',
        sources: [],
        fromCache: false,
      }
    }

    // 2. Verifica cache
    if (useCache) {
      const cached = this.cache.get(userQuery)
      if (cached) {
        console.log('✅ Cache hit!')
        return {
          response: cached.response,
          sources: cached.sources,
          fromCache: true,
        }
      }
    }

    // 3. Retrieval: busca chunks relevantes
    console.log(`🔍 Buscando contexto relevante...`)
    const results = useHybridSearch
      ? await this.vectorStore.hybridSearch(userQuery, topK, filters)
      : await this.vectorStore.similaritySearch(userQuery, topK, filters)

    console.log(`✅ ${results.length} chunks recuperados`)

    // Se não encontrou resultados relevantes
    if (results.length === 0) {
      return {
        response:
          'Desculpe, não encontrei informações relevantes no livro "Essential TypeScript 5" para responder sua pergunta. Tente reformular ou fazer uma pergunta mais específica.',
        sources: [],
        fromCache: false,
      }
    }

    // 4. Constrói contexto
    const context = this.buildContext(results)

    // 5. Monta prompt
    const systemPrompt = this.buildSystemPrompt()
    const userPrompt = `CONTEXTO DO LIVRO:
${context}

PERGUNTA DO USUÁRIO:
${userQuery}

Responda de forma clara e didática. NÃO mencione capítulos, páginas ou seções no texto. As fontes serão exibidas separadamente pelo sistema.`

    // 6. Gera resposta com Gemini
    console.log(`🤖 Gerando resposta com Gemini...`)
    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt),
    ]

    const response = await this.llm.invoke(messages)
    const generatedText = response.content as string

    console.log(`✅ Resposta gerada`)

    // 7. Formata resultado
    const ragResponse: RAGResponse = {
      response: generatedText,
      sources: results.map((r) => ({
        text: r.text.substring(0, 200) + '...', // Preview
        metadata: {
          page: r.metadata.page,
          chapter: r.metadata.chapter,
          section: r.metadata.section,
          type: r.metadata.type,
          score: r.score,
        },
      })),
      fromCache: false,
    }

    // 8. Salva no cache
    if (useCache) {
      this.cache.set(userQuery, {
        query: userQuery,
        response: generatedText,
        sources: ragResponse.sources,
        timestamp: Date.now(),
      })
    }

    return ragResponse
  }

  /**
   * Streaming de resposta (para implementação futura)
   */
  async *queryStream (userQuery: string, options: RAGOptions = {}) {
    // Similar ao query(), mas usa stream do Gemini
    // Para implementação futura na API
    yield* []
  }

  /**
   * Retorna estatísticas do cache
   */
  getCacheStats () {
    return this.cache.getStats()
  }

  /**
   * Limpa o cache
   */
  clearCache (): void {
    this.cache.clear()
  }
}
