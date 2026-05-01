'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export type QuoteDetailInput = {
  furnitureId: number | string
  quantity: number
  unitPrice: number
  price: number
  length: number
  width: number
  depth: number
}

export type QuoteAdditionalCostInput = {
  additionalCostId: number | string | null
  furnitureId: number | string
}

export type QuoteWoodInput = {
  woodId: number | string
  quantity: number
  surfaceWood: number
  surfaceTotalWood: number
  priceWood: number
  priceTotalWood: number
  surfaceTotalPiece: number
  priceTotalPiece: number
  quantityCut: number | null
}

export type QuotePartInput = {
  partId: number | string | null
  furnitureId: number | string
  woodId: number | string
}

export type QuoteHardwareInput = {
  hardwareId: number | string | null
  furnitureId: number | string
  code: string | null
  quantity: number
  unitMeasure: string | null
  totalPrice: number | null
}

export type QuoteFinishInput = {
  finishId: number | string | null
  furnitureId: number | string
}

export type QuoteLaborInput = {
  laborId: number | string | null
  furnitureId: number | string
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
  notes: string | null
  details: QuoteDetailInput[]
  additionalCosts: QuoteAdditionalCostInput[]
  woods: QuoteWoodInput[]
  parts: QuotePartInput[]
  hardware: QuoteHardwareInput[]
  finishes: QuoteFinishInput[]
  labor: QuoteLaborInput[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeQuote(quote: any) {
  if (!quote) return null
  return {
    ...quote,
    id: quote.id.toString(),
    clientId: quote.clientId.toString(),
    exchangeRate: Number(quote.exchangeRate),
    costPesos: Number(quote.costPesos),
    costDollars: Number(quote.costDollars),
    pricePesos: Number(quote.pricePesos),
    priceDollars: Number(quote.priceDollars),
    profit: Number(quote.profit),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    details: quote.details?.map((d: any) => ({
      ...d,
      id: d.id.toString(),
      quoteId: d.quoteId?.toString(),
      furnitureId: d.furnitureId.toString(),
      unitPrice: Number(d.unitPrice),
      price: Number(d.price),
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    additionalCosts: quote.additionalCosts?.map((ac: any) => ({
      ...ac,
      id: ac.id.toString(),
      quoteId: ac.quoteId?.toString(),
      additionalCostId: ac.additionalCostId?.toString(),
      furnitureId: ac.furnitureId.toString(),
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    woods: quote.woods?.map((w: any) => ({
      ...w,
      id: w.id.toString(),
      quoteId: w.quoteId?.toString(),
      woodId: w.woodId.toString(),
      surfaceWood: Number(w.surfaceWood),
      surfaceTotalWood: Number(w.surfaceTotalWood),
      priceWood: Number(w.priceWood),
      priceTotalWood: Number(w.priceTotalWood),
      surfaceTotalPiece: Number(w.surfaceTotalPiece),
      priceTotalPiece: Number(w.priceTotalPiece),
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parts: quote.parts?.map((p: any) => ({
      ...p,
      id: p.id.toString(),
      quoteId: p.quoteId?.toString(),
      partId: p.partId?.toString(),
      furnitureId: p.furnitureId.toString(),
      woodId: p.woodId.toString(),
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    hardware: quote.hardware?.map((h: any) => ({
      ...h,
      id: h.id.toString(),
      quoteId: h.quoteId?.toString(),
      hardwareId: h.hardwareId?.toString(),
      furnitureId: h.furnitureId.toString(),
      totalPrice: h.totalPrice ? Number(h.totalPrice) : null,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    finishes: quote.finishes?.map((f: any) => ({
      ...f,
      id: f.id.toString(),
      quoteId: f.quoteId?.toString(),
      finishId: f.finishId?.toString(),
      furnitureId: f.furnitureId.toString(),
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    labor: quote.labor?.map((l: any) => ({
      ...l,
      id: l.id.toString(),
      quoteId: l.quoteId?.toString(),
      laborId: l.laborId?.toString(),
      furnitureId: l.furnitureId.toString(),
    })),
  }
}

export async function getQuotes() {
  const quotes = await prisma.quote.findMany({
    include: {
      client: true,
      details: true,
      additionalCosts: true,
      parts: true,
      hardware: true,
      finishes: true,
      labor: true,
      woods: true,
    },
    orderBy: { date: 'desc' },
  })
  return quotes.map(serializeQuote)
}

export async function getQuoteById(id: string) {
  const quote = await prisma.quote.findUnique({
    where: { id: BigInt(id) },
    include: {
      client: true,
      details: true,
      additionalCosts: true,
      parts: true,
      hardware: true,
      finishes: true,
      labor: true,
      woods: true,
    },
  })
  return serializeQuote(quote)
}

export async function createQuote(data: QuoteInput) {
  const quote = await prisma.quote.create({
    data: {
      client: { connect: { id: data.clientId } },
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
          furniture: { connect: { id: BigInt(detail.furnitureId) } },
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
          additionalCost: c.additionalCostId ? { connect: { id: BigInt(c.additionalCostId) } } : undefined,
          furniture: { connect: { id: BigInt(c.furnitureId) } },
        }))
      },
      woods: {
        create: (data.woods || []).map(w => ({
          wood: { connect: { id: BigInt(w.woodId) } },
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
          part: part.partId ? { connect: { id: BigInt(part.partId) } } : undefined,
          furniture: { connect: { id: BigInt(part.furnitureId) } },
          wood: { connect: { id: BigInt(part.woodId) } },
        }))
      },
      hardware: {
        create: (data.hardware || []).map(hw => ({
          hardware: hw.hardwareId ? { connect: { id: BigInt(hw.hardwareId) } } : undefined,
          furniture: { connect: { id: BigInt(hw.furnitureId) } },
          code: hw.code,
          quantity: hw.quantity,
          unitMeasure: hw.unitMeasure,
          totalPrice: hw.totalPrice,
        }))
      },
      finishes: {
        create: (data.finishes || []).map(f => ({
          finish: f.finishId ? { connect: { id: BigInt(f.finishId) } } : undefined,
          furniture: { connect: { id: BigInt(f.furnitureId) } },
        }))
      },
      labor: {
        create: (data.labor || []).map(l => ({
          labor: l.laborId ? { connect: { id: BigInt(l.laborId) } } : undefined,
          furniture: { connect: { id: BigInt(l.furnitureId) } },
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
        client: { connect: { id: data.clientId } },
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
            furniture: { connect: { id: BigInt(detail.furnitureId) } },
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
            additionalCost: c.additionalCostId ? { connect: { id: BigInt(c.additionalCostId) } } : undefined,
            furniture: { connect: { id: BigInt(c.furnitureId) } },
          }))
        },
        woods: {
          create: (data.woods || []).map(w => ({
            wood: { connect: { id: BigInt(w.woodId) } },
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
            part: part.partId ? { connect: { id: BigInt(part.partId) } } : undefined,
            furniture: { connect: { id: BigInt(part.furnitureId) } },
            wood: { connect: { id: BigInt(part.woodId) } },
          }))
        },
        hardware: {
          create: (data.hardware || []).map(hw => ({
            hardware: hw.hardwareId ? { connect: { id: BigInt(hw.hardwareId) } } : undefined,
            furniture: { connect: { id: BigInt(hw.furnitureId) } },
            code: hw.code,
            quantity: hw.quantity,
            unitMeasure: hw.unitMeasure,
            totalPrice: hw.totalPrice,
          }))
        },
        finishes: {
          create: (data.finishes || []).map(f => ({
            finish: f.finishId ? { connect: { id: BigInt(f.finishId) } } : undefined,
            furniture: { connect: { id: BigInt(f.furnitureId) } },
          }))
        },
        labor: {
          create: (data.labor || []).map(l => ({
            labor: l.laborId ? { connect: { id: BigInt(l.laborId) } } : undefined,
            furniture: { connect: { id: BigInt(l.furnitureId) } },
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
  const quoteId = BigInt(id)
  await prisma.quote.delete({
    where: { id: quoteId },
  })
  revalidatePath('/quotes')
}
