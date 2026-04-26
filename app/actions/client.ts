'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export type ClientInput = {
  name: string | null
  email: string | null
  phone: string
  userCreatedId?: string | null
  userUpdatedId?: string | null
}

export async function getClients() {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { updatedAt: 'desc' },
    })
    return clients
  } catch (error) {
    console.error('Error fetching clients:', error)
    throw new Error('Failed to fetch clients')
  }
}

export async function createClient(data: ClientInput) {
  try {
    const client = await prisma.client.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        userCreatedId: data.userCreatedId,
        userUpdatedId: data.userUpdatedId,
      },
    })

    revalidatePath('/clients')
    return client
  } catch (error) {
    console.error('Error creating client:', error)
    throw new Error('Failed to create client')
  }
}

export async function updateClient(id: string, data: ClientInput) {
  try {
    const client = await prisma.client.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        userUpdatedId: data.userUpdatedId,
      },
    })

    revalidatePath('/clients')
    return client
  } catch (error) {
    console.error('Error updating client:', error)
    throw new Error('Failed to update client')
  }
}

export async function deleteClient(id: string) {
  try {
    await prisma.client.delete({
      where: { id },
    })
    revalidatePath('/clients')
  } catch (error) {
    console.error('Error deleting client:', error)
    throw new Error('Failed to delete client')
  }
}
