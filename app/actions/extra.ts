'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export type AdditionalCostInput = {
  name: string
  price: number
}

export async function getAdditionalCosts() {
  try {
    const items = await prisma.additionalCost.findMany({
      orderBy: { id: 'desc' },
    })
    return items.map(item => ({
      ...item,
      price: Number(item.price)
    }))
  } catch (error) {
    console.error('Error fetching additional costs:', error)
    throw new Error('Failed to fetch additional costs')
  }
}

export async function createAdditionalCost(data: AdditionalCostInput) {
  try {
    const item = await prisma.additionalCost.create({
      data: {
        ...data,
      },
    })
    revalidatePath('/extras')
    return {
      ...item,
      price: Number(item.price)
    }
  } catch (error) {
    console.error('Error creating additional cost:', error)
    throw new Error('Failed to create additional cost')
  }
}

export async function updateAdditionalCost(id: number, data: AdditionalCostInput) {
  try {
    const item = await prisma.additionalCost.update({
      where: { id },
      data: {
        ...data,
      },
    })
    revalidatePath('/extras')
    return {
      ...item,
      price: Number(item.price)
    }
  } catch (error) {
    console.error('Error updating additional cost:', error)
    throw new Error('Failed to update additional cost')
  }
}

export async function deleteAdditionalCost(id: number) {
  try {
    await prisma.additionalCost.delete({
      where: { id },
    })
    revalidatePath('/extras')
  } catch (error) {
    console.error('Error deleting additional cost:', error)
    throw new Error('Failed to delete additional cost')
  }
}
