'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export type WoodInput = {
  name: string
  thickness: number | null
  length: number | null
  width: number | null
  price: number
  isBack: boolean
  isCabinet: boolean
  isFront: boolean
  surfaceArea: number
  isDefaultWood: boolean
}

export async function getWoods() {
  try {
    const woods = await prisma.wood.findMany({
      orderBy: { dateUpd: 'desc' },
    })
    return woods.map(wood => ({
      ...wood,
      id: wood.id.toString(),
      price: Number(wood.price),
      surfaceArea: Number(wood.surfaceArea),
    }))
  } catch (error) {
    console.error('Error fetching woods:', error)
    throw new Error('Failed to fetch woods')
  }
}

export async function createWood(data: WoodInput) {
  try {
    const wood = await prisma.$transaction(async (tx) => {
      if (data.isDefaultWood) {
        await tx.wood.updateMany({
          where: {
            isDefaultWood: true,
            isBack: data.isBack
          },
          data: { isDefaultWood: false },
        })
      }

      return await tx.wood.create({
        data: {
          name: data.name,
          thickness: data.thickness,
          length: data.length,
          width: data.width,
          price: data.price,
          isBack: data.isBack,
          isCabinet: data.isCabinet,
          isFront: data.isFront,
          surfaceArea: data.surfaceArea,
          isDefaultWood: data.isDefaultWood,
        },
      })
    })

    revalidatePath('/woods')
    return {
      ...wood,
      id: wood.id.toString(),
      price: Number(wood.price),
      surfaceArea: Number(wood.surfaceArea),
    }
  } catch (error) {
    console.error('Error creating wood:', error)
    throw new Error('Failed to create wood')
  }
}

export async function updateWood(id: number | string, data: WoodInput) {
  try {
    const wood = await prisma.$transaction(async (tx) => {
      if (data.isDefaultWood) {
        await tx.wood.updateMany({
          where: {
            isDefaultWood: true,
            isBack: data.isBack,
            id: { not: BigInt(id) }
          },
          data: { isDefaultWood: false },
        })
      }

      return await tx.wood.update({
        where: { id: BigInt(id) },
        data: {
          name: data.name,
          thickness: data.thickness,
          length: data.length,
          width: data.width,
          price: data.price,
          isBack: data.isBack,
          isCabinet: data.isCabinet,
          isFront: data.isFront,
          surfaceArea: data.surfaceArea,
          isDefaultWood: data.isDefaultWood,
        },
      })
    })

    revalidatePath('/woods')
    return {
      ...wood,
      id: wood.id.toString(),
      price: Number(wood.price),
      surfaceArea: Number(wood.surfaceArea),
    }
  } catch (error) {
    console.error('Error updating wood:', error)
    throw new Error('Failed to update wood')
  }
}

export async function deleteWood(id: number | string) {
  try {
    await prisma.wood.delete({
      where: { id: BigInt(id) },
    })
    revalidatePath('/woods')
  } catch (error) {
    console.error('Error deleting wood:', error)
    throw new Error('Failed to delete wood')
  }
}
