import type { PrismaClient, Conversation, Prisma } from '@prisma/client'

/**
 * Repository para operações de banco de dados relacionadas a Conversations
 */
export class ConversationsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Busca conversation por ID
   */
  async findById(id: string): Promise<Conversation | null> {
    return this.prisma.conversation.findUnique({
      where: { id },
    })
  }

  /**
   * Busca conversation por ID com mensagens incluídas
   */
  async findByIdWithMessages(id: string, limit = 20) {
    return this.prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: limit,
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })
  }

  /**
   * Lista conversations de um customer
   */
  async findByCustomerId(
    customerId: string,
    args?: { skip?: number; take?: number }
  ) {
    return this.prisma.conversation.findMany({
      where: { customerId },
      orderBy: { updatedAt: 'desc' },
      skip: args?.skip,
      take: args?.take,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Última mensagem apenas
        },
      },
    })
  }

  /**
   * Busca conversation ativa de um customer
   */
  async findActiveByCustomerId(customerId: string) {
    return this.prisma.conversation.findFirst({
      where: {
        customerId,
        status: 'ACTIVE',
      },
      orderBy: { updatedAt: 'desc' },
    })
  }

  /**
   * Cria nova conversation
   */
  async create(data: Prisma.ConversationCreateInput): Promise<Conversation> {
    return this.prisma.conversation.create({
      data,
    })
  }

  /**
   * Atualiza conversation
   */
  async update(
    id: string,
    data: Prisma.ConversationUpdateInput
  ): Promise<Conversation> {
    return this.prisma.conversation.update({
      where: { id },
      data,
    })
  }

  /**
   * Atualiza o updatedAt de uma conversation (útil ao adicionar mensagens)
   */
  async touch(id: string): Promise<Conversation> {
    return this.prisma.conversation.update({
      where: { id },
      data: {
        updatedAt: new Date(),
      },
    })
  }

  /**
   * Conta total de conversations de um customer
   */
  async countByCustomerId(customerId: string): Promise<number> {
    return this.prisma.conversation.count({
      where: { customerId },
    })
  }

  /**
   * Deleta conversation (cascade deleta messages também)
   */
  async delete(id: string): Promise<Conversation> {
    return this.prisma.conversation.delete({
      where: { id },
    })
  }
}