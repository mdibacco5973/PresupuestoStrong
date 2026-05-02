'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// ─────────────────────────────────────────────
// Helper: evalúa una fórmula con variables L, A, P, E
// ─────────────────────────────────────────────
function evaluateFormula(
  formula: string | null,
  context: { L: number; A: number; P: number; E: number }
): number {
  if (!formula) return 0
  try {
    const expression = formula
      .toUpperCase()
      .replace(/L/g, context.L.toString())
      .replace(/A/g, context.A.toString())
      .replace(/P/g, context.P.toString())
      .replace(/E/g, context.E.toString())
     
    const result = new Function(`return ${expression}`)()
    return Math.max(0, Math.round(result))
  } catch {
    return 0
  }
}

// ─────────────────────────────────────────────
// Recalcula los precios de TODOS los muebles
// usando los precios actuales de la base de datos.
// Se llama automáticamente cada vez que se actualiza
// el precio de una madera, herraje, acabado, 
// mano de obra o extra.
// ─────────────────────────────────────────────
export async function recalculateAllFurniturePrices() {
  try {
    // 1. Obtener la madera por defecto (para el precio de las piezas)
    const defaultWood = await prisma.wood.findFirst({
      where: { isDefaultWood: true },
    })
    // Si no hay madera por defecto, usar la primera disponible
    const woodForCalc = defaultWood ?? await prisma.wood.findFirst()
    const woodPrice = woodForCalc ? Number(woodForCalc.price) : 0
    const woodThickness = woodForCalc ? (woodForCalc.thickness ? Number(woodForCalc.thickness) : 0) : 0

    // 2. Obtener todos los muebles con sus configuraciones completas
    const furnitures = await prisma.furniture.findMany({
      include: {
        parts: {
          include: { part: true },
        },
        extraParts: {
          include: { extraPart: true },
        },
        costs: {
          include: { cost: true },
        },
        laborCosts: {
          include: { laborCost: true },
        },
        additionalCosts: {
          include: { additionalCost: true },
        },
      },
    })

    // 3. Recalcular y actualizar cada mueble en una transacción
    await prisma.$transaction(
      furnitures.map((furniture) => {
        const context = {
          L: Number(furniture.length),
          A: Number(furniture.width),
          P: Number(furniture.depth),
          E: woodThickness,
        }

        // Precio de piezas (madera)
        const furniturePrice = furniture.parts.reduce((acc, p) => {
          if (!p.part) return acc
          const l = evaluateFormula(p.part.formulaLength, context)
          const w = evaluateFormula(p.part.formulaWidth, context)
          const surfaceM2 = (l * w) / 1_000_000
          return acc + surfaceM2 * woodPrice * p.quantity
        }, 0)

        // Precio de herrajes
        const hardwarePrice = furniture.extraParts.reduce((acc, ep) => {
          if (!ep.extraPart) return acc
          return acc + Number(ep.extraPart.price) * ep.quantity
        }, 0)

        // Precio de acabados
        const costPrice = furniture.costs.reduce((acc, c) => {
          if (!c.cost) return acc
          return acc + Number(c.cost.price) * c.quantity
        }, 0)

        // Precio de mano de obra
        const laborPrice = furniture.laborCosts.reduce((acc, l) => {
          if (!l.laborCost) return acc
          return acc + Number(l.laborCost.price) * Number(l.quantity)
        }, 0)

        // Precio de extras
        const additionalPrice = furniture.additionalCosts.reduce((acc, a) => {
          if (!a.additionalCost) return acc
          return acc + Number(a.additionalCost.price) * a.quantity
        }, 0)

        const furnitureTotal =
          furniturePrice + hardwarePrice + costPrice + laborPrice + additionalPrice

        return prisma.furniture.update({
          where: { id: furniture.id },
          data: {
            furniturePrice,
            hardwarePrice,
            costPrice,
            laborPrice,
            additionalPrice,
            furnitureTotal,
          },
        })
      })
    )

    revalidatePath('/furniture')
    console.log(`[recalculate] ${furnitures.length} mueble(s) actualizados correctamente.`)
  } catch (error) {
    console.error('[recalculate] Error al recalcular precios de muebles:', error)
    throw new Error('Failed to recalculate furniture prices')
  }
}
