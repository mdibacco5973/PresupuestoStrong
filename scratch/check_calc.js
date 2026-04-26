
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const defaultWood = await prisma.wood.findFirst({
    where: { isDefaultWood: true }
  })
  
  const furnitures = await prisma.furniture.findMany({
    include: {
      parts: {
        include: {
          part: true
        }
      }
    },
    take: 1
  })

  console.log("--- MADERA POR DEFECTO ---")
  if (defaultWood) {
    console.log(`Nombre: ${defaultWood.name}`)
    console.log(`Precio: $${defaultWood.price}`)
    console.log(`Espesor: ${defaultWood.thickness}mm`)
  } else {
    console.log("No hay madera por defecto.")
  }

  console.log("\n--- ÚLTIMO MUEBLE ---")
  if (furnitures.length > 0) {
    const f = furnitures[0]
    console.log(`Nombre: ${f.name} (${f.length}x${f.width}x${f.depth}mm)`)
    console.log(`Precio Mueble Actual: $${f.furniturePrice}`)
    
    console.log("\n--- PIEZAS Y CÁLCULOS ---")
    let totalCalculado = 0
    for (const p of f.parts) {
      const part = p.part
      const L = f.length
      const A = f.width
      const P = f.depth
      const E = defaultWood ? Number(defaultWood.thickness) : 0
      
      const evalFormula = (formula, context) => {
        if (!formula) return 0
        try {
          const expr = formula.toUpperCase()
            .replace(/L/g, context.L)
            .replace(/A/g, context.A)
            .replace(/P/g, context.P)
            .replace(/E/g, context.E)
          return eval(expr)
        } catch (e) { return 0 }
      }

      const lPart = evalFormula(part.formulaLength, { L, A, P, E })
      const wPart = evalFormula(part.formulaWidth, { L, A, P, E })
      const surface = (lPart * wPart) / 1000000
      const price = surface * Number(defaultWood?.price || 0)
      const subtotal = price * p.quantity
      totalCalculado += subtotal

      console.log(`Pieza: ${part.name}`)
      console.log(`  Fórmulas: ${part.formulaLength} x ${part.formulaWidth}`)
      console.log(`  Calculado: ${lPart} x ${wPart} mm`)
      console.log(`  Superficie: ${surface.toFixed(4)} m2`)
      console.log(`  Precio Unit: $${price.toFixed(2)}`)
      console.log(`  Cantidad: ${p.quantity}`)
      console.log(`  Subtotal: $${subtotal.toFixed(2)}`)
    }
    console.log(`\nTOTAL CALCULADO FINAL: $${totalCalculado.toFixed(2)}`)
  } else {
    console.log("No hay muebles cargados.")
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
