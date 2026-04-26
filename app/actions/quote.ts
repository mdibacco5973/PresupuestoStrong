'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export type QuoteDetailInput = {
  id?: string
  furnitureId: number
  quantity: number
  unitPrice: number
  price: number
  length: number
  width: number
  depth: number
}

export type QuoteInput = {
  clientId: string
  code: string
  date: Date
  dateDelivery: Date
  description: string
  exchangeRate: number
  costPesos: number
  costDollars: number
  pricePesos: number
  priceDollars: number
  status: number
  notes?: string | null
  details: QuoteDetailInput[]
}

// Helper to serialize BigInt and Decimal
function serializeQuote(quote: any) {
  return {
    ...quote,
    id: quote.id.toString(),
    exchangeRate: Number(quote.exchangeRate),
    costPesos: Number(quote.costPesos),
    costDollars: Number(quote.costDollars),
    pricePesos: Number(quote.pricePesos),
    priceDollars: Number(quote.priceDollars),
    details: (quote.details || []).map((detail: any) => ({
      ...detail,
      id: detail.id.toString(),
      quoteId: detail.quoteId?.toString() || null,
      unitPrice: Number(detail.unitPrice),
      price: Number(detail.price),
    }))
  }
}

export async function getQuotes() {
  const quotes = await prisma.quote.findMany({
    include: {
      client: {
        select: {
          name: true,
        },
      },
      details: {
        include: {
          furniture: {
            select: {
              name: true,
              code: true,
            }
          }
        }
      }
    },
    orderBy: {
      date: 'desc',
    },
  })
  return quotes.map(serializeQuote)
}

export async function createQuote(data: QuoteInput) {
  const quote = await prisma.quote.create({
    data: {
      clientId: data.clientId,
      code: data.code,
      date: data.date,
      dateDelivery: data.dateDelivery,
      description: data.description,
      exchangeRate: data.exchangeRate,
      costPesos: data.costPesos,
      costDollars: data.costDollars,
      pricePesos: data.pricePesos,
      priceDollars: data.priceDollars,
      status: data.status,
      notes: data.notes,
      details: {
        create: data.details.map(detail => ({
          furnitureId: detail.furnitureId,
          quantity: detail.quantity,
          unitPrice: detail.unitPrice,
          price: detail.price,
          length: detail.length,
          width: detail.width,
          depth: detail.depth,
        }))
      }
    },
    include: {
        details: true
    }
  })
  revalidatePath('/quotes')
  return serializeQuote(quote)
}

export async function updateQuote(id: string, data: QuoteInput) {
  const quoteId = BigInt(id)
  
  const updated = await prisma.$transaction(async (tx) => {
    // Delete existing details
    await tx.quoteDetail.deleteMany({ where: { quoteId: quoteId } })

    // Update quote and create new details
    return await tx.quote.update({
      where: { id: quoteId },
      data: {
        clientId: data.clientId,
        code: data.code,
        date: data.date,
        dateDelivery: data.dateDelivery,
        description: data.description,
        exchangeRate: data.exchangeRate,
        costPesos: data.costPesos,
        costDollars: data.costDollars,
        pricePesos: data.pricePesos,
        priceDollars: data.priceDollars,
        status: data.status,
        notes: data.notes,
        details: {
          create: data.details.map(detail => ({
            furnitureId: detail.furnitureId,
            quantity: detail.quantity,
            unitPrice: detail.unitPrice,
            price: detail.price,
            length: detail.length,
            width: detail.width,
            depth: detail.depth,
          }))
        }
      },
      include: {
        details: true
      }
    })
  })
  
  revalidatePath('/quotes')
  return serializeQuote(updated)
}

export async function deleteQuote(id: string) {
  await prisma.quote.delete({
    where: { id: BigInt(id) },
  })
  revalidatePath('/quotes')
}
