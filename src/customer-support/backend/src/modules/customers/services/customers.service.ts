import { CustomersRepository } from '../repositories/customers.repository.js'
import type {
  CreateCustomerInput,
  UpdateCustomerInput,
} from '../schemas/customer.schema.js'

/**
 * Service com lógica de negócio para Customers
 */
export class CustomersService {
  constructor(private readonly repository: CustomersRepository) {}

  /**
   * Lista customers com paginação
   */
  async listCustomers(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit

    const [customers, total] = await Promise.all([
      this.repository.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.repository.count(),
    ])

    return { customers, total }
  }

  /**
   * Busca customer por ID
   */
  async getCustomerById(id: string) {
    const customer = await this.repository.findById(id)

    if (!customer) {
      const error = new Error('Cliente não encontrado') as Error & {
        statusCode: number
      }
      error.statusCode = 404
      throw error
    }

    return customer
  }

  /**
   * Busca compras de um customer
   */
  async getCustomerPurchases(id: string, limit: number = 10) {
    // Verifica se customer existe
    await this.getCustomerById(id)

    const purchases = await this.repository.getCustomerPurchases(id, limit)

    return purchases
  }

  /**
   * Cria novo customer
   */
  async createCustomer(input: CreateCustomerInput) {
    // Verifica se email já existe
    if (input.email) {
      const existingEmail = await this.repository.findByEmail(input.email)
      if (existingEmail) {
        const error = new Error('Email já cadastrado') as Error & {
          statusCode: number
        }
        error.statusCode = 409
        throw error
      }
    }

    // Verifica se CPF já existe
    if (input.cpf) {
      const existingCpf = await this.repository.findByCpf(input.cpf)
      if (existingCpf) {
        const error = new Error('CPF já cadastrado') as Error & {
          statusCode: number
        }
        error.statusCode = 409
        throw error
      }
    }

    return this.repository.create(input)
  }

  /**
   * Atualiza customer
   */
  async updateCustomer(id: string, input: UpdateCustomerInput) {
    // Verifica se customer existe
    await this.getCustomerById(id)

    // Verifica se email já está em uso por outro customer
    if (input.email) {
      const existingEmail = await this.repository.findByEmail(input.email)
      if (existingEmail && existingEmail.id !== id) {
        const error = new Error('Email já cadastrado') as Error & {
          statusCode: number
        }
        error.statusCode = 409
        throw error
      }
    }

    // Verifica se CPF já está em uso por outro customer
    if (input.cpf) {
      const existingCpf = await this.repository.findByCpf(input.cpf)
      if (existingCpf && existingCpf.id !== id) {
        const error = new Error('CPF já cadastrado') as Error & {
          statusCode: number
        }
        error.statusCode = 409
        throw error
      }
    }

    return this.repository.update(id, input)
  }

  /**
   * Deleta customer
   */
  async deleteCustomer(id: string) {
    // Verifica se customer existe
    await this.getCustomerById(id)

    return this.repository.delete(id)
  }
}