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
  edgeSize: number | null
  orientation: string | null
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
  image: string | null
  parts: FurnitureConfigInput[]
  extraParts: FurnitureExtraConfigInput[]
  costs: FurnitureCostConfigInput[]
  laborCosts: FurnitureLaborCostConfigInput[]
  additionalCosts: FurnitureAdditionalCostConfigInput[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeFurniture(item: any) {
  if (!item) return null
  return {
    ...item,
    id: item.id.toString(),
    idTipoMueble: item.idTipoMueble?.toString(),
    furniturePrice: Number(item.furniturePrice),
    hardwarePrice: Number(item.hardwarePrice),
    costPrice: Number(item.costPrice),
    laborPrice: Number(item.laborPrice),
    additionalPrice: Number(item.additionalPrice),
    furnitureTotal: Number(item.furnitureTotal),
    image: item.image ? `data:image/png;base64,${Buffer.from(item.image).toString('base64')}` : null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parts: item.parts?.map((p: any) => ({
      ...p,
      id: p.id.toString(),
      idFurniture: p.idFurniture.toString(),
      idPart: p.idPart.toString(),
      edgeSize: p.edgeSize ? Number(p.edgeSize) : null,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    extraParts: item.extraParts?.map((ep: any) => ({
      ...ep,
      id: ep.id.toString(),
      idFurniture: ep.idFurniture.toString(),
      idPartExtra: ep.idPartExtra.toString(),
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    costs: item.costs?.map((c: any) => ({
      ...c,
      id: c.id.toString(),
      idFurniture: c.idFurniture.toString(),
      idCost: c.idCost.toString(),
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    laborCosts: item.laborCosts?.map((l: any) => ({
      ...l,
      id: l.id.toString(),
      idFurniture: l.idFurniture.toString(),
      idLaborCost: l.idLaborCost.toString(),
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    additionalCosts: item.additionalCosts?.map((a: any) => ({
      ...a,
      id: a.id.toString(),
      idFurniture: a.idFurniture.toString(),
      idAdditionalCosts: a.idAdditionalCosts.toString(),
    })),
  }
}

export async function getFurnitures() {
  const items = await prisma.furniture.findMany({
    include: {
      parts: { include: { part: true } },
      extraParts: { include: { extraPart: true } },
      costs: { include: { cost: true } },
      laborCosts: { include: { laborCost: true } },
      additionalCosts: { include: { additionalCost: true } },
    },
    orderBy: { name: 'asc' },
  })
  return items.map(serializeFurniture)
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
            part: { connect: { id: BigInt(p.idPart) } },
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
            extraPart: { connect: { id: BigInt(ep.idPartExtra) } },
            quantity: ep.quantity,
          })),
        },
        costs: {
          create: data.costs.map(c => ({
            cost: { connect: { id: BigInt(c.idCost) } },
            quantity: c.quantity,
          })),
        },
        laborCosts: {
          create: data.laborCosts.map(l => ({
            laborCost: { connect: { id: BigInt(l.idLaborCost) } },
            quantity: l.quantity,
          })),
        },
        additionalCosts: {
          create: data.additionalCosts.map(a => ({
            additionalCost: { connect: { id: BigInt(a.idAdditionalCosts) } },
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
    return serializeFurniture(item)
  } catch (error) {
    console.error('Error creating furniture:', error)
    throw error
  }
}

export async function updateFurniture(id: string | number, data: FurnitureInput) {
  try {
    const furnitureId = BigInt(id)
    const imageBuffer = data.image ? Buffer.from(data.image.split(',')[1] || data.image, 'base64') : null

    // Use transaction to delete and recreate nested items
    const item = await prisma.$transaction(async (tx) => {
      await tx.furnitureConfig.deleteMany({ where: { idFurniture: furnitureId } })
      await tx.furnitureExtraConfig.deleteMany({ where: { idFurniture: furnitureId } })
      await tx.furnitureCostConfig.deleteMany({ where: { idFurniture: furnitureId } })
      await tx.furnitureLaborCostConfig.deleteMany({ where: { idFurniture: furnitureId } })
      await tx.furnitureAdditionalCostConfig.deleteMany({ where: { idFurniture: furnitureId } })

      return await tx.furniture.update({
        where: { id: furnitureId },
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
              part: { connect: { id: BigInt(p.idPart) } },
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
              extraPart: { connect: { id: BigInt(ep.idPartExtra) } },
              quantity: ep.quantity,
            })),
          },
          costs: {
            create: data.costs.map(c => ({
              cost: { connect: { id: BigInt(c.idCost) } },
              quantity: c.quantity,
            })),
          },
          laborCosts: {
            create: data.laborCosts.map(l => ({
              laborCost: { connect: { id: BigInt(l.idLaborCost) } },
              quantity: l.quantity,
            })),
          },
          additionalCosts: {
            create: data.additionalCosts.map(a => ({
              additionalCost: { connect: { id: BigInt(a.idAdditionalCosts) } },
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
    return serializeFurniture(item)
  } catch (error) {
    console.error('Error updating furniture:', error)
    throw error
  }
}

export async function deleteFurniture(id: number | string) {
  try {
    await prisma.furniture.delete({
      where: { id: BigInt(id) },
    })
    revalidatePath('/furniture')
    return { success: true }
  } catch (error) {
    console.error('Error deleting furniture:', error)
    throw error
  }
}
