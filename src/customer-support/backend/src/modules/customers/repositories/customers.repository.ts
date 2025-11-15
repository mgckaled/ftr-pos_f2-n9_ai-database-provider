import type { PrismaClient, Customer, Prisma } from '@prisma/client'

/**
 * Repository para operações de banco de dados relacionadas a Customers
 */
export class CustomersRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Busca customer por ID
   */
  async findById(id: string): Promise<Customer | null> {
    return this.prisma.customer.findUnique({
      where: { id },
    })
  }

  /**
   * Busca customer por email
   */
  async findByEmail(email: string): Promise<Customer | null> {
    return this.prisma.customer.findUnique({
      where: { email },
    })
  }

  /**
   * Busca customer por CPF
   */
  async findByCpf(cpf: string): Promise<Customer | null> {
    return this.prisma.customer.findUnique({
      where: { cpf },
    })
  }

  /**
   * Lista customers com paginação
   */
  async findMany(args?: Prisma.CustomerFindManyArgs): Promise<Customer[]> {
    return this.prisma.customer.findMany(args)
  }

  /**
   * Conta total de customers
   */
  async count(where?: Prisma.CustomerWhereInput): Promise<number> {
    return this.prisma.customer.count({ where })
  }

  /**
   * Cria novo customer
   */
  async create(data: Prisma.CustomerCreateInput): Promise<Customer> {
    return this.prisma.customer.create({
      data,
    })
  }

  /**
   * Atualiza customer
   */
  async update(id: string, data: Prisma.CustomerUpdateInput): Promise<Customer> {
    return this.prisma.customer.update({
      where: { id },
      data,
    })
  }

  /**
   * Deleta customer
   */
  async delete(id: string): Promise<Customer> {
    return this.prisma.customer.delete({
      where: { id },
    })
  }

  /**
   * Busca customer com suas compras
   */
  async findByIdWithPurchases(id: string, limit?: number) {
    return this.prisma.customer.findUnique({
      where: { id },
      include: {
        purchases: {
          orderBy: { purchaseDate: 'desc' },
          take: limit,
        },
      },
    })
  }

  /**
   * Busca compras de um customer
   */
  async getCustomerPurchases(customerId: string, limit?: number) {
    return this.prisma.purchase.findMany({
      where: { customerId },
      orderBy: { purchaseDate: 'desc' },
      take: limit,
    })
  }
}