import type { PrismaClient, Purchase, Prisma } from '@prisma/client'

/**
 * Repository para operações de banco de dados relacionadas a Purchases
 */
export class PurchasesRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Busca purchase por ID
   */
  async findById(id: number): Promise<Purchase | null> {
    return this.prisma.purchase.findUnique({
      where: { id },
    })
  }

  /**
   * Busca purchase por orderNumber
   */
  async findByOrderNumber(orderNumber: string): Promise<Purchase | null> {
    return this.prisma.purchase.findUnique({
      where: { orderNumber },
    })
  }

  /**
   * Lista purchases com paginação e filtros
   */
  async findMany(args?: Prisma.PurchaseFindManyArgs): Promise<Purchase[]> {
    return this.prisma.purchase.findMany(args)
  }

  /**
   * Conta total de purchases
   */
  async count(where?: Prisma.PurchaseWhereInput): Promise<number> {
    return this.prisma.purchase.count({ where })
  }

  /**
   * Cria novo purchase
   */
  async create(data: Prisma.PurchaseCreateInput): Promise<Purchase> {
    return this.prisma.purchase.create({
      data,
    })
  }

  /**
   * Atualiza purchase
   */
  async update(id: number, data: Prisma.PurchaseUpdateInput): Promise<Purchase> {
    return this.prisma.purchase.update({
      where: { id },
      data,
    })
  }

  /**
   * Deleta purchase
   */
  async delete(id: number): Promise<Purchase> {
    return this.prisma.purchase.delete({
      where: { id },
    })
  }

  /**
   * Busca purchase com informações do customer
   */
  async findByIdWithCustomer(id: number) {
    return this.prisma.purchase.findUnique({
      where: { id },
      include: {
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
   * Busca purchases de um customer específico
   */
  async findByCustomerId(customerId: string, limit?: number) {
    return this.prisma.purchase.findMany({
      where: { customerId },
      orderBy: { purchaseDate: 'desc' },
      take: limit,
    })
  }
}