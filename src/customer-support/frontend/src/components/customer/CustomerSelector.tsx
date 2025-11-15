/**
 * Componente para seleção de cliente
 */

import { useCustomers } from '@/hooks/useCustomers'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

interface CustomerSelectorProps {
  selectedCustomerId: string | null
  onSelectCustomer: (customerId: string | null) => void
}

export function CustomerSelector({
  selectedCustomerId,
  onSelectCustomer,
}: CustomerSelectorProps) {
  const { data, isLoading, error } = useCustomers({ page: 1, limit: 100 })

  if (isLoading) {
    return <Skeleton className="h-10 w-full" />
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
        <p className="text-sm text-destructive">
          Erro ao carregar clientes. Tente novamente.
        </p>
      </div>
    )
  }

  const customers = data?.data || []

  return (
    <Select value={selectedCustomerId || ''} onValueChange={onSelectCustomer}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Selecione um cliente..." />
      </SelectTrigger>
      <SelectContent>
        {customers.map((customer) => (
          <SelectItem key={customer.id} value={customer.id}>
            {customer.firstName} {customer.lastName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
