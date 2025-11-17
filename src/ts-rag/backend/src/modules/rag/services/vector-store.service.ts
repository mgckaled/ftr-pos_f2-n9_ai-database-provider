/**
 * MongoDB Vector Store Service
 * Handles vector similarity search and hybrid search
 */

import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai'
import dotenv from 'dotenv'
import type { Collection, Document } from 'mongodb'
import { getEmbeddingsCollection } from '../../../shared/config/mongodb.js'

dotenv.config()

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!
const GEMINI_EMBEDDING_MODEL =
  process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001'

export interface SearchResult {
  text: string
  metadata: {
    page: number
    chapter: string
    section?: string
    type: string
    bookTitle: string
  }
  score: number
}

export interface SearchFilters {
  type?: 'code' | 'explanation' | 'example' | 'reference'
  chapter?: string
  minPage?: number
  maxPage?: number
}

export class VectorStoreService {
  private collection!: Collection<Document>
  private embeddings: GoogleGenerativeAIEmbeddings

  constructor() {
    this.embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: GEMINI_API_KEY,
      model: GEMINI_EMBEDDING_MODEL,
    })
  }

  /**
   * Inicializa a collection do MongoDB
   */
  async initialize (): Promise<void> {
    this.collection = await getEmbeddingsCollection()
  }

  /**
   * Gera embedding para uma query
   */
  async embedQuery (query: string): Promise<number[]> {
    return await this.embeddings.embedQuery(query)
  }

  /**
   * Vector Search usando MongoDB Atlas Vector Search
   */
  async vectorSearch (
    queryEmbedding: number[],
    limit: number = 5,
    filters?: SearchFilters
  ): Promise<SearchResult[]> {
    // Constrói filtros opcionais
    const filterConditions: any = {}

    if (filters) {
      if (filters.type) {
        filterConditions['metadata.type'] = filters.type
      }
      if (filters.chapter) {
        filterConditions['metadata.chapter'] = filters.chapter
      }
      if (filters.minPage || filters.maxPage) {
        filterConditions['metadata.page'] = {}
        if (filters.minPage) {
          filterConditions['metadata.page'].$gte = filters.minPage
        }
        if (filters.maxPage) {
          filterConditions['metadata.page'].$lte = filters.maxPage
        }
      }
    }

    // Pipeline de agregação com $vectorSearch
    const pipeline: any[] = [
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: limit * 10, // Busca mais candidatos para melhor recall
          limit: limit,
          ...(Object.keys(filterConditions).length > 0 && {
            filter: filterConditions,
          }),
        },
      },
      {
        $project: {
          _id: 0,
          text: 1,
          metadata: 1,
          score: { $meta: 'vectorSearchScore' },
        },
      },
    ]

    const results = await this.collection.aggregate(pipeline).toArray()

    return results.map((doc) => ({
      text: doc.text,
      metadata: doc.metadata,
      score: doc.score,
    }))
  }

  /**
   * Full-Text Search usando MongoDB Atlas Search
   */
  async fullTextSearch (
    query: string,
    limit: number = 5,
    filters?: SearchFilters
  ): Promise<SearchResult[]> {
    // Constrói filtros opcionais
    const filterConditions: any = {}

    if (filters) {
      if (filters.type) {
        filterConditions['metadata.type'] = filters.type
      }
      if (filters.chapter) {
        filterConditions['metadata.chapter'] = filters.chapter
      }
      if (filters.minPage || filters.maxPage) {
        filterConditions['metadata.page'] = {}
        if (filters.minPage) {
          filterConditions['metadata.page'].$gte = filters.minPage
        }
        if (filters.maxPage) {
          filterConditions['metadata.page'].$lte = filters.maxPage
        }
      }
    }

    // Pipeline de agregação com $search
    const pipeline: any[] = [
      {
        $search: {
          index: 'fulltext_index',
          text: {
            query: query,
            path: 'text',
          },
          ...(Object.keys(filterConditions).length > 0 && {
            filter: filterConditions,
          }),
        },
      },
      {
        $limit: limit,
      },
      {
        $project: {
          _id: 0,
          text: 1,
          metadata: 1,
          score: { $meta: 'searchScore' },
        },
      },
    ]

    const results = await this.collection.aggregate(pipeline).toArray()

    return results.map((doc) => ({
      text: doc.text,
      metadata: doc.metadata,
      score: doc.score,
    }))
  }

  /**
   * Hybrid Search: combina vector search + full-text search
   * Usa Reciprocal Rank Fusion (RRF) para combinar resultados
   */
  async hybridSearch (
    query: string,
    limit: number = 5,
    filters?: SearchFilters,
    vectorWeight: number = 0.7,
    textWeight: number = 0.3
  ): Promise<SearchResult[]> {
    // 1. Gera embedding da query
    const queryEmbedding = await this.embedQuery(query)

    // 2. Executa ambas as buscas em paralelo
    const [vectorResults, textResults] = await Promise.all([
      this.vectorSearch(queryEmbedding, limit * 2, filters),
      this.fullTextSearch(query, limit * 2, filters),
    ])

    // 3. Reciprocal Rank Fusion (RRF)
    // Formula: score = Σ (weight / (k + rank))
    // k = 60 (constante padrão para RRF)
    const k = 60
    const scoresMap = new Map<string, { result: SearchResult; score: number }>()

    // Processa resultados do vector search
    vectorResults.forEach((result, index) => {
      const rank = index + 1
      const rrfScore = vectorWeight / (k + rank)
      const key = result.text.substring(0, 100) // Usa início do texto como chave

      if (scoresMap.has(key)) {
        scoresMap.get(key)!.score += rrfScore
      } else {
        scoresMap.set(key, {
          result,
          score: rrfScore,
        })
      }
    })

    // Processa resultados do full-text search
    textResults.forEach((result, index) => {
      const rank = index + 1
      const rrfScore = textWeight / (k + rank)
      const key = result.text.substring(0, 100)

      if (scoresMap.has(key)) {
        scoresMap.get(key)!.score += rrfScore
      } else {
        scoresMap.set(key, {
          result,
          score: rrfScore,
        })
      }
    })

    // 4. Ordena por score e retorna top-k
    const hybridResults = Array.from(scoresMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => ({
        ...item.result,
        score: item.score,
      }))

    return hybridResults
  }

  /**
   * Similarity search simples (apenas vector)
   */
  async similaritySearch (
    query: string,
    limit: number = 5,
    filters?: SearchFilters
  ): Promise<SearchResult[]> {
    const queryEmbedding = await this.embedQuery(query)
    return await this.vectorSearch(queryEmbedding, limit, filters)
  }
}
