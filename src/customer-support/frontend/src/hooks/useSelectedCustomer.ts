/**
 * Hook para gerenciar o cliente selecionado (com persistência em localStorage)
 */

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'selected-customer-id'

export function useSelectedCustomer() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  )

  // Carrega do localStorage ao montar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setSelectedCustomerId(stored)
      }
    } catch (error) {
      console.error('Error loading selected customer:', error)
    }
  }, [])

  // Salva no localStorage quando mudar
  const selectCustomer = (customerId: string | null) => {
    try {
      if (customerId) {
        localStorage.setItem(STORAGE_KEY, customerId)
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
      setSelectedCustomerId(customerId)
    } catch (error) {
      console.error('Error saving selected customer:', error)
    }
  }

  return {
    selectedCustomerId,
    selectCustomer,
  }
}
