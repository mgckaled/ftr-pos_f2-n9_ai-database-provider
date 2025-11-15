import type { PrismaClient, Message, Prisma } from '@prisma/client'

/**
 * Repository para operações de banco de dados relacionadas a Messages
 */
export class MessagesRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Busca message por ID
   */
  async findById(id: number): Promise<Message | null> {
    return this.prisma.message.findUnique({
      where: { id },
    })
  }

  /**
   * Lista messages de uma conversation com paginação
   */
  async findByConversationId(
    conversationId: string,
    args?: { skip?: number; take?: number }
  ): Promise<Message[]> {
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' }, // Ordem cronológica
      skip: args?.skip,
      take: args?.take,
    })
  }

  /**
   * Busca as últimas N mensagens de uma conversation (para contexto)
   */
  async findRecentByConversationId(
    conversationId: string,
    limit = 20
  ): Promise<Message[]> {
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // Retorna em ordem cronológica (mais antiga primeiro)
    return messages.reverse()
  }

  /**
   * Conta total de messages de uma conversation
   */
  async countByConversationId(conversationId: string): Promise<number> {
    return this.prisma.message.count({
      where: { conversationId },
    })
  }

  /**
   * Cria nova message
   */
  async create(data: Prisma.MessageCreateInput): Promise<Message> {
    return this.prisma.message.create({
      data,
    })
  }

  /**
   * Cria message usando conversationId diretamente (mais simples)
   */
  async createWithConversationId(
    conversationId: string,
    role: 'USER' | 'ASSISTANT',
    content: string,
    metadata?: Record<string, unknown>
  ): Promise<Message> {
    return this.prisma.message.create({
      data: {
        conversation: {
          connect: { id: conversationId },
        },
        role,
        content,
        metadata: metadata || null,
      },
    })
  }

  /**
   * Deleta message
   */
  async delete(id: number): Promise<Message> {
    return this.prisma.message.delete({
      where: { id },
    })
  }

  /**
   * Deleta todas as messages de uma conversation
   */
  async deleteByConversationId(conversationId: string): Promise<number> {
    const result = await this.prisma.message.deleteMany({
      where: { conversationId },
    })
    return result.count
  }
}