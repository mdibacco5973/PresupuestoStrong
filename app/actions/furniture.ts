'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export type FurnitureConfigInput = {
  idPart: number | string
  quantity: number
  edges1: boolean
  edges2: boolean
  edges3: boolean
  edges4: boolean
  edgeSize: number
  orientation?: string | null
}

export type FurnitureExtraConfigInput = {
  idPartExtra: number | string
  quantity: number
}

export type FurnitureCostConfigInput = {
  idCost: number | string
  quantity: number
}

export type FurnitureLaborCostConfigInput = {
  idLaborCost: number | string
  quantity: number
}

export type FurnitureAdditionalCostConfigInput = {
  idAdditionalCosts: number | string
  quantity: number
}

export type FurnitureInput = {
  name: string
  code: string
  length: number
  width: number
  depth: number
  furniturePrice: number
  hardwarePrice: number
  costPrice: number
  laborPrice: number
  additionalPrice: number
  furnitureTotal: number
  image?: string | null
  parts: FurnitureConfigInput[]
  extraParts: FurnitureExtraConfigInput[]
  costs: FurnitureCostConfigInput[]
  laborCosts: FurnitureLaborCostConfigInput[]
  additionalCosts: FurnitureAdditionalCostConfigInput[]
}

export async function getFurnitures() {
  try {
    const items = await prisma.furniture.findMany({
      include: {
        parts: { include: { part: true } },
        extraParts: { include: { extraPart: true } },
        costs: { include: { cost: true } },
        laborCosts: { include: { laborCost: true } },
        additionalCosts: { include: { additionalCost: true } },
      },
      orderBy: { id: 'desc' },
    })
    return items.map(item => {
      const hardwareTotal = item.extraParts.reduce((acc, ep) => {
        return acc + (ep.extraPart ? Number(ep.extraPart.price) * ep.quantity : 0)
      }, 0)

      const costTotal = item.costs.reduce((acc, c) => {
        return acc + (c.cost ? Number(c.cost.price) * c.quantity : 0)
      }, 0)

      const laborTotal = item.laborCosts.reduce((acc, l) => {
        return acc + (l.laborCost ? Number(l.laborCost.price) * l.quantity : 0)
      }, 0)

      const additionalTotal = item.additionalCosts.reduce((acc, a) => {
        return acc + (a.additionalCost ? Number(a.additionalCost.price) * a.quantity : 0)
      }, 0)

      return {
        ...item,
        id: item.id.toString(),
        furniturePrice: Number(item.furniturePrice),
        hardwarePrice: hardwareTotal,
        costPrice: costTotal,
        laborPrice: laborTotal,
        additionalPrice: additionalTotal,
        furnitureTotal: Number(item.furnitureTotal),
        image: item.image ? Buffer.from(item.image).toString('base64') : null,
        parts: item.parts.map(p => ({ 
          ...p,
          id: p.id.toString(),
          idFurniture: p.idFurniture.toString(),
          idPart: p.idPart.toString(),
          edgeSize: Number(p.edgeSize)
        })),
        extraParts: item.extraParts.map(ep => ({ 
          ...ep,
          id: ep.id.toString(),
          idFurniture: ep.idFurniture.toString(),
          idPartExtra: ep.idPartExtra.toString(),
          extraPart: ep.extraPart ? { ...ep.extraPart, id: ep.extraPart.id.toString(), price: Number(ep.extraPart.price) } : null
        })),
        costs: item.costs.map(c => ({ 
          ...c,
          id: c.id.toString(),
          idFurniture: c.idFurniture.toString(),
          idCost: c.idCost.toString(),
          cost: c.cost ? { ...c.cost, id: c.cost.id.toString(), price: Number(c.cost.price) } : null
        })),
        laborCosts: item.laborCosts.map(l => ({
          ...l,
          id: l.id.toString(),
          idFurniture: l.idFurniture.toString(),
          idLaborCost: l.idLaborCost.toString(),
          laborCost: l.laborCost ? { ...l.laborCost, id: l.laborCost.id.toString(), price: Number(l.laborCost.price) } : null
        })),
        additionalCosts: item.additionalCosts.map(a => ({
          ...a,
          id: a.id.toString(),
          idFurniture: a.idFurniture.toString(),
          idAdditionalCosts: a.idAdditionalCosts.toString(),
          additionalCost: a.additionalCost ? { ...a.additionalCost, id: a.additionalCost.id.toString(), price: Number(a.additionalCost.price) } : null
        })),
      }
    })
  } catch (error: any) {
    console.error('--- DETAILED PRISMA ERROR ---')
    console.error('Message:', error.message)
    console.error('Code:', error.code)
    console.error('Meta:', JSON.stringify(error.meta, null, 2))
    throw new Error(`Prisma Error: ${error.message || 'Unknown'}`)
  }
}

export async function createFurniture(data: FurnitureInput) {
  try {
    const imageBuffer = data.image ? Buffer.from(data.image.split(',')[1] || data.image, 'base64') : null

    const item = await prisma.furniture.create({
      data: {
        name: data.name,
        code: data.code,
        length: data.length,
        width: data.width,
        depth: data.depth,
        furniturePrice: data.furniturePrice,
        hardwarePrice: data.hardwarePrice,
        costPrice: data.costPrice,
        laborPrice: data.laborPrice || 0,
        additionalPrice: data.additionalPrice || 0,
        furnitureTotal: data.furnitureTotal,
        image: imageBuffer,
        parts: {
          create: data.parts.map(p => ({
            idPart: BigInt(p.idPart),
            quantity: p.quantity,
            edges1: p.edges1,
            edges2: p.edges2,
            edges3: p.edges3,
            edges4: p.edges4,
            edgeSize: p.edgeSize,
            orientation: p.orientation,
          })),
        },
        extraParts: {
          create: data.extraParts.map(ep => ({
            idPartExtra: BigInt(ep.idPartExtra),
            quantity: ep.quantity,
          })),
        },
        costs: {
          create: data.costs.map(c => ({
            idCost: BigInt(c.idCost),
            quantity: c.quantity,
          })),
        },
        laborCosts: {
          create: data.laborCosts.map(l => ({
            idLaborCost: BigInt(l.idLaborCost),
            quantity: l.quantity,
          })),
        },
        additionalCosts: {
          create: data.additionalCosts.map(a => ({
            idAdditionalCosts: BigInt(a.idAdditionalCosts),
            quantity: a.quantity,
          })),
        },
      },
      include: {
        parts: true,
        extraParts: true,
        costs: true,
        laborCosts: true,
        additionalCosts: true,
      }
    })
    revalidatePath('/furniture')
    return {
      ...item,
      furniturePrice: Number(item.furniturePrice),
      hardwarePrice: Number(item.hardwarePrice),
      costPrice: Number(item.costPrice),
      laborPrice: Number((item as any).laborPrice || 0),
      additionalPrice: Number((item as any).additionalPrice || 0),
      furnitureTotal: Number(item.furnitureTotal),
      parts: item.parts.map(p => ({ ...p, edgeSize: Number(p.edgeSize) })),
    }
  } catch (error) {
    console.error('Error creating furniture:', error)
    throw new Error('Failed to create furniture')
  }
}

export async function updateFurniture(id: number | string, data: FurnitureInput) {
  try {
    const imageBuffer = data.image ? Buffer.from(data.image.split(',')[1] || data.image, 'base64') : null

    const item = await prisma.$transaction(async (tx) => {
      // Delete existing configs
      await tx.furnitureConfig.deleteMany({ where: { idFurniture: BigInt(id) } })
      await tx.furnitureExtraConfig.deleteMany({ where: { idFurniture: BigInt(id) } })
      await tx.furnitureCostConfig.deleteMany({ where: { idFurniture: BigInt(id) } })
      await tx.furnitureLaborCostConfig.deleteMany({ where: { idFurniture: BigInt(id) } })
      await tx.furnitureAdditionalCostConfig.deleteMany({ where: { idFurniture: BigInt(id) } })

      return await tx.furniture.update({
        where: { id: BigInt(id) },
        data: {
          name: data.name,
          code: data.code,
          length: data.length,
          width: data.width,
          depth: data.depth,
          furniturePrice: data.furniturePrice,
          hardwarePrice: data.hardwarePrice,
          costPrice: data.costPrice,
          laborPrice: data.laborPrice || 0,
          additionalPrice: data.additionalPrice || 0,
          furnitureTotal: data.furnitureTotal,
          image: imageBuffer,
          parts: {
            create: data.parts.map(p => ({
              idPart: BigInt(p.idPart),
              quantity: p.quantity,
              edges1: p.edges1,
              edges2: p.edges2,
              edges3: p.edges3,
              edges4: p.edges4,
              edgeSize: p.edgeSize,
              orientation: p.orientation,
            })),
          },
          extraParts: {
            create: data.extraParts.map(ep => ({
              idPartExtra: BigInt(ep.idPartExtra),
              quantity: ep.quantity,
            })),
          },
          costs: {
            create: data.costs.map(c => ({
              idCost: BigInt(c.idCost),
              quantity: c.quantity,
            })),
          },
          laborCosts: {
            create: data.laborCosts.map(l => ({
              idLaborCost: BigInt(l.idLaborCost),
              quantity: l.quantity,
            })),
          },
          additionalCosts: {
            create: data.additionalCosts.map(a => ({
              idAdditionalCosts: BigInt(a.idAdditionalCosts),
              quantity: a.quantity,
            })),
          },
        },
        include: {
          parts: true,
          extraParts: true,
          costs: true,
          laborCosts: true,
          additionalCosts: true,
        }
      })
    })

    revalidatePath('/furniture')
    return {
      ...item,
      furniturePrice: Number(item.furniturePrice),
      hardwarePrice: Number(item.hardwarePrice),
      costPrice: Number(item.costPrice),
      laborPrice: Number((item as any).laborPrice || 0),
      additionalPrice: Number((item as any).additionalPrice || 0),
      furnitureTotal: Number(item.furnitureTotal),
      parts: item.parts.map(p => ({ ...p, edgeSize: Number(p.edgeSize) })),
    }
  } catch (error) {
    console.error('Error updating furniture:', error)
    throw new Error('Failed to update furniture')
  }
}

export async function deleteFurniture(id: number | string) {
  try {
    await prisma.furniture.delete({
      where: { id: BigInt(id) },
    })
    revalidatePath('/furniture')
  } catch (error) {
    console.error('Error deleting furniture:', error)
    throw new Error('Failed to delete furniture')
  }
}
