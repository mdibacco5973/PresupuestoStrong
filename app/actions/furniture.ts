'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export type FurnitureConfigInput = {
  idPart: number
  quantity: number
  edges1: boolean
  edges2: boolean
  edges3: boolean
  edges4: boolean
  edgeSize: number
  orientation?: string | null
}

export type FurnitureExtraConfigInput = {
  idPartExtra: number
  quantity: number
}

export type FurnitureCostConfigInput = {
  idCost: number
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
  furnitureTotal: number
  image?: string | null
  parts: FurnitureConfigInput[]
  extraParts: FurnitureExtraConfigInput[]
  costs: FurnitureCostConfigInput[]
}

export async function getFurnitures() {
  try {
    const items = await prisma.furniture.findMany({
      include: {
        parts: { include: { part: true } },
        extraParts: { include: { extraPart: true } },
        costs: { include: { cost: true } },
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

      return {
        ...item,
        furniturePrice: Number(item.furniturePrice),
        hardwarePrice: hardwareTotal,
        costPrice: costTotal,
        furnitureTotal: Number(item.furnitureTotal),
        image: item.image ? Buffer.from(item.image).toString('base64') : null,
        parts: item.parts.map(p => ({ 
          ...p,
          edgeSize: Number(p.edgeSize)
        })),
        extraParts: item.extraParts.map(ep => ({ 
          ...ep,
          extraPart: ep.extraPart ? { ...ep.extraPart, price: Number(ep.extraPart.price) } : null
        })),
        costs: item.costs.map(c => ({ 
          ...c,
          cost: c.cost ? { ...c.cost, price: Number(c.cost.price) } : null
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
        furnitureTotal: data.furnitureTotal,
        image: imageBuffer,
        parts: {
          create: data.parts.map(p => ({
            idPart: p.idPart,
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
            idPartExtra: ep.idPartExtra,
            quantity: ep.quantity,
          })),
        },
        costs: {
          create: data.costs.map(c => ({
            idCost: c.idCost,
            quantity: c.quantity,
          })),
        },
      },
      include: {
        parts: true,
        extraParts: true,
        costs: true,
      }
    })
    revalidatePath('/furniture')
    return {
      ...item,
      furniturePrice: Number(item.furniturePrice),
      hardwarePrice: Number(item.hardwarePrice),
      costPrice: Number(item.costPrice),
      furnitureTotal: Number(item.furnitureTotal),
      parts: item.parts.map(p => ({ ...p, edgeSize: Number(p.edgeSize) })),
    }
  } catch (error) {
    console.error('Error creating furniture:', error)
    throw new Error('Failed to create furniture')
  }
}

export async function updateFurniture(id: number, data: FurnitureInput) {
  try {
    const imageBuffer = data.image ? Buffer.from(data.image.split(',')[1] || data.image, 'base64') : null

    const item = await prisma.$transaction(async (tx) => {
      // Delete existing configs
      await tx.furnitureConfig.deleteMany({ where: { idFurniture: id } })
      await tx.furnitureExtraConfig.deleteMany({ where: { idFurniture: id } })
      await tx.furnitureCostConfig.deleteMany({ where: { idFurniture: id } })

      return await tx.furniture.update({
        where: { id },
        data: {
          name: data.name,
          code: data.code,
          length: data.length,
          width: data.width,
          depth: data.depth,
          furniturePrice: data.furniturePrice,
          hardwarePrice: data.hardwarePrice,
          costPrice: data.costPrice,
          furnitureTotal: data.furnitureTotal,
          image: imageBuffer,
          parts: {
            create: data.parts.map(p => ({
              idPart: p.idPart,
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
              idPartExtra: ep.idPartExtra,
              quantity: ep.quantity,
            })),
          },
          costs: {
            create: data.costs.map(c => ({
              idCost: c.idCost,
              quantity: c.quantity,
            })),
          },
        },
        include: {
          parts: true,
          extraParts: true,
          costs: true,
        }
      })
    })

    revalidatePath('/furniture')
    return {
      ...item,
      furniturePrice: Number(item.furniturePrice),
      hardwarePrice: Number(item.hardwarePrice),
      costPrice: Number(item.costPrice),
      furnitureTotal: Number(item.furnitureTotal),
    }
  } catch (error) {
    console.error('Error updating furniture:', error)
    throw new Error('Failed to update furniture')
  }
}

export async function deleteFurniture(id: number) {
  try {
    await prisma.furniture.delete({
      where: { id },
    })
    revalidatePath('/furniture')
  } catch (error) {
    console.error('Error deleting furniture:', error)
    throw new Error('Failed to delete furniture')
  }
}
