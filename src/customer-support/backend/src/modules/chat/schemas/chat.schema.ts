import { z } from 'zod'
import { MessageRole, ConversationStatus } from '@prisma/client'

/**
 * Schema dos enums
 */
export const MessageRoleSchema = z.nativeEnum(MessageRole)
export const ConversationStatusSchema = z.nativeEnum(ConversationStatus)

/**
 * Schema completo de Message (do banco)
 */
export const MessageSchema = z.object({
  id: z.number().int().positive(),
  conversationId: z.string().uuid(),
  role: MessageRoleSchema,
  content: z.string().min(1).max(10000),
  metadata: z.record(z.string(), z.string()).nullable().optional(),
  createdAt: z.coerce.date(),
})

/**
 * Schema completo de Conversation (do banco)
 */
export const ConversationSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  status: ConversationStatusSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

/**
 * Schema para criação de Conversation
 */
export const CreateConversationSchema = z.object({
  customerId: z.string().uuid({
    message: 'ID do cliente inválido',
  }),
})

/**
 * Schema para criação de Message
 */
export const CreateMessageSchema = z.object({
  conversationId: z.string().uuid({
    message: 'ID da conversa inválido',
  }),
  content: z
    .string()
    .min(1, 'A mensagem não pode estar vazia')
    .max(10000, 'Mensagem muito longa (máximo 10.000 caracteres)'),
  metadata: z.record(z.string(), z.string()).optional(),
})

/**
 * Schema para atualizar status da Conversation
 */
export const UpdateConversationStatusSchema = z.object({
  status: ConversationStatusSchema,
})

/**
 * Schema para enviar mensagem (usado na API)
 */
export const SendMessageSchema = z.object({
  customerId: z.string().uuid({
    message: 'ID do cliente inválido',
  }),
  conversationId: z.string().uuid().optional(), // Opcional: cria nova se não fornecido
  message: z
    .string()
    .min(1, 'A mensagem não pode estar vazia')
    .max(1000, 'Mensagem muito longa (máximo 1.000 caracteres)'),
})

/**
 * Schema para resposta do chat
 */
export const ChatResponseSchema = z.object({
  conversationId: z.string().uuid(),
  userMessage: MessageSchema,
  assistantMessage: MessageSchema,
})

/**
 * Schema para params com ID de conversa
 */
export const ConversationIdParamSchema = z.object({
  id: z.string().uuid({
    message: 'ID da conversa inválido',
  }),
})

/**
 * Schema para params com ID de customer
 */
export const CustomerIdParamSchema = z.object({
  customerId: z.string().uuid({
    message: 'ID do cliente inválido',
  }),
})

/**
 * Schema para query de paginação de mensagens
 */
export const MessagePaginationSchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

/**
 * Type inference
 */
export type Message = z.infer<typeof MessageSchema>
export type Conversation = z.infer<typeof ConversationSchema>
export type CreateConversationInput = z.infer<typeof CreateConversationSchema>
export type CreateMessageInput = z.infer<typeof CreateMessageSchema>
export type UpdateConversationStatusInput = z.infer<
  typeof UpdateConversationStatusSchema
>
export type SendMessageInput = z.infer<typeof SendMessageSchema>
export type ChatResponse = z.infer<typeof ChatResponseSchema>
export type ConversationIdParam = z.infer<typeof ConversationIdParamSchema>
export type CustomerIdParam = z.infer<typeof CustomerIdParamSchema>
export type MessagePagination = z.infer<typeof MessagePaginationSchema>