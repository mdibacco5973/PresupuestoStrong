const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient({
  datasources: {
    db: { url: "mysql://tomas:Tomas1710*@187.77.8.178:3307/PresupuestoStrong" }
  }
})

async function main() {
  try {
    console.log('--- TEST PROD DB SCHEMAS ---')
    
    console.log('Probrando Woods...')
    const woods = await prisma.wood.findMany()
    console.log('Woods count:', woods.length)

    console.log('Probrando Parts...')
    const parts = await prisma.part.findMany()
    console.log('Parts count:', parts.length)

    console.log('Probrando Furnitures...')
    const furnitures = await prisma.furniture.findMany({
      include: {
        parts: { include: { part: true } },
        extraParts: { include: { extraPart: true } },
        costs: { include: { cost: true } },
        laborCosts: { include: { laborCost: true } },
        additionalCosts: { include: { additionalCost: true } },
      }
    })
    console.log('Furnitures count:', furnitures.length)

    console.log('Probrando Quotes...')
    const quotes = await prisma.quote.findMany()
    console.log('Quotes count:', quotes.length)

    console.log('✅ TODAS LAS TABLAS PROBADAS CON EXITO')
  } catch (error) {
    console.error('❌ ERROR DETALLADO:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
