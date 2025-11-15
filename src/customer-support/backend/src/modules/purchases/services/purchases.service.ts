import { PurchasesRepository } from '../repositories/purchases.repository.js'
import type {
  CreatePurchaseInput,
  UpdatePurchaseInput,
  UpdatePurchaseStatusInput,
  PurchaseFilters,
} from '../schemas/purchase.schema.js'
import type { Prisma } from '@prisma/client'

/**
 * Service com lógica de negócio para Purchases
 */
export class PurchasesService {
  constructor(private readonly repository: PurchasesRepository) {}

  /**
   * Lista purchases com paginação e filtros
   */
  async listPurchases(filters: PurchaseFilters) {
    const { page = 1, limit = 10, status, customerId, startDate, endDate } = filters
    const skip = (page - 1) * limit

    // Monta filtros do Prisma
    const where: Prisma.PurchaseWhereInput = {}

    if (status) {
      where.status = status
    }

    if (customerId) {
      where.customerId = customerId
    }

    if (startDate || endDate) {
      where.purchaseDate = {}
      if (startDate) {
        where.purchaseDate.gte = startDate
      }
      if (endDate) {
        where.purchaseDate.lte = endDate
      }
    }

    const [purchases, total] = await Promise.all([
      this.repository.findMany({
        where,
        skip,
        take: limit,
        orderBy: { purchaseDate: 'desc' },
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
      }),
      this.repository.count(where),
    ])

    return { purchases, total }
  }

  /**
   * Busca purchase por ID
   */
  async getPurchaseById(id: number) {
    const purchase = await this.repository.findByIdWithCustomer(id)

    if (!purchase) {
      const error = new Error('Compra não encontrada') as Error & {
        statusCode: number
      }
      error.statusCode = 404
      throw error
    }

    return purchase
  }

  /**
   * Busca purchase por orderNumber
   */
  async getPurchaseByOrderNumber(orderNumber: string) {
    const purchase = await this.repository.findByOrderNumber(orderNumber)

    if (!purchase) {
      const error = new Error('Pedido não encontrado') as Error & {
        statusCode: number
      }
      error.statusCode = 404
      throw error
    }

    return purchase
  }

  /**
   * Cria novo purchase
   */
  async createPurchase(input: CreatePurchaseInput) {
    // Verifica se orderNumber já existe
    const existingOrder = await this.repository.findByOrderNumber(input.orderNumber)
    if (existingOrder) {
      const error = new Error('Número de pedido já existe') as Error & {
        statusCode: number
      }
      error.statusCode = 409
      throw error
    }

    // Calcula totalPrice
    const totalPrice = input.quantity * input.unitPrice

    return this.repository.create({
      ...input,
      totalPrice,
      customer: {
        connect: { id: input.customerId },
      },
    })
  }

  /**
   * Atualiza purchase
   */
  async updatePurchase(id: number, input: UpdatePurchaseInput) {
    // Verifica se purchase existe
    await this.getPurchaseById(id)

    // Se mudou orderNumber, verifica se já existe
    if (input.orderNumber) {
      const existingOrder = await this.repository.findByOrderNumber(input.orderNumber)
      if (existingOrder && existingOrder.id !== id) {
        const error = new Error('Número de pedido já existe') as Error & {
          statusCode: number
        }
        error.statusCode = 409
        throw error
      }
    }

    // Recalcula totalPrice se necessário
    let totalPrice: number | undefined
    if (input.quantity !== undefined || input.unitPrice !== undefined) {
      const current = await this.repository.findById(id)
      const newQuantity = input.quantity ?? current!.quantity
      const newUnitPrice = input.unitPrice ?? Number(current!.unitPrice)
      totalPrice = newQuantity * newUnitPrice
    }

    return this.repository.update(id, {
      ...input,
      ...(totalPrice !== undefined && { totalPrice }),
    })
  }

  /**
   * Atualiza apenas o status do purchase
   */
  async updatePurchaseStatus(id: number, input: UpdatePurchaseStatusInput) {
    // Verifica se purchase existe
    await this.getPurchaseById(id)

    return this.repository.update(id, input)
  }

  /**
   * Deleta purchase
   */
  async deletePurchase(id: number) {
    // Verifica se purchase existe
    await this.getPurchaseById(id)

    return this.repository.delete(id)
  }
}