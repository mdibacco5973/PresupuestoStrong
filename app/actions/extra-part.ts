'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export type ExtraPartInput = {
  name: string
  price: number
  code?: string | null
  quantity?: number
  unitMeasure?: string | null
  totalPrice?: number
}

export async function getExtraParts() {
  try {
    const items = await prisma.extraPart.findMany({
      orderBy: { id: 'desc' },
    })
    return items.map(item => ({
      ...item,
      id: item.id.toString(),
      price: Number(item.price),
      totalPrice: Number(item.totalPrice || 0)
    }))
  } catch (error) {
    console.error('Error fetching extra parts:', error)
    throw new Error('Failed to fetch extra parts')
  }
}

export async function createExtraPart(data: ExtraPartInput) {
  try {
    const item = await prisma.extraPart.create({
      data: {
        ...data,
      },
    })
    revalidatePath('/extra-parts')
    return {
      ...item,
      id: item.id.toString(),
      price: Number(item.price),
      totalPrice: Number(item.totalPrice || 0)
    }
  } catch (error) {
    console.error('Error creating extra part:', error)
    throw new Error('Failed to create extra part')
  }
}

export async function updateExtraPart(id: number | string, data: ExtraPartInput) {
  try {
    const item = await prisma.extraPart.update({
      where: { id: BigInt(id) },
      data: {
        ...data,
      },
    })
    revalidatePath('/extra-parts')
    return {
      ...item,
      id: item.id.toString(),
      price: Number(item.price),
      totalPrice: Number(item.totalPrice || 0)
    }
  } catch (error) {
    console.error('Error updating extra part:', error)
    throw new Error('Failed to update extra part')
  }
}

export async function deleteExtraPart(id: number | string) {
  try {
    await prisma.extraPart.delete({
      where: { id: BigInt(id) },
    })
    revalidatePath('/extra-parts')
  } catch (error) {
    console.error('Error deleting extra part:', error)
    throw new Error('Failed to delete extra part')
  }
}
