'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export type PartInput = {
  name: string
  isEdges: boolean
  isCabinetWood: boolean
  isBaseCabinetWood: boolean
  isWallCabinetWood: boolean
  isBackPanel: boolean
  isDrawer: boolean
  isLacquered: boolean
  isFront: boolean
  formulaLength?: string | null
  formulaWidth?: string | null
}

export async function getParts() {
  try {
    const parts = await prisma.part.findMany({
      orderBy: { id: 'desc' },
    })
    return parts.map(part => ({
      ...part,
      id: part.id.toString()
    }))
  } catch (error) {
    console.error('Error fetching parts:', error)
    throw new Error('Failed to fetch parts')
  }
}

export async function createPart(data: PartInput) {
  try {
    const part = await prisma.part.create({
      data: {
        ...data,
      },
    })
    revalidatePath('/parts')
    return {
      ...part,
      id: part.id.toString()
    }
  } catch (error) {
    console.error('Error creating part:', error)
    throw new Error('Failed to create part')
  }
}

export async function updatePart(id: number | string, data: PartInput) {
  try {
    const part = await prisma.part.update({
      where: { id: BigInt(id) },
      data: {
        ...data,
      },
    })
    revalidatePath('/parts')
    return {
      ...part,
      id: part.id.toString()
    }
  } catch (error) {
    console.error('Error updating part:', error)
    throw new Error('Failed to update part')
  }
}

export async function deletePart(id: number | string) {
  try {
    await prisma.part.delete({
      where: { id: BigInt(id) },
    })
    revalidatePath('/parts')
  } catch (error) {
    console.error('Error deleting part:', error)
    throw new Error('Failed to delete part')
  }
}
