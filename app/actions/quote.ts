'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export type QuoteDetailInput = {
  id?: string | number
  furnitureId: number | string
  quantity: number
  unitPrice: number
  price: number
  length: number
  width: number
  depth: number
}

export type QuoteAdditionalCostInput = {
  id?: number | string
  additionalCostId: number | string
  furnitureId: number | string
}
export type QuotePartInput = {
  id?: number | string
  partId: number | string
  furnitureId: number | string
  woodId: number | string
}

export type QuoteHardwareInput = {
  id?: number | string
  hardwareId: number | string
  furnitureId: number | string
  code?: string | null
  quantity: number
  unitMeasure?: string | null
  totalPrice: number
}

export type QuoteFinishInput = {
  id?: number | string
  finishId: number | string
  furnitureId: number | string
}

export type QuoteLaborInput = {
  id?: number | string
  laborId: number | string
  furnitureId: number | string
}

export type QuoteWoodInput = {
  id?: number | string
  woodId: number | string
  quantity: number
  surfaceWood: number
  surfaceTotalWood: number
  priceWood: number
  priceTotalWood: number
  surfaceTotalPiece: number
  priceTotalPiece: number
  quantityCut?: number | null
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
  profit: number
  status: number
  notes?: string | null
  details: QuoteDetailInput[]
  additionalCosts: QuoteAdditionalCostInput[]
  parts: QuotePartInput[]
  hardware: QuoteHardwareInput[]
  finishes: QuoteFinishInput[]
  labor: QuoteLaborInput[]
  woods: QuoteWoodInput[]
}

// Helper to serialize BigInt and Decimal
function serializeQuote(quote: any) {
  if (!quote) return null
  return {
    ...quote,
    id: quote.id.toString(),
    exchangeRate: Number(quote.exchangeRate),
    costPesos: Number(quote.costPesos),
    costDollars: Number(quote.costDollars),
    pricePesos: Number(quote.pricePesos),
    priceDollars: Number(quote.priceDollars),
    profit: Number(quote.profit || 1.5),
    status: Number(quote.status),
    details: (quote.details || []).map((detail: any) => ({
      ...detail,
      id: detail.id.toString(),
      quoteId: detail.quoteId?.toString(),
      furnitureId: detail.furnitureId.toString(),
      unitPrice: Number(detail.unitPrice),
      price: Number(detail.price)
    })),
    additionalCosts: (quote.additionalCosts || []).map((ac: any) => ({
      ...ac,
      id: ac.id.toString(),
      quoteId: ac.quoteId?.toString(),
      additionalCostId: ac.additionalCostId?.toString(),
      furnitureId: ac.furnitureId.toString()
    })),
    parts: (quote.parts || []).map((p: any) => ({
      ...p,
      id: p.id.toString(),
      quoteId: p.quoteId?.toString(),
      partId: p.partId?.toString(),
      furnitureId: p.furnitureId.toString(),
      woodId: p.woodId.toString()
    })),
    hardware: (quote.hardware || []).map((hw: any) => ({
      ...hw,
      id: hw.id.toString(),
      quoteId: hw.quoteId?.toString(),
      hardwareId: hw.hardwareId?.toString(),
      furnitureId: hw.furnitureId.toString(),
      totalPrice: Number(hw.totalPrice || 0)
    })),
    finishes: (quote.finishes || []).map((f: any) => ({
      ...f,
      id: f.id.toString(),
      quoteId: f.quoteId?.toString(),
      finishId: f.finishId?.toString(),
      furnitureId: f.furnitureId.toString()
    })),
    labor: (quote.labor || []).map((l: any) => ({
      ...l,
      id: l.id.toString(),
      quoteId: l.quoteId?.toString(),
      laborId: l.laborId?.toString(),
      furnitureId: l.furnitureId.toString()
    })),
    woods: (quote.woods || []).map((w: any) => ({
      ...w,
      id: w.id.toString(),
      quoteId: w.quoteId?.toString(),
      woodId: w.woodId.toString(),
      surfaceWood: Number(w.surfaceWood),
      surfaceTotalWood: Number(w.surfaceTotalWood),
      priceWood: Number(w.priceWood),
      priceTotalWood: Number(w.priceTotalWood),
      surfaceTotalPiece: Number(w.surfaceTotalPiece),
      priceTotalPiece: Number(w.priceTotalPiece)
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
      },
      additionalCosts: true,
      parts: true,
      hardware: true,
      finishes: true,
      labor: true,
      woods: true
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
      profit: data.profit,
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
      },
      additionalCosts: {
        create: (data.additionalCosts || []).map(c => ({
          additionalCostId: c.additionalCostId,
          furnitureId: c.furnitureId,
        }))
      },
      woods: {
        create: (data.woods || []).map(w => ({
          woodId: w.woodId,
          quantity: w.quantity,
          surfaceWood: w.surfaceWood,
          surfaceTotalWood: w.surfaceTotalWood,
          priceWood: w.priceWood,
          priceTotalWood: w.priceTotalWood,
          surfaceTotalPiece: w.surfaceTotalPiece,
          priceTotalPiece: w.priceTotalPiece,
          quantityCut: w.quantityCut,
        }))
      },
      parts: {
        create: (data.parts || []).map(part => ({
          partId: part.partId,
          furnitureId: part.furnitureId,
          woodId: part.woodId,
        }))
      },
      hardware: {
        create: data.hardware.map(hw => ({
          hardwareId: hw.hardwareId,
          furnitureId: hw.furnitureId,
          code: hw.code,
          quantity: hw.quantity,
          unitMeasure: hw.unitMeasure,
          totalPrice: hw.totalPrice,
        }))
      },
      finishes: {
        create: (data.finishes || []).map(f => ({
          finishId: f.finishId,
          furnitureId: f.furnitureId,
        }))
      },
      labor: {
        create: (data.labor || []).map(l => ({
          laborId: l.laborId,
          furnitureId: l.furnitureId,
        }))
      }
    },
    include: {
        details: true,
        additionalCosts: true,
        parts: true,
        hardware: true,
        finishes: true,
        labor: true,
        woods: true
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
    await tx.quoteAdditionalCost.deleteMany({ where: { quoteId: quoteId } })
    await tx.quoteWood.deleteMany({ where: { quoteId: quoteId } })
    await tx.quotePart.deleteMany({ where: { quoteId: quoteId } })
    await tx.quoteHardware.deleteMany({ where: { quoteId: quoteId } })
    await tx.quoteFinish.deleteMany({ where: { quoteId: quoteId } })
    await tx.quoteLabor.deleteMany({ where: { quoteId: quoteId } })

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
        profit: data.profit,
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
        },
        additionalCosts: {
          create: (data.additionalCosts || []).map(c => ({
            additionalCostId: c.additionalCostId,
            furnitureId: c.furnitureId,
          }))
        },
        woods: {
          create: (data.woods || []).map(w => ({
            woodId: w.woodId,
            quantity: w.quantity,
            surfaceWood: w.surfaceWood,
            surfaceTotalWood: w.surfaceTotalWood,
            priceWood: w.priceWood,
            priceTotalWood: w.priceTotalWood,
            surfaceTotalPiece: w.surfaceTotalPiece,
            priceTotalPiece: w.priceTotalPiece,
            quantityCut: w.quantityCut,
          }))
        },
        parts: {
          create: (data.parts || []).map(part => ({
            partId: part.partId,
            furnitureId: part.furnitureId,
            woodId: part.woodId,
          }))
        },
        hardware: {
          create: (data.hardware || []).map(hw => ({
            hardwareId: hw.hardwareId,
            furnitureId: hw.furnitureId,
            code: hw.code,
            quantity: hw.quantity,
            unitMeasure: hw.unitMeasure,
            totalPrice: hw.totalPrice,
          }))
        },
        finishes: {
          create: (data.finishes || []).map(f => ({
            finishId: f.finishId,
            furnitureId: f.furnitureId,
          }))
        },
        labor: {
          create: (data.labor || []).map(l => ({
            laborId: l.laborId,
            furnitureId: l.furnitureId,
          }))
        }
      },
      include: {
        details: true,
        additionalCosts: true,
        parts: true,
        hardware: true,
        finishes: true,
        labor: true,
        woods: true
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
