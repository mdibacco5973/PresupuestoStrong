'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import fs from 'fs/promises'
import path from 'path'
import XlsxPopulate from 'xlsx-populate'
import { evaluateFormula } from '@/lib/utils/formula'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'

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
  quantity: number | null
  totalPrice: number | null
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
  grain: string | null
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
  quantity: number | null
  faces: number
  totalPrice: number | null
}

export type QuoteLaborInput = {
  laborId: number | string | null
  furnitureId: number | string
  quantity: number | null
  totalPrice: number | null
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
      quantity: Number(d.quantity),
      unitPrice: Number(d.unitPrice),
      price: Number(d.price),
      length: Number(d.length),
      width: Number(d.width),
      depth: Number(d.depth),
      furniture: d.furniture ? {
        id: d.furniture.id.toString(),
        name: d.furniture.name,
        code: d.furniture.code,
        length: Number(d.furniture.length),
        width: Number(d.furniture.width),
        depth: Number(d.furniture.depth),
        furniturePrice: Number(d.furniture.furniturePrice),
        hardwarePrice: Number(d.furniture.hardwarePrice),
        costPrice: Number(d.furniture.costPrice),
        laborPrice: Number(d.furniture.laborPrice),
        additionalPrice: Number(d.furniture.additionalPrice),
        furnitureTotal: Number(d.furniture.furnitureTotal),
      } : undefined
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    additionalCosts: quote.additionalCosts?.map((ac: any) => ({
      id: ac.id.toString(),
      quoteId: ac.quoteId?.toString(),
      additionalCostId: ac.additionalCostId?.toString(),
      furnitureId: ac.furnitureId?.toString(),
      quantity: ac.quantity ? Number(ac.quantity) : null,
      totalPrice: ac.totalPrice ? Number(ac.totalPrice) : null,
      additionalCost: ac.additionalCost ? {
        id: ac.additionalCost.id.toString(),
        name: ac.additionalCost.name,
        price: Number(ac.additionalCost.price),
      } : undefined
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
      wood: w.wood ? {
        ...w.wood,
        id: w.wood.id.toString(),
        price: Number(w.wood.price),
        thickness: Number(w.wood.thickness),
      } : undefined
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parts: quote.parts?.map((p: any) => ({
      ...p,
      id: p.id.toString(),
      quoteId: p.quoteId?.toString(),
      partId: p.partId?.toString(),
      furnitureId: p.furnitureId?.toString(),
      woodId: p.woodId.toString(),
      part: p.part ? {
        ...p.part,
        id: p.part.id.toString(),
        price: Number(p.part.price),
      } : undefined
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    hardware: quote.hardware?.map((h: any) => ({
      ...h,
      id: h.id.toString(),
      quoteId: h.quoteId?.toString(),
      hardwareId: h.hardwareId?.toString(),
      furnitureId: h.furnitureId?.toString(),
      totalPrice: h.totalPrice ? Number(h.totalPrice) : null,
      hardware: h.hardware ? {
        ...h.hardware,
        id: h.hardware.id.toString(),
        price: Number(h.hardware.price),
        totalPrice: Number(h.hardware.totalPrice || 0),
      } : undefined
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    finishes: quote.finishes?.map((f: any) => ({
      id: f.id.toString(),
      quoteId: f.quoteId?.toString(),
      finishId: f.finishId?.toString(),
      furnitureId: f.furnitureId?.toString(),
      quantity: f.quantity ? Number(f.quantity) : null,
      faces: Number(f.faces || 1),
      totalPrice: f.totalPrice ? Number(f.totalPrice) : null,
      finish: f.finish ? {
        id: f.finish.id.toString(),
        name: f.finish.name,
        price: Number(f.finish.price),
      } : undefined
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    labor: quote.labor?.map((l: any) => ({
      id: l.id.toString(),
      quoteId: l.quoteId?.toString(),
      laborId: l.laborId?.toString(),
      furnitureId: l.furnitureId?.toString(),
      quantity: l.quantity ? Number(l.quantity) : null,
      totalPrice: l.totalPrice ? Number(l.totalPrice) : null,
      laborCost: l.laborCost ? {
        id: l.laborCost.id.toString(),
        name: l.laborCost.name,
        price: Number(l.laborCost.price),
      } : undefined
    })),
  }
}

export async function getQuotes() {
  const quotes = await prisma.quote.findMany({
    include: {
      client: true,
      details: { include: { furniture: true } },
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
      details: { include: { furniture: true } },
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
            furniture: c.furnitureId ? { connect: { id: BigInt(c.furnitureId) } } : undefined,
            quantity: c.quantity,
            totalPrice: c.totalPrice,
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
          furniture: part.furnitureId ? { connect: { id: BigInt(part.furnitureId) } } : undefined,
          wood: { connect: { id: BigInt(part.woodId) } },
          grain: part.grain,
        }))
      },
      hardware: {
        create: (data.hardware || []).map(hw => ({
          hardware: hw.hardwareId ? { connect: { id: BigInt(hw.hardwareId) } } : undefined,
          furniture: hw.furnitureId ? { connect: { id: BigInt(hw.furnitureId) } } : undefined,
          code: hw.code,
          quantity: hw.quantity,
          unitMeasure: hw.unitMeasure,
          totalPrice: hw.totalPrice,
        }))
      },
      finishes: {
        create: (data.finishes || []).map(f => ({
          finish: f.finishId ? { connect: { id: BigInt(f.finishId) } } : undefined,
          furniture: f.furnitureId ? { connect: { id: BigInt(f.furnitureId) } } : undefined,
          quantity: f.quantity,
          faces: f.faces || 1,
          totalPrice: f.totalPrice,
        }))
      },
      labor: {
        create: (data.labor || []).map(l => ({
          labor: l.laborId ? { connect: { id: BigInt(l.laborId) } } : undefined,
          furniture: l.furnitureId ? { connect: { id: BigInt(l.furnitureId) } } : undefined,
          quantity: l.quantity,
          totalPrice: l.totalPrice,
        }))
      }
    },
    include: {
        details: { include: { furniture: true } },
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
            furniture: c.furnitureId ? { connect: { id: BigInt(c.furnitureId) } } : undefined,
            quantity: c.quantity,
            totalPrice: c.totalPrice,
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
            furniture: part.furnitureId ? { connect: { id: BigInt(part.furnitureId) } } : undefined,
            wood: { connect: { id: BigInt(part.woodId) } },
            grain: part.grain,
          }))
        },
        hardware: {
          create: (data.hardware || []).map(hw => ({
            hardware: hw.hardwareId ? { connect: { id: BigInt(hw.hardwareId) } } : undefined,
            furniture: hw.furnitureId ? { connect: { id: BigInt(hw.furnitureId) } } : undefined,
            code: hw.code,
            quantity: hw.quantity,
            unitMeasure: hw.unitMeasure,
            totalPrice: hw.totalPrice,
          }))
        },
        finishes: {
          create: (data.finishes || []).map(f => ({
            finish: f.finishId ? { connect: { id: BigInt(f.finishId) } } : undefined,
            furniture: f.furnitureId ? { connect: { id: BigInt(f.furnitureId) } } : undefined,
            quantity: f.quantity,
            faces: f.faces || 1,
            totalPrice: f.totalPrice,
          }))
        },
        labor: {
          create: (data.labor || []).map(l => ({
            labor: l.laborId ? { connect: { id: BigInt(l.laborId) } } : undefined,
            furniture: l.furnitureId ? { connect: { id: BigInt(l.furnitureId) } } : undefined,
            quantity: l.quantity,
            totalPrice: l.totalPrice,
          }))
        }
      },
      include: {
        details: { include: { furniture: true } },
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

export async function duplicateQuote(id: string) {
  const source = await getQuoteById(id)
  if (!source) throw new Error('Quote not found')

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _, client: __, ...rest } = source

  const newData: QuoteInput = {
    ...rest,
    code: `${source.code} (Copia)`,
    date: new Date(),
    dateDelivery: new Date(),
    details: source.details.map((d: any) => ({
      furnitureId: d.furnitureId,
      quantity: d.quantity,
      unitPrice: d.unitPrice,
      price: d.price,
      length: d.length,
      width: d.width,
      depth: d.depth
    })),
    additionalCosts: source.additionalCosts.map((ac: any) => ({
      additionalCostId: ac.additionalCostId,
      furnitureId: ac.furnitureId,
      quantity: ac.quantity,
      totalPrice: ac.totalPrice
    })),
    woods: source.woods.map((w: any) => ({
      woodId: w.woodId,
      quantity: w.quantity,
      surfaceWood: w.surfaceWood,
      surfaceTotalWood: w.surfaceTotalWood,
      priceWood: w.priceWood,
      priceTotalWood: w.priceTotalWood,
      surfaceTotalPiece: w.surfaceTotalPiece,
      priceTotalPiece: w.priceTotalPiece,
      quantityCut: w.quantityCut
    })),
    parts: source.parts.map((p: any) => ({
      partId: p.partId,
      furnitureId: p.furnitureId,
      woodId: p.woodId,
      grain: p.grain
    })),
    hardware: source.hardware.map((h: any) => ({
      hardwareId: h.hardwareId,
      furnitureId: h.furnitureId,
      code: h.code,
      quantity: h.quantity,
      unitMeasure: h.unitMeasure,
      totalPrice: h.totalPrice
    })),
    finishes: source.finishes.map((f: any) => ({
      finishId: f.finishId,
      furnitureId: f.furnitureId,
      quantity: f.quantity,
      faces: f.faces || 1,
      totalPrice: f.totalPrice
    })),
    labor: source.labor.map((l: any) => ({
      laborId: l.laborId,
      furnitureId: l.furnitureId,
      quantity: l.quantity,
      totalPrice: l.totalPrice
    }))
  }

  return createQuote(newData)
}

export async function deleteQuote(id: string) {
  const quoteId = BigInt(id)
  await prisma.quote.delete({
    where: { id: quoteId },
  })
  revalidatePath('/quotes')
}

export async function generateCutsExcel(id: string) {
  const quote = await getQuoteById(id)
  if (!quote) throw new Error('Presupuesto no encontrado')

  const woods = await prisma.wood.findMany()
  const furnitures = await prisma.furniture.findMany({
    include: { parts: { include: { part: true } } }
  })

  // 1. Group parts by wood
  const partsByWood = new Map<string, any[]>()
  
  quote.details.forEach((detail: any) => {
    const furniture = furnitures.find(f => f.id.toString() === detail.furnitureId.toString())
    if (!furniture || !furniture.parts) return

    furniture.parts.forEach((p: any) => {
      const partDef = p.part
      if (!partDef) return

      const assignment = quote.parts.find((qp: any) => 
        qp.furnitureId?.toString() === detail.furnitureId.toString() && 
        qp.partId?.toString() === partDef.id.toString()
      )
      
      const wood = woods.find(w => w.id?.toString() === assignment?.woodId?.toString()) || woods[0]
      const woodName = wood ? wood.name : 'Madera no definida'
      
      if (!partsByWood.has(woodName)) {
        partsByWood.set(woodName, [])
      }

      const thickness = wood ? Number(wood.thickness) : 18
      const context = {
        L: Number(detail.length),
        A: Number(detail.width),
        P: Number(detail.depth),
        E: thickness
      }

      const l = evaluateFormula(partDef.formulaLength, context)
      const w = evaluateFormula(partDef.formulaWidth, context)
      const quantity = p.quantity * detail.quantity

      partsByWood.get(woodName)!.push({
        name: partDef.name,
        length: l,
        width: w,
        quantity: quantity,
        grain: assignment?.grain || 'Ninguna',
        edges1: p.edges1,
        edges2: p.edges2,
        edges3: p.edges3,
        edges4: p.edges4,
        woodName: woodName
      })
    })
  })

  const woodCount = partsByWood.size
  if (woodCount === 0) throw new Error('No se encontraron maderas asignadas en este presupuesto.')

  const templateNumber = Math.min(woodCount, 5)
  const templatePath = path.join(process.cwd(), 'public', 'Templates', `Planilla${templateNumber}.xlsx`)
  
  try {
    const templateData = await fs.readFile(templatePath)
    const workbook = await XlsxPopulate.fromDataAsync(templateData)

    const woodNames = Array.from(partsByWood.keys())
    woodNames.forEach((woodName, index) => {
      const sheet = workbook.sheet(index)
      if (!sheet) return

      const parts = partsByWood.get(woodName) || []
      parts.forEach((part, partIdx) => {
        const rowIdx = partIdx + 24
        sheet.cell(rowIdx, 3).value(`${quote.code} - ${part.name}`)
        sheet.cell(rowIdx, 4).value(part.length)
        sheet.cell(rowIdx, 5).value(part.width)
        sheet.cell(rowIdx, 6).value(part.quantity)
        sheet.cell(rowIdx, 7).value(part.grain === 'Ninguna' ? '' : part.grain)
        sheet.cell(rowIdx, 8).value(part.edges1 ? 1 : 0)
        sheet.cell(rowIdx, 9).value(part.edges2 ? 1 : 0)
        sheet.cell(rowIdx, 10).value(part.edges3 ? 1 : 0)
        sheet.cell(rowIdx, 11).value(part.edges4 ? 1 : 0)
        sheet.cell(rowIdx, 18).value(part.woodName)
      })
    })

    const buffer = await workbook.outputAsync()
    return {
      success: true,
      data: buffer.toString('base64'),
      fileName: `${quote.code}.xlsx`
    }
  } catch (error) {
    console.error('Error in generateCutsExcel:', error)
    throw new Error('Error al procesar la plantilla Excel en el servidor')
  }
}

export async function generateStrongWord(id: string) {
  const quote = await getQuoteById(id)
  if (!quote) throw new Error('Presupuesto no encontrado')

  const woods = await prisma.wood.findMany()
  const templatePath = path.join(process.cwd(), 'public', 'Templates', 'PresupuestoStrong.docx')
  
  try {
    const content = await fs.readFile(templatePath)
    const zip = new PizZip(content)
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    })

    const dateStr = new Date().toLocaleDateString('es-AR')
    const clientName = quote.client?.name || 'Cliente'
    const clientAddress = quote.client?.address || 'Sin direccion'

    const formatARS = (value: number) => {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
      }).format(value)
    }

    const totalPrice = Number(quote.pricePesos || 0)

    // Generar lista de muebles y maderas
    const furnitureList = quote.details.map((detail: any) => {
      const furnitureName = detail.furniture?.name || 'Mueble'
      // Buscar maderas usadas para las piezas de este mueble en este presupuesto
      const assignedWoodIds = quote.parts
        .filter((p: any) => p.furnitureId?.toString() === detail.furnitureId?.toString())
        .map((p: any) => p.woodId?.toString())
      
      const uniqueWoodIds = Array.from(new Set(assignedWoodIds))
      const usedWoods = uniqueWoodIds
        .map(id => woods.find(w => w.id?.toString() === id)?.name)
        .filter(Boolean)
        .join(', ')
      
      return `${furnitureName}${usedWoods ? ` (${usedWoods})` : ''}`
    }).join('\n')

    // Reemplazar los placeholders
    doc.render({
      FECHA: dateStr,
      CLIENTE: clientName,
      DIRECCION: clientAddress,
      'NOMBRE PROYECTO': quote.description || 'Sin descripción',
      MUEBLES: 'Fabricación de mobiliario a medida según diseño acordado.',
      'MUEBLES Y MADERAS': furnitureList,
      VALOR: formatARS(totalPrice),
      SUBTOTAL: formatARS(totalPrice),
      TOTAL: formatARS(totalPrice)
    })

    const buf = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    })

    return {
      success: true,
      data: buf.toString('base64'),
      fileName: `${quote.code}.docx`
    }
  } catch (error: unknown) {
    console.error('Error detallado en generateStrongWord:', error)
    // Capturar errores específicos de docxtemplater
    const err = error as any
    if (err.properties && err.properties.errors instanceof Array) {
      const errorMessages = err.properties.errors.map((e: any) => e.message).join(', ')
      console.error('Errores de Docxtemplater:', errorMessages)
      throw new Error(`Error de plantilla Word: ${errorMessages}`)
    }
    throw new Error(`Error al editar el Word: ${error instanceof Error ? error.message : String(error)}`)
  }
}
