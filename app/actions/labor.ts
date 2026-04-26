'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export type LaborCostInput = {
  name: string
  price: number
}

export async function getLaborCosts() {
  try {
    const items = await prisma.laborCost.findMany({
      orderBy: { id: 'desc' },
    })
    return items.map(item => ({
      ...item,
      price: Number(item.price)
    }))
  } catch (error) {
    console.error('Error fetching labor costs:', error)
    throw new Error('Failed to fetch labor costs')
  }
}

export async function createLaborCost(data: LaborCostInput) {
  try {
    const item = await prisma.laborCost.create({
      data: {
        ...data,
      },
    })
    revalidatePath('/labor')
    return {
      ...item,
      price: Number(item.price)
    }
  } catch (error) {
    console.error('Error creating labor cost:', error)
    throw new Error('Failed to create labor cost')
  }
}

export async function updateLaborCost(id: number, data: LaborCostInput) {
  try {
    const item = await prisma.laborCost.update({
      where: { id },
      data: {
        ...data,
      },
    })
    revalidatePath('/labor')
    return {
      ...item,
      price: Number(item.price)
    }
  } catch (error) {
    console.error('Error updating labor cost:', error)
    throw new Error('Failed to update labor cost')
  }
}

export async function deleteLaborCost(id: number) {
  try {
    await prisma.laborCost.delete({
      where: { id },
    })
    revalidatePath('/labor')
  } catch (error) {
    console.error('Error deleting labor cost:', error)
    throw new Error('Failed to delete labor cost')
  }
}
