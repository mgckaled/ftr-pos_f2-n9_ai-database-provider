import { z } from 'zod'
import { PurchaseStatus } from '@prisma/client'

/**
 * Schema do enum PurchaseStatus
 */
export const PurchaseStatusSchema = z.nativeEnum(PurchaseStatus)

/**
 * Schema completo de Purchase (do banco)
 */
export const PurchaseSchema = z.object({
  id: z.number().int().positive(),
  customerId: z.string().uuid(),
  orderNumber: z.string().min(5).max(50),
  productName: z.string().min(3).max(255),
  productCategory: z.string().min(2).max(100).nullable().optional(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  totalPrice: z.number().positive(),
  status: PurchaseStatusSchema,
  purchaseDate: z.coerce.date(),
  deliveryDate: z.coerce.date().nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  createdAt: z.coerce.date(),
})

/**
 * Schema para criação de Purchase
 */
export const CreatePurchaseSchema = PurchaseSchema.omit({
  id: true,
  createdAt: true,
  totalPrice: true, // Calculado automaticamente
}).extend({
  // totalPrice será calculado: quantity * unitPrice
})

/**
 * Schema para atualização de Purchase
 */
export const UpdatePurchaseSchema = CreatePurchaseSchema.partial()

/**
 * Schema para atualizar apenas o status
 */
export const UpdatePurchaseStatusSchema = z.object({
  status: PurchaseStatusSchema,
  deliveryDate: z.coerce.date().optional(),
})

/**
 * Schema para query params de paginação
 */
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
})

/**
 * Schema para filtros de purchases
 */
export const PurchaseFiltersSchema = PaginationQuerySchema.extend({
  status: PurchaseStatusSchema.optional(),
  customerId: z.string().uuid().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
})

/**
 * Schema para params com ID
 */
export const PurchaseIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
})

/**
 * Schema para params com orderNumber
 */
export const OrderNumberParamSchema = z.object({
  orderNumber: z.string().min(5).max(50),
})

/**
 * Type inference
 */
export type Purchase = z.infer<typeof PurchaseSchema>
export type CreatePurchaseInput = z.infer<typeof CreatePurchaseSchema>
export type UpdatePurchaseInput = z.infer<typeof UpdatePurchaseSchema>
export type UpdatePurchaseStatusInput = z.infer<typeof UpdatePurchaseStatusSchema>
export type PurchaseFilters = z.infer<typeof PurchaseFiltersSchema>
export type PurchaseIdParam = z.infer<typeof PurchaseIdParamSchema>
export type OrderNumberParam = z.infer<typeof OrderNumberParamSchema>