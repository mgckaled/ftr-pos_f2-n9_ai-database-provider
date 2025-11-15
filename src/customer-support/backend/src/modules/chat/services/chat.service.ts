import { ConversationsRepository } from '../repositories/conversations.repository.js'
import { MessagesRepository } from '../repositories/messages.repository.js'
import { CustomersRepository } from '../../customers/repositories/customers.repository.js'
import { PurchasesRepository } from '../../purchases/repositories/purchases.repository.js'
import { GeminiService } from './gemini.service.js'
import { buildCustomerContextPrompt } from '../prompts/system-prompt.js'
import type {
  SendMessageInput,
  CreateConversationInput,
  UpdateConversationStatusInput,
} from '../schemas/chat.schema.js'

/**
 * Service com lógica de negócio para Chat
 * Orquestra conversations, messages, context injection e Gemini AI
 */
export class ChatService {
  constructor(
    private readonly conversationsRepo: ConversationsRepository,
    private readonly messagesRepo: MessagesRepository,
    private readonly customersRepo: CustomersRepository,
    private readonly purchasesRepo: PurchasesRepository,
    private readonly geminiService: GeminiService
  ) {}

  /**
   * Envia mensagem e recebe resposta do assistente
   */
  async sendMessage(input: SendMessageInput) {
    const { customerId, conversationId, message } = input

    // 1. Verifica se customer existe
    const customer = await this.customersRepo.findById(customerId)
    if (!customer) {
      const error = new Error('Cliente não encontrado') as Error & {
        statusCode: number
      }
      error.statusCode = 404
      throw error
    }

    // 2. Determina ou cria conversation
    let conversation
    if (conversationId) {
      conversation = await this.conversationsRepo.findById(conversationId)
      if (!conversation) {
        const error = new Error('Conversa não encontrada') as Error & {
          statusCode: number
        }
        error.statusCode = 404
        throw error
      }

      // Verifica se a conversation pertence ao customer
      if (conversation.customerId !== customerId) {
        const error = new Error(
          'Esta conversa não pertence a este cliente'
        ) as Error & { statusCode: number }
        error.statusCode = 403
        throw error
      }
    } else {
      // Cria nova conversation
      conversation = await this.conversationsRepo.create({
        customer: {
          connect: { id: customerId },
        },
        status: 'ACTIVE',
      })
    }

    // 3. Salva mensagem do usuário
    const userMessage = await this.messagesRepo.createWithConversationId(
      conversation.id,
      'USER',
      message
    )

    // 4. Busca contexto do cliente (últimas 3-5 compras)
    const recentPurchases = await this.purchasesRepo.findByCustomerId(
      customerId,
      5
    )

    const customerContext = buildCustomerContextPrompt({
      customerName: `${customer.firstName} ${customer.lastName}`,
      customerEmail: customer.email,
      recentPurchases: recentPurchases.map((purchase) => ({
        orderId: purchase.id,
        orderNumber: purchase.orderNumber,
        productName: purchase.productName,
        quantity: purchase.quantity,
        totalPrice: purchase.totalPrice.toString(),
        status: purchase.status,
        purchaseDate: purchase.purchaseDate.toLocaleDateString('pt-BR'),
        deliveryDate: purchase.deliveryDate
          ? purchase.deliveryDate.toLocaleDateString('pt-BR')
          : null,
      })),
    })

    // 5. Busca histórico da conversa (últimas 20 mensagens)
    const conversationHistory = await this.messagesRepo.findRecentByConversationId(
      conversation.id,
      20
    )

    // Remove a última mensagem (do usuário que acabamos de adicionar)
    // pois ela será enviada separadamente
    const historyWithoutLast = conversationHistory.slice(0, -1)

    // 6. Gera resposta com Gemini AI
    const assistantResponse = await this.geminiService.generateChatResponse(
      message,
      historyWithoutLast,
      customerContext
    )

    // 7. Salva resposta do assistente
    const assistantMessage = await this.messagesRepo.createWithConversationId(
      conversation.id,
      'ASSISTANT',
      assistantResponse
    )

    // 8. Atualiza updatedAt da conversation
    await this.conversationsRepo.touch(conversation.id)

    return {
      conversationId: conversation.id,
      userMessage,
      assistantMessage,
    }
  }

  /**
   * Lista conversations de um customer
   */
  async listCustomerConversations(customerId: string, page = 1, limit = 10) {
    // Verifica se customer existe
    const customer = await this.customersRepo.findById(customerId)
    if (!customer) {
      const error = new Error('Cliente não encontrado') as Error & {
        statusCode: number
      }
      error.statusCode = 404
      throw error
    }

    const skip = (page - 1) * limit

    const [conversations, total] = await Promise.all([
      this.conversationsRepo.findByCustomerId(customerId, { skip, take: limit }),
      this.conversationsRepo.countByCustomerId(customerId),
    ])

    return { conversations, total }
  }

  /**
   * Busca conversation por ID com mensagens
   */
  async getConversationById(id: string, messageLimit = 50) {
    const conversation = await this.conversationsRepo.findByIdWithMessages(
      id,
      messageLimit
    )

    if (!conversation) {
      const error = new Error('Conversa não encontrada') as Error & {
        statusCode: number
      }
      error.statusCode = 404
      throw error
    }

    return conversation
  }

  /**
   * Busca mensagens de uma conversation com paginação
   */
  async getConversationMessages(
    conversationId: string,
    skip = 0,
    limit = 50
  ) {
    // Verifica se conversation existe
    const conversation = await this.conversationsRepo.findById(conversationId)
    if (!conversation) {
      const error = new Error('Conversa não encontrada') as Error & {
        statusCode: number
      }
      error.statusCode = 404
      throw error
    }

    const [messages, total] = await Promise.all([
      this.messagesRepo.findByConversationId(conversationId, { skip, take: limit }),
      this.messagesRepo.countByConversationId(conversationId),
    ])

    return { messages, total }
  }

  /**
   * Cria nova conversation
   */
  async createConversation(input: CreateConversationInput) {
    // Verifica se customer existe
    const customer = await this.customersRepo.findById(input.customerId)
    if (!customer) {
      const error = new Error('Cliente não encontrado') as Error & {
        statusCode: number
      }
      error.statusCode = 404
      throw error
    }

    return this.conversationsRepo.create({
      customer: {
        connect: { id: input.customerId },
      },
      status: 'ACTIVE',
    })
  }

  /**
   * Atualiza status de uma conversation
   */
  async updateConversationStatus(
    id: string,
    input: UpdateConversationStatusInput
  ) {
    // Verifica se conversation existe
    const conversation = await this.conversationsRepo.findById(id)
    if (!conversation) {
      const error = new Error('Conversa não encontrada') as Error & {
        statusCode: number
      }
      error.statusCode = 404
      throw error
    }

    return this.conversationsRepo.update(id, {
      status: input.status,
    })
  }

  /**
   * Deleta conversation (e todas as mensagens por cascade)
   */
  async deleteConversation(id: string) {
    // Verifica se conversation existe
    const conversation = await this.conversationsRepo.findById(id)
    if (!conversation) {
      const error = new Error('Conversa não encontrada') as Error & {
        statusCode: number
      }
      error.statusCode = 404
      throw error
    }

    return this.conversationsRepo.delete(id)
  }

  /**
   * Retorna estatísticas do rate limiter
   */
  getRateLimitStats() {
    return this.geminiService.getRateLimitStats()
  }
}