'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export type CostInput = {
  name: string
  price: number
  formula: string | null
}

export async function getCosts() {
  try {
    const items = await prisma.cost.findMany({
      orderBy: { id: 'desc' },
    })
    return items.map(item => ({
      ...item,
      id: item.id.toString(),
      price: Number(item.price)
    }))
  } catch (error) {
    console.error('Error fetching costs:', error)
    throw new Error('Failed to fetch costs')
  }
}

export async function createCost(data: CostInput) {
  try {
    const item = await prisma.cost.create({
      data: {
        ...data,
      },
    })
    revalidatePath('/costs')
    return {
      ...item,
      id: item.id.toString(),
      price: Number(item.price)
    }
  } catch (error) {
    console.error('Error creating cost:', error)
    throw new Error('Failed to create cost')
  }
}

export async function updateCost(id: number | string, data: CostInput) {
  try {
    const item = await prisma.cost.update({
      where: { id: BigInt(id) },
      data: {
        ...data,
      },
    })
    revalidatePath('/costs')
    return {
      ...item,
      id: item.id.toString(),
      price: Number(item.price)
    }
  } catch (error) {
    console.error('Error updating cost:', error)
    throw new Error('Failed to update cost')
  }
}

export async function deleteCost(id: number | string) {
  try {
    await prisma.cost.delete({
      where: { id: BigInt(id) },
    })
    revalidatePath('/costs')
  } catch (error) {
    console.error('Error deleting cost:', error)
    throw new Error('Failed to delete cost')
  }
}
