const { PrismaClient } = require('@prisma/client')

async function testConnection(url) {
  console.log('\nProbando URL:', url)
  const prisma = new PrismaClient({ datasources: { db: { url } } })
  try {
    await prisma.$connect()
    console.log('✅ CONEXION EXITOSA con:', url)
    const count = await prisma.furniture.count()
    console.log('Muebles en BD:', count)
  } catch (error) {
    console.error('❌ ERROR:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

async function main() {
  // Probar con 3307
  await testConnection("mysql://tomas:Tomas1710*@187.77.8.178:3307/PresupuestoStrong")
  // Probar con 3306
  await testConnection("mysql://tomas:Tomas1710*@187.77.8.178:3306/PresupuestoStrong")
  // Probar con 8081
  await testConnection("mysql://tomas:Tomas1710*@187.77.8.178:8081/PresupuestoStrong")
}

main()
