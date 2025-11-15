import { faker } from '@faker-js/faker/locale/pt_BR'
import { PrismaClient, PurchaseStatus } from '@prisma/client'
import 'dotenv/config'
import { z } from 'zod'

const prisma = new PrismaClient()

// ============================================
// SCHEMAS DE VALIDAÇÃO ZOD
// ============================================

/**
 * Schema de validação para endereço
 */
const addressSchema = z.object({
  street: z.string().min(3).max(255),
  number: z.string().min(1).max(10),
  complement: z.string().max(100).nullable(),
  neighborhood: z.string().min(2).max(100),
  city: z.string().min(2).max(100),
  state: z.string().length(2),
  zipCode: z.string().min(8).max(10),
  country: z.string().min(2).max(50),
})

/**
 * Schema de validação para cliente
 */
const customerSchema = z.object({
  firstName: z.string().min(2).max(100),
  lastName: z.string().min(2).max(100),
  email: z.string().email().max(255),
  phone: z.string().min(10).max(20).nullable(),
  cpf: z.string().length(11).regex(/^\d{11}$/, 'CPF deve conter apenas 11 dígitos'),
  birthDate: z.date(),
  address: addressSchema,
})

/**
 * Schema de validação para compra
 */
const purchaseSchema = z.object({
  orderNumber: z.string().min(5).max(50),
  productName: z.string().min(3).max(255),
  productCategory: z.string().min(2).max(100).nullable(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  totalPrice: z.number().positive(),
  status: z.nativeEnum(PurchaseStatus),
  purchaseDate: z.date(),
  deliveryDate: z.date().nullable(),
  notes: z.string().max(1000).nullable(),
})

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Gera um CPF válido (apenas dígitos)
 * Formato: 11 dígitos sem pontuação
 */
function generateCPF(): string {
  return faker.string.numeric(11)
}

/**
 * Gera um número de pedido único
 * Formato: ABC123456
 */
function generateOrderNumber(): string {
  const letters = faker.string.alpha({ length: 3, casing: 'upper' })
  const numbers = faker.string.numeric(6)
  return `${letters}${numbers}`
}

/**
 * Gera dados de endereço no formato JSONB
 */
function generateAddress() {
  const address = {
    street: faker.location.streetAddress(),
    number: faker.location.buildingNumber(),
    complement: faker.datatype.boolean() ? faker.location.secondaryAddress() : null,
    neighborhood: faker.location.county(),
    city: faker.location.city(),
    state: faker.location.state({ abbreviated: true }),
    zipCode: faker.location.zipCode().replace(/\D/g, ''),
    country: 'Brasil',
  }

  // Validar endereço com Zod
  return addressSchema.parse(address)
}

/**
 * Gera dados de cliente validados
 */
function generateCustomerData() {
  const firstName = faker.person.firstName()
  const lastName = faker.person.lastName()

  const customerData = {
    firstName,
    lastName,
    email: faker.internet
      .email({
        firstName: firstName.toLowerCase(),
        lastName: lastName.toLowerCase(),
      })
      .toLowerCase(),
    phone: faker.phone.number(),
    cpf: generateCPF(),
    birthDate: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }),
    address: generateAddress(),
  }

  // Validar cliente com Zod
  return customerSchema.parse(customerData)
}

/**
 * Gera dados de compra validados
 */
function generatePurchaseData(customerId: string) {
  const quantity = faker.number.int({ min: 1, max: 3 })
  const unitPrice = parseFloat(faker.commerce.price({ min: 20, max: 2000, dec: 2 }))
  const totalPrice = quantity * unitPrice

  // Status com probabilidades realistas
  const statusOptions: PurchaseStatus[] = ['COMPLETED', 'DELIVERED', 'SHIPPED', 'PROCESSING']
  const statusWeights = [0.6, 0.25, 0.1, 0.05] // 60% completed, 25% delivered, etc
  const status = faker.helpers.weightedArrayElement(
    statusOptions.map((s, idx) => ({ weight: statusWeights[idx]!, value: s }))
  )

  // Data de compra nos últimos 180 dias
  const purchaseDate = faker.date.recent({ days: 180 })

  // Data de entrega (se aplicável)
  let deliveryDate = null
  if (status === 'DELIVERED' || status === 'COMPLETED') {
    deliveryDate = faker.date.between({
      from: purchaseDate,
      to: new Date(),
    })
  }

  const purchaseData = {
    orderNumber: generateOrderNumber(),
    productName: faker.commerce.productName(),
    productCategory: faker.commerce.department(),
    quantity,
    unitPrice,
    totalPrice,
    status,
    purchaseDate,
    deliveryDate,
    notes: faker.datatype.boolean({ probability: 0.3 })
      ? faker.lorem.sentence()
      : null,
  }

  // Validar compra com Zod
  return purchaseSchema.parse(purchaseData)
}

// ============================================
// SEED PRINCIPAL
// ============================================

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...\n')

  // Limpar dados existentes
  console.log('🗑️  Limpando dados existentes...')
  await prisma.message.deleteMany()
  await prisma.conversation.deleteMany()
  await prisma.purchase.deleteMany()
  await prisma.customer.deleteMany()
  console.log('✅ Dados limpos!\n')

  // Criar 100 clientes com 2-8 compras cada
  console.log('👥 Criando 100 clientes com compras...')

  const customers = []
  let totalPurchases = 0

  for (let i = 0; i < 100; i++) {
    try {
      // Gerar e validar dados do cliente
      const customerData = generateCustomerData()

      // Criar cliente no banco
      const customer = await prisma.customer.create({
        data: customerData,
      })

      customers.push(customer)

      // Criar 2-8 compras para cada cliente
      const numPurchases = faker.number.int({ min: 2, max: 8 })

      for (let j = 0; j < numPurchases; j++) {
        try {
          // Gerar e validar dados da compra
          const purchaseData = generatePurchaseData(customer.id)

          // Criar compra no banco
          await prisma.purchase.create({
            data: {
              ...purchaseData,
              customerId: customer.id,
            },
          })

          totalPurchases++
        } catch (error) {
          console.error(`   ⚠️  Erro ao criar compra para cliente ${i + 1}:`, error)
        }
      }

      // Progresso
      if ((i + 1) % 10 === 0) {
        console.log(`   📊 ${i + 1}/100 clientes criados...`)
      }
    } catch (error) {
      console.error(`   ⚠️  Erro ao criar cliente ${i + 1}:`, error)
    }
  }

  console.log(`✅ ${customers.length} clientes criados!`)
  console.log(`✅ ${totalPurchases} compras criadas!\n`)

  // Estatísticas
  console.log('📊 Estatísticas:')
  console.log(`   • Média de compras por cliente: ${(totalPurchases / customers.length).toFixed(1)}`)

  const statusCounts = await prisma.purchase.groupBy({
    by: ['status'],
    _count: true,
  })

  console.log('   • Compras por status:')
  statusCounts.forEach((s) => {
    console.log(`      - ${s.status}: ${s._count}`)
  })

  // Criar algumas conversas de exemplo (opcional)
  console.log('\n💬 Criando conversas de exemplo...')

  const sampleCustomers = faker.helpers.arrayElements(customers, 10)

  for (const customer of sampleCustomers) {
    const conversation = await prisma.conversation.create({
      data: {
        customerId: customer.id,
        title: `Atendimento - ${customer.firstName}`,
        status: 'ACTIVE',
      },
    })

    // Criar algumas mensagens de exemplo
    await prisma.message.createMany({
      data: [
        {
          conversationId: conversation.id,
          role: 'USER',
          content: 'Olá! Gostaria de saber sobre meu pedido.',
        },
        {
          conversationId: conversation.id,
          role: 'ASSISTANT',
          content: `Olá ${customer.firstName}! Claro, vou verificar seus pedidos. Um momento, por favor.`,
        },
      ],
    })
  }

  console.log(`✅ ${sampleCustomers.length} conversas de exemplo criadas!\n`)

  console.log('🎉 Seed concluído com sucesso!')
  console.log('\n📝 Resumo:')
  console.log(`   • Clientes: ${customers.length}`)
  console.log(`   • Compras: ${totalPurchases}`)
  console.log(`   • Conversas: ${sampleCustomers.length}`)
  console.log(`   • Validação Zod: ✅ Ativa`)
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:')
    console.error(e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
