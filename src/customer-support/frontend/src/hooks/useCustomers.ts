/**
 * Hook para gerenciar clientes
 */

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Customer, PaginatedCustomers } from '@/types/customer'
import type { ApiResponse } from '@/types/api'

interface UseCustomersParams {
  page?: number
  limit?: number
}

export function useCustomers({ page = 1, limit = 50 }: UseCustomersParams = {}) {
  return useQuery({
    queryKey: ['customers', page, limit],
    queryFn: async () => {
      const response = await api.get<{
        success: boolean
        data: Customer[]
        pagination: {
          page: number
          limit: number
          total: number
          totalPages: number
        }
      }>('/customers', {
        params: { page, limit },
      })

      return {
        data: response.data.data,
        pagination: response.data.pagination,
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

export function useCustomer(id: string | null) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      if (!id) return null
      const response = await api.get<{
        success: boolean
        data: Customer
      }>(`/customers/${id}`)
      return response.data.data
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}
