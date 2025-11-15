/**
 * Types para Customer (consistente com backend)
 */

export interface Address {
  street: string
  number: string
  complement?: string | null
  neighborhood: string
  city: string
  state: string
  zipCode: string
  country: string
}

export interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  cpf?: string | null
  birthDate?: string | null
  address?: Address | null
  createdAt: string
  updatedAt: string
}

export interface PaginatedCustomers {
  data: Customer[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}