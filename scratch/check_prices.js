
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const costs = await prisma.cost.findMany({
    where: { name: { contains: 'LAQUEA' } }
  })
  console.log(JSON.stringify(costs, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
