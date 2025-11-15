import { z } from 'zod'

/**
 * Schema de endereço (JSONB)
 */
export const AddressSchema = z.object({
  street: z.string().min(3).max(255),
  number: z.string().min(1).max(10),
  complement: z.string().max(100).nullable().optional(),
  neighborhood: z.string().min(2).max(100),
  city: z.string().min(2).max(100),
  state: z.string().length(2, 'Estado deve ter 2 caracteres (ex: SP)'),
  zipCode: z
    .string()
    .min(8)
    .max(10)
    .regex(/^\d{8,10}$/, 'CEP deve conter apenas números'),
  country: z.string().min(2).max(50).default('Brasil'),
})

/**
 * Schema completo de Customer (do banco)
 */
export const CustomerSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string().min(2).max(100),
  lastName: z.string().min(2).max(100),
  email: z.string().email().max(255),
  phone: z.string().min(10).max(20).nullable().optional(),
  cpf: z
    .string()
    .length(11, 'CPF deve ter 11 dígitos')
    .regex(/^\d{11}$/, 'CPF deve conter apenas números')
    .nullable()
    .optional(),
  birthDate: z.coerce.date().nullable().optional(),
  address: AddressSchema.nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

/**
 * Schema para criação de Customer (omite campos auto-gerados)
 */
export const CreateCustomerSchema = CustomerSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

/**
 * Schema para atualização de Customer (todos campos opcionais)
 */
export const UpdateCustomerSchema = CreateCustomerSchema.partial()

/**
 * Schema para query params de paginação
 */
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
})

/**
 * Schema para params com ID
 */
export const CustomerIdParamSchema = z.object({
  id: z.string().uuid('ID deve ser um UUID válido'),
})

/**
 * Type inference
 */
export type Customer = z.infer<typeof CustomerSchema>
export type Address = z.infer<typeof AddressSchema>
export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>
export type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema>
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>
export type CustomerIdParam = z.infer<typeof CustomerIdParamSchema>
