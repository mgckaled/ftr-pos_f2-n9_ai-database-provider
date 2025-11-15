/**
 * Componente para exibir informações do cliente
 */

import { useCustomer } from '@/hooks/useCustomers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Mail, Phone, MapPin, Calendar } from 'lucide-react'
import { format } from 'date-fns'

interface CustomerInfoProps {
  customerId: string
}

export function CustomerInfo({ customerId }: CustomerInfoProps) {
  const { data: customer, isLoading } = useCustomer(customerId)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    )
  }

  if (!customer) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {customer.firstName} {customer.lastName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-start gap-2">
          <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="break-all">{customer.email}</p>
          </div>
        </div>

        {customer.phone && (
          <div className="flex items-start gap-2">
            <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Telefone</p>
              <p>{customer.phone}</p>
            </div>
          </div>
        )}

        {customer.address && (
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Endereço</p>
              <p>
                {customer.address.street}, {customer.address.number}
              </p>
              <p>
                {customer.address.city} - {customer.address.state}
              </p>
              <p>CEP: {customer.address.zipCode}</p>
            </div>
          </div>
        )}

        {customer.birthDate && (
          <div className="flex items-start gap-2">
            <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Data de Nascimento</p>
              <p>{format(new Date(customer.birthDate), 'dd/MM/yyyy')}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
