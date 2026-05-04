'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, FileText, Copy, Search, Scissors } from 'lucide-react'
import { QuoteInput, QuoteDetailInput, QuoteAdditionalCostInput, QuotePartInput, QuoteHardwareInput, QuoteFinishInput, QuoteLaborInput, QuoteWoodInput, createQuote, updateQuote, deleteQuote, duplicateQuote, getQuotes, generateCutsExcel, generateStrongWord } from '@/app/actions/quote'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { evaluateFormula } from '@/lib/utils/formula'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'

type Quote = {
  id: string
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
  client: {
    name: string | null
  }
  details: QuoteDetail[]
  additionalCosts: QuoteAdditionalCost[]
  parts: QuotePart[]
  hardware: QuoteHardware[]
  finishes: QuoteFinish[]
  labor: QuoteLabor[]
  woods: QuoteWood[]
}

type QuotePart = {
  id: string | number
  partId: string | number
  furnitureId: string | number
  woodId: string | number
  grain: string | null
}

type QuoteWood = {
  id: string | number
  woodId: string | number
  quantity: number
  surfaceWood: number
  surfaceTotalWood: number
  priceWood: number
  priceTotalWood: number
  surfaceTotalPiece: number
  priceTotalPiece: number
  quantityCut?: number | null
}

type QuoteAdditionalCost = {
  id: string | number
  additionalCostId: string | number
  furnitureId: string | number
  quantity?: number | null
  totalPrice?: number | null
}

type QuoteHardware = {
  id: string | number
  hardwareId: string | number
  furnitureId: string | number
  code?: string | null
  quantity: number
  unitMeasure?: string | null
  totalPrice: number
}

type QuoteFinish = {
  id: string | number
  finishId: string | number
  furnitureId: string | number
  quantity?: number | null
  totalPrice?: number | null
}

type QuoteLabor = {
  id: string | number
  laborId: string | number
  furnitureId: string | number
  quantity?: number | null
  totalPrice?: number | null
}

type QuoteDetail = {
  id: string | number
  furnitureId: string | number
  quantity: number
  unitPrice: number
  price: number
  length: number
  width: number
  depth: number
  woodId?: string | number | null
  furniture: {
    name: string
    code: string
  }
}

interface QuotesClientProps {
  initialQuotes: Quote[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  clients: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  furnitures: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  woods: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  costs: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extraParts: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  laborCosts: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  additionalCosts: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  partsList: any[]
}

const STATUS_OPTIONS = [
  { value: 1, label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  { value: 2, label: 'Aprobado', color: 'bg-green-100 text-green-700' },
  { value: 3, label: 'Rechazado', color: 'bg-red-100 text-red-700' },
  { value: 4, label: 'Finalizado', color: 'bg-blue-100 text-blue-700' },
]

const SortIcon = ({ columnKey, sortConfig }: { columnKey: string, sortConfig: { key: string, direction: 'asc' | 'desc' } | null }) => {
  if (sortConfig?.key !== columnKey) return <ArrowUpDown className="ml-2 h-4 w-4" />
  return sortConfig.direction === 'asc' ? (
    <ArrowUp className="ml-2 h-4 w-4 text-primary" />
  ) : (
    <ArrowDown className="ml-2 h-4 w-4 text-primary" />
  )
}

export function QuotesClient({ 
  initialQuotes, 
  clients, 
  furnitures, 
  woods = [],
  costs = [],
  extraParts = [],
  laborCosts = [],
  additionalCosts = [],
  partsList = [],
}: QuotesClientProps) {
  const [quotes, setQuotes] = useState<Quote[]>(initialQuotes)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'items' | 'parts' | 'hardware' | 'finishes' | 'labor' | 'woods' | 'costs'>('basic')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [formData, setFormData] = useState<QuoteInput>({
    clientId: clients[0]?.id || '',
    code: '',
    date: new Date(),
    dateDelivery: new Date(),
    description: '',
    exchangeRate: 1,
    costPesos: 0,
    costDollars: 0,
    pricePesos: 0,
    priceDollars: 0,
    profit: 1.5,
    status: 1,
    notes: '',
    details: [],
    additionalCosts: [],
    parts: [],
    hardware: [],
    finishes: [],
    labor: [],
    woods: []
  })

  // Auto-calculate totals from details and additionalCosts
  useEffect(() => {
    const totalDetailsPrice = formData.details.reduce((acc, d) => acc + d.price, 0)
    const totalAdditionalPrice = formData.additionalCosts.reduce((acc, c) => {
      return acc + (c.totalPrice || 0)
    }, 0)

    const hardwareTotal = formData.hardware.reduce((acc, hw) => acc + (hw.totalPrice || 0), 0)
    const finishesTotal = formData.finishes.reduce((acc, f) => acc + (f.totalPrice || 0), 0)
    const laborTotal = formData.labor.reduce((acc, l) => acc + (l.totalPrice || 0), 0)

    const totalCostPesos = totalDetailsPrice + totalAdditionalPrice + hardwareTotal + finishesTotal + laborTotal
    
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData(prev => {
      const pricePesos = totalCostPesos * prev.profit
      const costDollars = prev.exchangeRate > 0 ? totalCostPesos / prev.exchangeRate : 0
      const priceDollars = prev.exchangeRate > 0 ? pricePesos / prev.exchangeRate : 0

      if (
        prev.costPesos === totalCostPesos &&
        prev.pricePesos === pricePesos &&
        prev.costDollars === costDollars &&
        prev.priceDollars === priceDollars
      ) {
        return prev
      }

      return {
        ...prev,
        costPesos: totalCostPesos,
        pricePesos: pricePesos,
        costDollars: costDollars,
        priceDollars: priceDollars
      }
    })
  }, [formData.details, formData.additionalCosts, formData.hardware, formData.finishes, formData.labor, formData.exchangeRate, formData.profit])

  const defaultWood = woods?.find(w => w.isDefaultWood) || woods?.[0]

  const calculateDetailPrice = (detail: QuoteDetailInput, currentParts: QuotePartInput[]) => {
    const furniture = furnitures.find(f => f.id.toString() === detail.furnitureId.toString())
    if (!furniture) return detail.unitPrice

    let partsPriceTotal = 0
    
    if (furniture.parts) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      furniture.parts.forEach((p: any) => {
        const partDef = p.part
        if (!partDef) return
        
        // Buscar madera asignada a esta pieza para este mueble específico
        // Nota: En la solapa de piezas, las piezas están agrupadas o individuales
        // Si están individuales, buscamos por furnitureId y partId
        const assignment = currentParts.find(qp => 
          qp.furnitureId?.toString() === detail.furnitureId.toString() && 
          qp.partId?.toString() === partDef.id.toString()
        )
        
        const wood = woods.find(w => w.id.toString() === assignment?.woodId?.toString()) || defaultWood
        if (!wood) return

        const context = {
          L: Number(detail.length),
          A: Number(detail.width),
          P: Number(detail.depth),
          E: Number(wood.thickness)
        }
        
        const length = evaluateFormula(partDef.formulaLength, context)
        const width = evaluateFormula(partDef.formulaWidth, context)
        const quantity = p.quantity || 1
        
        const surfaceM2 = (length * width * quantity) / 1000000
        const boardSurfaceM2 = (Number(wood.length) * Number(wood.width)) / 1000000
        const pricePerM2 = boardSurfaceM2 > 0 ? Number(wood.price) / boardSurfaceM2 : 0
        
        partsPriceTotal += surfaceM2 * pricePerM2
      })
    }
    
    // Sumar el resto de los costos fijos del mueble (herrajes, extras, mano de obra, etc.)
    return partsPriceTotal + (furniture.hardwarePrice || 0) + (furniture.costPrice || 0) + (furniture.laborPrice || 0) + (furniture.additionalPrice || 0)
  }

  const woodStatsArray = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const statsByWood = new Map<number, any>()

    formData.details.forEach(detail => {
      const furniture = furnitures.find(f => f.id === detail.furnitureId)
      if (!furniture || !furniture.parts) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      furniture.parts.forEach((p: any) => {
        const partData = p.part
        if (!partData) return

        const partAssignment = formData.parts.find(qp => qp.furnitureId === detail.furnitureId && qp.partId === partData.id)
        const wood = woods.find(w => w.id === partAssignment?.woodId) || defaultWood
        if (!wood) return

        if (!statsByWood.has(wood.id)) {
          statsByWood.set(wood.id, {
            woodId: wood.id,
            woodName: wood.name || 'Sin nombre',
            boardLength: wood.length || 2600,
            boardWidth: wood.width || 1830,
            piecesCount: 0,
            piecesSurface: 0,
            totalCutDistance: 0,
            edges2Length: 0,
            edges04Length: 0,
          })
        }

        const stats = statsByWood.get(wood.id)

        const context = {
          L: detail.length,
          A: detail.width,
          P: detail.depth,
          E: wood.thickness || 0
        }

        const l = evaluateFormula(partData.formulaLength, context)
        const w = evaluateFormula(partData.formulaWidth, context)

        if (l > 0 && w > 0) {
          const quantity = p.quantity * detail.quantity
          stats.piecesCount += quantity
          stats.piecesSurface += ((l * w) / 1000) * quantity
          
          stats.totalCutDistance += (((l + w) * 2) / 1000) * quantity

          let pieceEdgeLength = 0
          if (p.edges1) pieceEdgeLength += l
          if (p.edges2) pieceEdgeLength += l
          if (p.edges3) pieceEdgeLength += w
          if (p.edges4) pieceEdgeLength += w

          if (p.edgeSize === 2) {
             stats.edges2Length += (pieceEdgeLength / 1000) * quantity
          } else if (p.edgeSize === 0.4 || p.edgeSize === 0) {
             stats.edges04Length += (pieceEdgeLength / 1000) * quantity
          }
        }
      })
    })

    return Array.from(statsByWood.values()).map(stats => {
      const wood = woods.find(w => w.id === stats.woodId) || defaultWood
      const woodPrice = wood ? Number(wood.price) : 0
      
      const boardSurface = (stats.boardLength * stats.boardWidth) / 1000
      const boardsCount = Math.ceil((stats.piecesSurface * 1.15) / boardSurface) || 0
      const totalBoardsSurface = boardsCount * boardSurface
      
      const totalWoodPrice = boardsCount * woodPrice
      const totalPiecesPrice = stats.piecesSurface * (boardSurface > 0 ? woodPrice / boardSurface : 0)

      const wasteSurface = stats.piecesSurface > 0 ? stats.piecesSurface * 0.15 : 0
      const newRemnantsSurface = Math.max(0, totalBoardsSurface - stats.piecesSurface - wasteSurface)

      return {
        woodId: stats.woodId,
        woodName: stats.woodName,
        boardSize: `${stats.boardLength} X ${stats.boardWidth}`,
        piecesCount: stats.piecesCount,
        boardsCount,
        piecesSurface: stats.piecesSurface,
        boardSurface,
        newRemnantsSurface,
        totalBoardsSurface,
        wasteSurface,
        usedRemnantsCount: 0,
        edges2Length: stats.edges2Length,
        usedRemnantsSurface: 0,
        edges04Length: stats.edges04Length,
        totalCutDistance: stats.totalCutDistance,
        grooveLength: 0,
        priceWood: woodPrice,
        priceTotalWood: totalWoodPrice,
        priceTotalPiece: totalPiecesPrice
      }
    })
  }, [formData.details, formData.parts, furnitures, woods, defaultWood, extraParts])
  
  const calculateFrontSurface = () => {
    let totalSurfaceM2 = 0
    
    formData.details.forEach(detail => {
      const furniture = furnitures.find(f => f.id === detail.furnitureId)
      if (!furniture || !furniture.parts) return

      // Iterar sobre las piezas que componen este mueble
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      furniture.parts.forEach((p: any) => {
        // Solo piezas marcadas como Frente
        if (!p.part?.isFront) return
        
        // Obtener espesor de la madera asignada a esta pieza en este presupuesto
        let thickness = 18
        const assignment = formData.parts.find(qp => 
          qp.furnitureId === detail.furnitureId && 
          qp.partId === p.part.id
        )
        
        if (assignment) {
          const wood = woods.find(w => w.id === assignment.woodId)
          if (wood) thickness = wood.thickness
        } else {
          // Si no hay asignación, buscar la madera por defecto
          if (defaultWood) thickness = defaultWood.thickness
        }
        
        const context = {
          L: detail.length,
          A: detail.width,
          P: detail.depth,
          E: thickness
        }

        // Evaluar dimensiones de la pieza según su fórmula
        const l = evaluateFormula(p.part.formulaLength, context)
        const w = evaluateFormula(p.part.formulaWidth, context)

        if (l > 0 && w > 0) {
          // Calcular superficie de ESTA pieza en m2
          const pieceSurfaceM2 = (l * w) / 1000000
          // Sumar al total: superficie * cantidad de piezas en el mueble * cantidad de muebles en el presupuesto
          totalSurfaceM2 += pieceSurfaceM2 * p.quantity * detail.quantity
        }
      })
    })
    
    return Number(totalSurfaceM2.toFixed(4)) // Más decimales para precisión
  }

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const sortedQuotes = [...quotes].sort((a, b) => {
    if (!sortConfig) return 0
    const { key, direction } = sortConfig
    
    const getValue = (obj: any, path: string) => {
      return path.split('.').reduce((o, i) => (o ? o[i] : null), obj)
    }
    
    const aValue = getValue(a, key)
    const bValue = getValue(b, key)

    if (aValue === null || aValue === undefined) return 1
    if (bValue === null || bValue === undefined) return -1
    if (aValue < bValue) return direction === 'asc' ? -1 : 1
    if (aValue > bValue) return direction === 'asc' ? 1 : -1
    return 0
  })

  const filteredQuotes = sortedQuotes.filter(quote => {
    const searchLower = searchTerm.toLowerCase()
    return (
      quote.code.toLowerCase().includes(searchLower) ||
      quote.description.toLowerCase().includes(searchLower) ||
      (quote.client?.name?.toLowerCase() || '').includes(searchLower)
    )
  })

  const totalPages = Math.ceil(filteredQuotes.length / itemsPerPage)
  const paginatedQuotes = filteredQuotes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const resetForm = () => {
    setFormData({
      clientId: clients[0]?.id || '',
      code: '',
      date: new Date(),
      dateDelivery: new Date(),
      description: '',
      exchangeRate: 1,
      costPesos: 0,
      costDollars: 0,
      pricePesos: 0,
      priceDollars: 0,
      profit: 1.5,
      status: 1,
      notes: '',
      details: [],
      additionalCosts: [],
      parts: [],
      hardware: [],
      finishes: [],
      labor: [],
      woods: []
    })
    setEditingQuote(null)
    setActiveTab('basic')
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) resetForm()
  }

  const handleEdit = (quote: Quote) => {
    setEditingQuote(quote)
    setFormData({
      clientId: quote.clientId,
      code: quote.code,
      date: new Date(quote.date),
      dateDelivery: new Date(quote.dateDelivery),
      description: quote.description,
      exchangeRate: quote.exchangeRate,
      costPesos: quote.costPesos,
      costDollars: quote.costDollars,
      pricePesos: quote.pricePesos,
      priceDollars: quote.priceDollars,
      profit: quote.profit || 1.5,
      status: quote.status,
      notes: quote.notes || '',
      details: quote.details.map(d => ({
        id: d.id,
        furnitureId: d.furnitureId,
        quantity: d.quantity,
        unitPrice: d.unitPrice,
        price: d.price,
        length: d.length,
        width: d.width,
        depth: d.depth,
      })),
      additionalCosts: (quote.additionalCosts || []).map(c => ({
        id: c.id,
        additionalCostId: c.additionalCostId ?? null,
        furnitureId: c.furnitureId,
        quantity: c.quantity ?? 1,
        totalPrice: c.totalPrice ?? 0
      })),
      parts: (quote.parts || []).map(p => ({
        id: p.id,
        partId: p.partId ?? null,
        furnitureId: p.furnitureId,
        woodId: p.woodId,
        grain: p.grain ?? 'Ninguna'
      })),
      hardware: (quote.hardware || []).map(hw => ({
        id: hw.id,
        hardwareId: hw.hardwareId,
        furnitureId: hw.furnitureId,
        code: hw.code ?? null,
        quantity: hw.quantity,
        unitMeasure: hw.unitMeasure ?? null,
        totalPrice: hw.totalPrice
      })),
      finishes: (quote.finishes || []).map(f => ({
        id: f.id,
        finishId: f.finishId ?? null,
        furnitureId: f.furnitureId,
        quantity: f.quantity ?? 1,
        totalPrice: f.totalPrice ?? 0
      })),
      labor: (quote.labor || []).map(l => ({
        id: l.id,
        laborId: l.laborId ?? null,
        furnitureId: l.furnitureId,
        quantity: l.quantity ?? 1,
        totalPrice: l.totalPrice ?? 0
      })),
      woods: (quote.woods || []).map(w => ({
        id: w.id,
        woodId: w.woodId,
        quantity: w.quantity,
        surfaceWood: w.surfaceWood,
        surfaceTotalWood: w.surfaceTotalWood,
        priceWood: w.priceWood,
        priceTotalWood: w.priceTotalWood,
        surfaceTotalPiece: w.surfaceTotalPiece,
        priceTotalPiece: w.priceTotalPiece,
        quantityCut: w.quantityCut ?? null
      }))
    })
    setIsOpen(true)
  }

  const handleDuplicate = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas duplicar este presupuesto?')) return
    setIsLoading(true)
    try {
      await duplicateQuote(id)
      const updatedQuotes = await getQuotes()
      setQuotes(updatedQuotes)
    } catch (error) {
      console.error('Error duplicando presupuesto:', error)
      alert('Hubo un error al duplicar el presupuesto.')
    } finally {
      setIsLoading(false)
    }
  }

  const generatePDF = (quote: Quote) => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    // --- Colores y Fuentes ---
    const sageGreen = [102, 122, 107]
    const black = [0, 0, 0]
    const gray = [100, 100, 100]
    const today = new Date().toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).toUpperCase()

    // --- Helpers de Diseño ---
    const drawSidebar = () => {
      doc.setDrawColor(0, 0, 0)
      doc.setLineWidth(0.3)
      doc.line(60, 20, 60, pageHeight - 20)
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(55)
      doc.setFont('helvetica', 'bold')
      doc.text('strongwood®', 45, pageHeight - 30, { angle: 90 })
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text('DISEÑAMOS    Y    EJECUTAMOS', 30, 45, { angle: 90 })
      doc.text('PROYECTOS    INTEGRALES', 34, 45, { angle: 90 })
      doc.text('DE MUEBLES A MEDIDA', 38, 45, { angle: 90 })
    }

    const drawHeaderLogo = (x = 78, y = 25) => {
      doc.setFillColor(0, 0, 0)
      doc.rect(x, y, 12, 12, 'F')
      doc.rect(x + 14, y, 12, 12, 'F')
      doc.rect(x, y + 14, 12, 12, 'F')
    }

    const drawCommonHeader = () => {
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      doc.text('DISEÑAMOS    Y    EJECUTAMOS', 65, 30)
      doc.text('PROYECTOS    INTEGRALES', 65, 34)
      doc.text('DE MUEBLES A MEDIDA', 65, 38)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('strongwood®', pageWidth - 20, 35, { align: 'right' })
      doc.setFillColor(0, 0, 0)
      doc.rect(20, 25, 9, 9, 'F')
      doc.rect(30, 25, 9, 9, 'F')
      doc.rect(20, 35, 9, 9, 'F')
    }

    // --- PÁGINA 1: PORTADA ---
    const customSage = [98, 117, 102]
    doc.setFillColor(customSage[0], customSage[1], customSage[2])
    doc.rect(0, 0, pageWidth, pageHeight, 'F')
    
    // Logo (3 cuadrados) - Top Left (Más grandes y pegados al borde)
    doc.setFillColor(0, 0, 0)
    const sqSize = 25
    const sqGap = 3
    doc.rect(15, 15, sqSize, sqSize, 'F')
    doc.rect(15 + sqSize + sqGap, 15, sqSize, sqSize, 'F')
    doc.rect(15, 15 + sqSize + sqGap, sqSize, sqSize, 'F')
    
    // Motto - Top Right (Con espaciado)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    doc.text('DISEÑAMOS  Y  EJECUTAMOS', pageWidth - 15, 20, { align: 'right' })
    doc.text('PROYECTOS  INTEGRALES', pageWidth - 15, 25, { align: 'right' })
    doc.text('DE MUEBLES A MEDIDA', pageWidth - 15, 30, { align: 'right' })
    
    // Título Central - Middle Right (Más grande y audaz)
    doc.setFontSize(55)
    doc.setFont('helvetica', 'bold')
    doc.text('/PRESUPUESTO', pageWidth - 15, 140, { align: 'right' })
    doc.text('2026', pageWidth - 15, 162, { align: 'right' })
    
    // Marca - Bottom (Muy grande)
    doc.setFontSize(75)
    doc.setFont('helvetica', 'bold')
    doc.text('strongwood®', 15, pageHeight - 25)

    // --- PÁGINA 2: QUIENES SOMOS ---
    doc.addPage()
    drawCommonHeader()
    doc.setFontSize(50)
    doc.setFont('helvetica', 'bold')
    doc.text('( QUIENES SOMOS )', 20, 120)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'normal')
    const qsText = 'Strongwood es una empresa familiar especializada en el desarrollo, fabricación e instalación de mobiliario a medida para proyectos de vivienda ó industria.\n\nTrabajamos integrando diseño funcional, precisión técnica y procesos constructivos controlados, acompañando cada proyecto desde el relevamiento inicial hasta la instalación final.'
    doc.text(doc.splitTextToSize(qsText, pageWidth - 40), 20, 200)

    // --- PÁGINA 3: COMO TRABAJAMOS ---
    doc.addPage()
    doc.setFontSize(40)
    doc.setFont('helvetica', 'bold')
    doc.text('SW.', 20, 50)
    doc.setFontSize(20)
    doc.text('( COMO TRABAJAMOS )', pageWidth - 20, 50, { align: 'right' })
    doc.setLineWidth(0.5)
    doc.line(20, 60, pageWidth - 20, 60)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'normal')
    const ctText = 'En Strongwood desarrollamos cada proyecto mediante un proceso organizado que incluye relevamiento, desarrollo técnico, fabricación en taller y instalación con control de calidad en cada etapa, garantizando precisión, cumplimiento y terminaciones correctas.'
    doc.text(doc.splitTextToSize(ctText, pageWidth - 40), 20, 80)
    // Timeline simplificado
    const steps = ['01 Relevamiento', '02 Desarrollo', '03 Fabricación', '04 Control', '05 Traslado', '06 Instalación']
    steps.forEach((s, i) => doc.text(s, 20, 150 + (i * 15)))

    // --- PÁGINA 4: PRESUPUESTO ---
    doc.addPage()
    drawSidebar()
    drawHeaderLogo()
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(today, pageWidth - 20, 30, { align: 'right' })
    doc.setFont('helvetica', 'bold')
    doc.text('CLIENTE:', pageWidth - 20, 50, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.text(quote.client?.name || 'CLIENTE', pageWidth - 20, 56, { align: 'right' })
    doc.text(`PROYECTO: ${quote.description.toUpperCase()}`, 78, 85)
    const budgetData = quote.details.map(d => [
      `Fabricación de ${d.furniture.name} \n${d.furniture.code} - Medidas: ${d.length}x${d.width}x${d.depth}mm`,
      formatCurrency(d.price)
    ])
    // Cálculo de Logística: Suma de todo lo que NO es mueble
    const totalLogistics = (quote.hardware.reduce((sum, h) => sum + (h.totalPrice || 0), 0)) +
                           (quote.finishes.reduce((sum, f) => sum + (f.totalPrice || 0), 0)) +
                           (quote.labor.reduce((sum, l) => sum + (l.totalPrice || 0), 0))
    budgetData.push(['Logística, traslado e instalación', formatCurrency(totalLogistics)])

    autoTable(doc, {
      startY: 125,
      margin: { left: 78, right: 20 },
      head: [['DESCRIPCIÓN', 'VALOR']],
      body: budgetData,
      theme: 'plain',
      headStyles: { fontStyle: 'bold', textColor: [0, 0, 0], fillColor: [255, 255, 255] },
      bodyStyles: { fontSize: 9, cellPadding: 6 },
      columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
      didDrawPage: () => { doc.line(78, 120, pageWidth - 20, 120) }
    })
    const finalY4 = (doc as any).lastAutoTable.finalY + 15
    doc.setFont('helvetica', 'bold')
    doc.text('TOTAL', pageWidth - 80, finalY4 + 20)
    doc.text(formatCurrency(quote.pricePesos), pageWidth - 20, finalY4 + 20, { align: 'right' })

    // --- PÁGINA 5: ANEXO TÉCNICO ---
    doc.addPage()
    drawCommonHeader()
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('ANEXO TÉCNICO: MATERIALES', 20, 80)
    doc.setLineWidth(0.5)
    doc.line(20, 85, pageWidth - 20, 85)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    // Listar maderas únicas
    const uniqueWoodIds = Array.from(new Set(quote.parts.map(p => p.woodId)))
    const woodNames = uniqueWoodIds.map(id => woods.find(w => w.id === id)?.name || 'Madera seleccionada')
    doc.text('Maderas a utilizar en la fabricación:', 20, 105)
    woodNames.forEach((name, i) => doc.text(`• ${name}`, 25, 115 + (i * 10)))

    // --- PÁGINA 6: SERVICIOS COMPLEMENTARIOS ---
    doc.addPage()
    drawCommonHeader()
    doc.setFontSize(20)
    doc.text('SERVICIOS COMPLEMENTARIOS', 20, 80)
    doc.line(20, 85, pageWidth - 20, 85)
    const extraCostsData = quote.additionalCosts.map(c => {
      const data = additionalCosts.find(ac => ac.id === c.additionalCostId)
      return [data?.name || 'Servicio Extra', formatCurrency(c.totalPrice || 0)]
    })
    autoTable(doc, {
      startY: 100,
      head: [['DESCRIPCIÓN', 'VALOR']],
      body: extraCostsData,
      theme: 'plain',
      headStyles: { fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'right' } }
    })

    // --- PÁGINA 7: MATERIALES (LOGOS) ---
    doc.addPage()
    doc.setFontSize(20)
    doc.text('( MATERIALES )', pageWidth - 20, 50, { align: 'right' })
    doc.setFontSize(12)
    doc.text(doc.splitTextToSize('En Strongwood trabajamos con materiales y herrajes provistos por marcas reconocidas del mercado...', pageWidth - 40), 20, 80)
    doc.setFont('helvetica', 'bold')
    const brands = ['HAFELE', 'BLUM', 'EUROHARD', 'E. EGGER', 'FAPLAC']
    brands.forEach((b, i) => doc.text(b, 50, 150 + (i * 15)))

    // --- PÁGINA 8: CONDICIONES ---
    doc.addPage()
    doc.setFontSize(40)
    doc.text('( CONDICIONES )', 20, 80)
    doc.setFontSize(11)
    const condText = '/ Fecha de entrega: A coordinar según cronograma de obra. Entrega entre 35 a 55 días hábiles.\n\n/ Condición de pago: 70% anticipo para inicio de fabricación y 30% contra entrega.\n\nEl precio podrá modificarse en caso de no mediar anticipo o si se detectan diferencias en las mediciones finales.'
    doc.text(doc.splitTextToSize(condText, pageWidth - 40), 20, 120)
    doc.text('strongwoodventas@gmail.com | (011) 7119-6506', pageWidth / 2, pageHeight - 30, { align: 'center' })

    doc.save(`Presupuesto_${quote.code}_Full.pdf`)
  }

  const downloadCutsExcel = async (quote: Quote) => {
    try {
      const result = await generateCutsExcel(quote.id)
      
      if (result.success) {
        // Convert base64 to Blob
        const byteCharacters = atob(result.data)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        
        // Trigger download
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = result.fileName
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error al generar Excel de cortes:', error)
      alert(`Error al generar el archivo de cortes: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este presupuesto?')) return
    setIsLoading(true)
    try {
      await deleteQuote(id)
      setQuotes((prev) => prev.filter((q) => q.id !== id))
    } catch (error) {
      console.error(error)
      alert('Error al eliminar el presupuesto')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const quoteWoods: QuoteWoodInput[] = woodStatsArray.map(stats => ({
      woodId: stats.woodId,
      quantity: stats.boardsCount,
      surfaceWood: stats.boardSurface,
      surfaceTotalWood: stats.totalBoardsSurface,
      priceWood: stats.priceWood,
      priceTotalWood: stats.priceTotalWood,
      surfaceTotalPiece: stats.piecesSurface,
      priceTotalPiece: stats.priceTotalPiece,
      quantityCut: stats.piecesCount
    }))

    const submissionData = { ...formData, woods: quoteWoods }

    // Validar que se hayan seleccionado ítems en todas las filas
    const hasEmptyDetails = formData.details.some(d => !d.furnitureId)
    const hasEmptyHardware = formData.hardware.some(h => !h.hardwareId)
    const hasEmptyFinishes = formData.finishes.some(f => !f.finishId)
    const hasEmptyLabor = formData.labor.some(l => !l.laborId)
    const hasEmptyAdditional = formData.additionalCosts.some(a => !a.additionalCostId)
    const hasEmptyPartsWood = formData.parts.some(p => !p.woodId)

    if (hasEmptyDetails || hasEmptyHardware || hasEmptyFinishes || hasEmptyLabor || hasEmptyAdditional || hasEmptyPartsWood) {
      alert('Por favor, seleccione un ítem en todas las filas de las grillas o elimine las filas vacías.')
      setIsLoading(false)
      return
    }

    try {
      if (editingQuote) {
        const updated = await updateQuote(editingQuote.id, submissionData)
        setQuotes((prev) =>
          prev.map((q) => (q.id === editingQuote.id ? { ...updated, client: { name: clients.find(c => c.id.toString() === formData.clientId.toString())?.name || null } } : q))
        )
      } else {
        const created = await createQuote(submissionData)
        setQuotes((prev) => [{ ...created, client: { name: clients.find(c => c.id.toString() === formData.clientId.toString())?.name || null } }, ...prev])
      }
      setIsOpen(false)
      resetForm()
    } catch (error) {
      console.error(error)
      alert('Error al guardar el presupuesto')
    } finally {
      setIsLoading(false)
    }
  }

  const mergeDuplicates = (details: QuoteDetailInput[]) => {
    const mergedMap = new Map<string, QuoteDetailInput>()
    
    details.forEach(d => {
      if (!d.furnitureId) {
        mergedMap.set(`empty-${Math.random()}`, { ...d })
        return
      }
      // Clave única: ID + Largo + Ancho + Profundidad
      const key = `${d.furnitureId}-${d.length}-${d.width}-${d.depth}`
      if (mergedMap.has(key)) {
        const existing = mergedMap.get(key)!
        existing.quantity += d.quantity
        existing.price = existing.quantity * existing.unitPrice
      } else {
        mergedMap.set(key, { ...d })
      }
    })
    
    return Array.from(mergedMap.values())
  }

  const addDetail = () => {
    const newDetail: QuoteDetailInput = {
      furnitureId: '',
      quantity: 1,
      unitPrice: 0,
      price: 0,
      length: 0,
      width: 0,
      depth: 0,
    }

    setFormData(prev => ({
      ...prev,
      details: [...prev.details, newDetail]
    }))
  }

  const removeDetail = (index: number) => {
    setFormData({
      ...formData,
      details: formData.details.filter((_, i) => i !== index)
    })
  }

  const recalculatePrices = (details: QuoteDetailInput[], parts: QuotePartInput[]) => {
    return details.map(detail => {
      const newUnitPrice = calculateDetailPrice(detail, parts)
      return {
        ...detail,
        unitPrice: newUnitPrice,
        price: newUnitPrice * detail.quantity
      }
    })
  }

  const updateDetail = (index: number, updates: Partial<QuoteDetailInput>) => {
    const newDetails = [...formData.details]
    const detail = { ...newDetails[index], ...updates }
    
    if ('unitPrice' in updates || 'quantity' in updates) {
      detail.price = detail.unitPrice * detail.quantity
    }
    
    if ('furnitureId' in updates || 'length' in updates || 'width' in updates || 'depth' in updates) {
      const furniture = furnitures.find(f => f.id === (updates.furnitureId || detail.furnitureId))
      if (furniture) {
        if ('furnitureId' in updates) {
          detail.length = furniture.length
          detail.width = furniture.width
          detail.depth = furniture.depth
        }
        // Recalcular precio basado en dimensiones y maderas actuales
        const newUnitPrice = calculateDetailPrice(detail, formData.parts)
        detail.unitPrice = newUnitPrice
        detail.price = newUnitPrice * detail.quantity
      }
    }

    newDetails[index] = detail
    setFormData({ ...formData, details: mergeDuplicates(newDetails) })
  }

/*
  const addPart = () => {
    setFormData({
      ...formData,
      parts: [
        ...formData.parts,
        {
          partId: partsList[0]?.id || 0,
          furnitureId: furnitures[0]?.id || 0,
          woodId: woods[0]?.id || 0,
        }
      ]
    })
  }
*/

/*
  const removePart = (index: number) => {
    setFormData({
      ...formData,
      parts: formData.parts.filter((_, i) => i !== index)
    })
  }
*/

  const updatePart = (index: number, updates: Partial<QuotePartInput>) => {
    const newParts = [...formData.parts]
    newParts[index] = { ...newParts[index], ...updates }
    
    // Al cambiar la madera de una pieza, recalculamos los precios de los muebles
    const updatedDetails = recalculatePrices(formData.details, newParts)
    setFormData({ ...formData, parts: newParts, details: updatedDetails })
  }

  const syncParts = () => {
    const newParts: QuotePartInput[] = []
    
    formData.details.forEach(detail => {
      const furniture = furnitures.find(f => f.id === detail.furnitureId)
      if (!furniture || !furniture.parts) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      furniture.parts.forEach((p: any) => {
        const partData = p.part
        if (!partData) return

        let woodId = woods[0]?.id
        if (partData.isBackPanel) {
          woodId = woods.find(w => w.isDefaultWood && w.isBack)?.id || woods.find(w => w.isBack)?.id || woodId
        } else if (partData.isFront) {
          woodId = woods.find(w => w.isDefaultWood && w.isFront)?.id || woods.find(w => w.isFront)?.id || woodId
        } else {
          woodId = woods.find(w => w.isDefaultWood && w.isCabinet)?.id || woods.find(w => w.isCabinet)?.id || woodId
        }

        newParts.push({
          partId: partData.id,
          furnitureId: furniture.id,
          woodId: woodId || 0,
          grain: p.grain || 'Ninguna'
        })
      })
    })

    // Al sincronizar piezas, recalculamos los precios de los muebles
    const updatedDetails = recalculatePrices(formData.details, newParts)
    setFormData(prev => ({ ...prev, parts: newParts, details: updatedDetails }))
  }

  const syncHardware = () => {
    const newHardwareMap = new Map<string, QuoteHardwareInput>()
    
    formData.details.forEach(detail => {
      const furniture = furnitures.find(f => f.id === detail.furnitureId)
      if (!furniture || !furniture.extraParts) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      furniture.extraParts.forEach((ep: any) => {
        if (!ep.extraPart) return

        const hwId = ep.extraPart.id.toString()
        const qty = (ep.quantity || 1) * detail.quantity
        const unitPrice = Number(ep.extraPart.price || 0)
        const totalPrice = unitPrice * qty

        if (newHardwareMap.has(hwId)) {
          const existing = newHardwareMap.get(hwId)!
          existing.quantity += qty
          existing.totalPrice = (existing.totalPrice || 0) + totalPrice
          
          // If the furniture is different, we set furnitureId to null to indicate multiple
          if (existing.furnitureId && existing.furnitureId.toString() !== furniture.id.toString()) {
            existing.furnitureId = null as any
          }
        } else {
          newHardwareMap.set(hwId, {
            hardwareId: ep.extraPart.id,
            furnitureId: furniture.id,
            code: ep.extraPart.code || '',
            quantity: qty,
            unitMeasure: 'un',
            totalPrice: totalPrice
          })
        }
      })
    })

    setFormData(prev => ({ ...prev, hardware: Array.from(newHardwareMap.values()) }))
  }

  const syncFinishes = () => {
    const finishMap = new Map<string, QuoteFinishInput>()
    const totalFrontSurface = calculateFrontSurface()

    formData.details.forEach(detail => {
      const furniture = furnitures.find(f => f.id === detail.furnitureId)
      if (!furniture || !furniture.costs) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      furniture.costs.forEach((c: any) => {
        if (!c.cost) return

        const finishId = c.cost.id.toString()
        const isLaqueado = c.cost.name.toUpperCase().includes('LAQUEA')
        
        // Si es laqueado y no hay superficie de frentes, no lo agregamos
        if (isLaqueado && totalFrontSurface <= 0) return

        const unitPrice = Number(c.cost.price || 0)
        
        if (finishMap.has(finishId)) {
          const existing = finishMap.get(finishId)!
          if (isLaqueado) {
            // El laqueado siempre es la superficie total global, no sumamos
            existing.quantity = totalFrontSurface
          } else {
            // Otros acabados sumamos sus cantidades (por defecto 1 por mueble * cantidad de muebles)
            existing.quantity = Number(existing.quantity || 0) + (Number(c.quantity || 1) * detail.quantity)
          }
          existing.totalPrice = Number(existing.quantity) * unitPrice
        } else {
          const qty = isLaqueado ? totalFrontSurface : (Number(c.quantity || 1) * detail.quantity)
          finishMap.set(finishId, {
            finishId: c.cost.id,
            furnitureId: furniture.id,
            quantity: qty,
            totalPrice: qty * unitPrice
          })
        }
      })
    })

    setFormData(prev => ({ ...prev, finishes: Array.from(finishMap.values()) }))
  }

  const syncLabor = () => {
    const laborMap = new Map<string, QuoteLaborInput>()
    
    formData.details.forEach(detail => {
      const furniture = furnitures.find(f => f.id === detail.furnitureId)
      if (!furniture || !furniture.laborCosts) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      furniture.laborCosts.forEach((l: any) => {
        if (!l.laborCost) return

        const laborId = l.laborCost.id.toString()
        const laborQty = Number(l.quantity || 1)
        const totalQty = laborQty * detail.quantity
        const unitPrice = Number(l.laborCost.price || 0)

        if (laborMap.has(laborId)) {
          const existing = laborMap.get(laborId)!
          existing.quantity = Number(existing.quantity || 0) + totalQty
          existing.totalPrice = Number(existing.quantity) * unitPrice
        } else {
          laborMap.set(laborId, {
            laborId: l.laborCost.id,
            furnitureId: furniture.id,
            quantity: totalQty,
            totalPrice: totalQty * unitPrice
          })
        }
      })
    })

    setFormData(prev => ({ ...prev, labor: Array.from(laborMap.values()) }))
  }

  const syncAdditionalCosts = () => {
    const acMap = new Map<string, QuoteAdditionalCostInput>()
    
    formData.details.forEach(detail => {
      const furniture = furnitures.find(f => f.id === detail.furnitureId)
      if (!furniture || !furniture.additionalCosts) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      furniture.additionalCosts.forEach((ac: any) => {
        if (!ac.additionalCost) return

        const acId = ac.additionalCost.id.toString()
        const unitPrice = Number(ac.additionalCost.price || 0)
        const qty = Number(ac.quantity || 1) * detail.quantity

        if (acMap.has(acId)) {
          const existing = acMap.get(acId)!
          existing.quantity = Number(existing.quantity || 0) + qty
          existing.totalPrice = Number(existing.quantity) * unitPrice
          if (existing.furnitureId && furniture.id && existing.furnitureId.toString() !== furniture.id.toString()) {
            existing.furnitureId = null as unknown as string
          }
        } else {
          acMap.set(acId, {
            additionalCostId: ac.additionalCost.id,
            furnitureId: furniture.id,
            quantity: qty,
            totalPrice: qty * unitPrice
          })
        }
      })
    })

    setFormData(prev => ({ ...prev, additionalCosts: Array.from(acMap.values()) }))
  }

  const mergeHardware = (hardware: QuoteHardwareInput[]) => {
    const map = new Map<string, QuoteHardwareInput>()
    hardware.forEach(h => {
      if (!h.hardwareId) {
        map.set(`empty-${Math.random()}`, { ...h })
        return
      }
      const key = h.hardwareId?.toString() || '0'
      if (map.has(key)) {
        const existing = map.get(key)!
        existing.quantity = Number(existing.quantity || 0) + Number(h.quantity || 0)
        existing.totalPrice = Number(existing.quantity) * (Number(existing.totalPrice) / (Number(existing.quantity) - Number(h.quantity)))
        // Si el mueble es distinto, ponemos null
        if (existing.furnitureId && h.furnitureId && existing.furnitureId.toString() !== h.furnitureId.toString()) {
          existing.furnitureId = null as unknown as string
        }
      } else {
        map.set(key, { ...h })
      }
    })
    return Array.from(map.values())
  }

  const mergeFinishes = (finishes: QuoteFinishInput[]) => {
    const map = new Map<string, QuoteFinishInput>()
    const totalFrontSurface = calculateFrontSurface()
    
    finishes.forEach(f => {
      if (!f.finishId) {
        map.set(`empty-${Math.random()}`, { ...f })
        return
      }
      const key = f.finishId?.toString() || '0'
      const finishData = costs.find(c => c.id.toString() === key)
      const isLaqueado = finishData?.name.toUpperCase().includes('LAQUEA')
      
      if (map.has(key)) {
        const existing = map.get(key)!
        if (isLaqueado) {
          existing.quantity = totalFrontSurface
        } else {
          existing.quantity = Number(existing.quantity || 0) + Number(f.quantity || 0)
        }
        existing.totalPrice = Number(existing.quantity) * Number(finishData?.price || 0)
        if (existing.furnitureId && f.furnitureId && existing.furnitureId.toString() !== f.furnitureId.toString()) {
          existing.furnitureId = null as unknown as string
        }
      } else {
        map.set(key, { ...f })
      }
    })
    return Array.from(map.values())
  }

  const mergeLabor = (labor: QuoteLaborInput[]) => {
    const map = new Map<string, QuoteLaborInput>()
    labor.forEach(l => {
      if (!l.laborId) {
        map.set(`empty-${Math.random()}`, { ...l })
        return
      }
      const key = l.laborId?.toString() || '0'
      const laborData = laborCosts.find(lc => lc.id.toString() === key)
      
      if (map.has(key)) {
        const existing = map.get(key)!
        existing.quantity = Number(existing.quantity || 0) + Number(l.quantity || 0)
        existing.totalPrice = Number(existing.quantity) * Number(laborData?.price || 0)
        if (existing.furnitureId && l.furnitureId && existing.furnitureId.toString() !== l.furnitureId.toString()) {
          existing.furnitureId = null as unknown as string
        }
      } else {
        map.set(key, { ...l })
      }
    })
    return Array.from(map.values())
  }

  const mergeAdditionalCosts = (costs: QuoteAdditionalCostInput[]) => {
    const map = new Map<string, QuoteAdditionalCostInput>()
    costs.forEach(c => {
      if (!c.additionalCostId) {
        map.set(`empty-${Math.random()}`, { ...c })
        return
      }
      const key = c.additionalCostId?.toString() || '0'
      const acData = additionalCosts.find(ac => ac.id.toString() === key)
      
      if (map.has(key)) {
        const existing = map.get(key)!
        existing.quantity = Number(existing.quantity || 0) + Number(c.quantity || 0)
        existing.totalPrice = Number(existing.quantity) * Number(acData?.price || 0)
        if (existing.furnitureId && c.furnitureId && existing.furnitureId.toString() !== c.furnitureId.toString()) {
          existing.furnitureId = null as unknown as string
        }
      } else {
        map.set(key, { ...c })
      }
    })
    return Array.from(map.values())
  }

  const addHardware = () => {
    const newHW: QuoteHardwareInput = { 
      hardwareId: '', 
      furnitureId: '',
      code: '',
      quantity: 1,
      unitMeasure: 'un',
      totalPrice: 0
    }
    setFormData(prev => ({
      ...prev,
      hardware: [...prev.hardware, newHW]
    }))
  }

  const addFinish = () => {
    const newFinish: QuoteFinishInput = { 
      finishId: '', 
      furnitureId: '',
      quantity: 1,
      totalPrice: 0
    }
    
    setFormData(prev => ({
      ...prev,
      finishes: [...prev.finishes, newFinish]
    }))
  }

  const addLabor = () => {
    const newLaborItem: QuoteLaborInput = { 
      laborId: '', 
      furnitureId: '',
      quantity: 1,
      totalPrice: 0
    }
    setFormData(prev => ({
      ...prev,
      labor: [...prev.labor, newLaborItem]
    }))
  }

  const addAdditionalCost = () => {
    const newAC: QuoteAdditionalCostInput = { 
      additionalCostId: '', 
      furnitureId: '',
      quantity: 1,
      totalPrice: 0
    }
    setFormData(prev => ({
      ...prev,
      additionalCosts: [...prev.additionalCosts, newAC]
    }))
  }

  const removeHardware = (index: number) => {
    setFormData(prev => ({
      ...prev,
      hardware: prev.hardware.filter((_, i) => i !== index)
    }))
  }

  const removeFinish = (index: number) => {
    setFormData(prev => ({
      ...prev,
      finishes: prev.finishes.filter((_, i) => i !== index)
    }))
  }

  const removeLabor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      labor: prev.labor.filter((_, i) => i !== index)
    }))
  }

  const removeAdditionalCost = (index: number) => {
    setFormData(prev => ({
      ...prev,
      additionalCosts: prev.additionalCosts.filter((_, i) => i !== index)
    }))
  }

  const updateFinish = (index: number, updates: Partial<QuoteFinishInput>) => {
    setFormData(prev => {
      const newFinishes = [...prev.finishes]
      newFinishes[index] = { ...newFinishes[index], ...updates }
      return { ...prev, finishes: mergeFinishes(newFinishes) }
    })
  }

  const updateLabor = (index: number, updates: Partial<QuoteLaborInput>) => {
    setFormData(prev => {
      const newLabor = [...prev.labor]
      newLabor[index] = { ...newLabor[index], ...updates }
      return { ...prev, labor: mergeLabor(newLabor) }
    })
  }

  const updateAdditionalCost = (index: number, updates: Partial<QuoteAdditionalCostInput>) => {
    setFormData(prev => {
      const newAdditionalCosts = [...prev.additionalCosts]
      newAdditionalCosts[index] = { ...newAdditionalCosts[index], ...updates }
      return { ...prev, additionalCosts: mergeAdditionalCosts(newAdditionalCosts) }
    })
  }

  const updateHardware = (index: number, updates: Partial<QuoteHardwareInput>) => {
    setFormData(prev => {
      const newHardware = [...prev.hardware]
      newHardware[index] = { ...newHardware[index], ...updates }
      return { ...prev, hardware: mergeHardware(newHardware) }
    })
  }

  const updateHardwareId = (index: number, hardwareId: string | number) => {
    const hwData = extraParts.find(p => p.id === hardwareId)
    updateHardware(index, { 
      hardwareId, 
      code: hwData?.code || '',
      totalPrice: Number(hwData?.price || 0) * (formData.hardware[index]?.quantity || 1)
    })
  }

  const updateFinishId = (index: number, finishId: string | number) => {
    const finishData = costs.find(c => c.id === finishId)
    const isLaqueado = finishData?.name.toUpperCase().includes('LAQUEA')
    const frontSurface = calculateFrontSurface()
    
    if (isLaqueado && frontSurface <= 0) {
      alert('No se puede agregar un acabado de laqueado porque no hay piezas marcadas como "Frente" en los muebles.')
      return
    }

    const unitPrice = finishData ? Number(finishData.price) : 0
    const qty = isLaqueado ? frontSurface : (formData.finishes[index]?.quantity || 1)
    
    setFormData(prev => {
      const newFinishes = [...prev.finishes]
      newFinishes[index] = { ...newFinishes[index], finishId, quantity: qty, totalPrice: unitPrice * qty }
      return { ...prev, finishes: mergeFinishes(newFinishes) }
    })
  }

  const updateLaborId = (index: number, laborId: string | number) => {
    const laborData = laborCosts.find(lc => lc.id === laborId)
    const unitPrice = laborData ? Number(laborData.price) : 0
    const qty = formData.labor[index]?.quantity || 1
    setFormData(prev => {
      const newLabor = [...prev.labor]
      newLabor[index] = { ...newLabor[index], laborId, quantity: qty, totalPrice: unitPrice * qty }
      return { ...prev, labor: mergeLabor(newLabor) }
    })
  }

  const updateAdditionalCostId = (index: number, additionalCostId: string | number) => {
    const data = additionalCosts.find(ac => ac.id === additionalCostId)
    const unitPrice = data ? Number(data.price) : 0
    const qty = formData.additionalCosts[index]?.quantity || 1
    setFormData(prev => {
      const newAdditionalCosts = [...prev.additionalCosts]
      newAdditionalCosts[index] = { ...newAdditionalCosts[index], additionalCostId, totalPrice: unitPrice * qty }
      return { ...prev, additionalCosts: newAdditionalCosts }
    })
  }


  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab)
    if (tab === 'parts' && formData.parts.length === 0 && formData.details.length > 0) {
      syncParts()
    }
    if (tab === 'hardware' && formData.hardware.length === 0 && formData.details.length > 0) {
      syncHardware()
    }
    if (tab === 'finishes' && formData.finishes.length === 0 && formData.details.length > 0) {
      syncFinishes()
    }
    if (tab === 'labor' && formData.labor.length === 0 && formData.details.length > 0) {
      syncLabor()
    }
    if (tab === 'costs' && formData.additionalCosts.length === 0 && formData.details.length > 0) {
      syncAdditionalCosts()
    }
  }

  const formatCurrency = (amount: number, currency = 'ARS') => {
    return amount.toLocaleString('es-AR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }



  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex w-full max-sm:w-1/2 max-w-sm items-center space-x-2">
          <Input 
            placeholder="Buscar presupuestos..." 
            className="max-w-sm" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger
            render={
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" /> Agregar Presupuesto
              </Button>
            }
          />
          <DialogContent className="sm:max-w-[95vw] lg:max-w-[1200px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingQuote ? 'Editar Presupuesto' : 'Agregar Presupuesto'}</DialogTitle>
            </DialogHeader>
            
            <div className="flex border-b mb-4 overflow-x-auto">
              <button 
                type="button"
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'basic' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                onClick={() => handleTabChange('basic')}
              >
                Información Básica
              </button>
              <button 
                type="button"
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'items' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                onClick={() => handleTabChange('items')}
              >
                Muebles / Detalles ({formData.details.length})
              </button>
              <button 
                type="button"
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'parts' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                onClick={() => handleTabChange('parts')}
              >
                Piezas ({formData.parts.length})
              </button>
              <button 
                type="button"
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'hardware' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                onClick={() => handleTabChange('hardware')}
              >
                Herrajes ({formData.hardware.length})
              </button>
              <button 
                type="button"
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'finishes' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                onClick={() => handleTabChange('finishes')}
              >
                Acabados ({formData.finishes.length})
              </button>
              <button 
                type="button"
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'labor' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                onClick={() => handleTabChange('labor')}
              >
                Mano de obra ({formData.labor.length})
              </button>
              <button 
                type="button"
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'costs' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                onClick={() => handleTabChange('costs')}
              >
                Costos y Extras ({formData.additionalCosts.length})
              </button>
              <button 
                type="button"
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'woods' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                onClick={() => setActiveTab('woods')}
              >
                Maderas
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="clientId" className="text-xs font-bold text-muted-foreground uppercase">Cliente</Label>
                        <select
                          id="clientId"
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          value={formData.clientId}
                          onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                          required
                        >
                          <option value="" disabled>Seleccione un cliente...</option>
                          {clients.map(client => (
                            <option key={client.id} value={client.id}>
                              {client.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description" className="text-xs font-bold text-muted-foreground uppercase">Descripción</Label>
                        <Input id="description" className="h-9" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="code" className="text-xs font-bold text-muted-foreground uppercase">Código</Label>
                        <Input id="code" className="h-9" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dateDelivery" className="text-xs font-bold text-muted-foreground uppercase">Fecha Entrega</Label>
                        <Input id="dateDelivery" className="h-9" type="date" value={formData.dateDelivery.toISOString().split('T')[0]} onChange={e => setFormData({...formData, dateDelivery: new Date(e.target.value)})} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="exchangeRate" className="text-xs font-bold text-muted-foreground uppercase text-primary">T. Cambio (ARS/USD)</Label>
                        <Input id="exchangeRate" className="h-9" type="number" step="0.01" value={formData.exchangeRate} onChange={e => setFormData({...formData, exchangeRate: parseFloat(e.target.value) || 0})} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="profit" className="text-xs font-bold text-muted-foreground uppercase">Ganancia</Label>
                        <select
                          id="profit"
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          value={formData.profit}
                          onChange={e => setFormData({...formData, profit: parseFloat(e.target.value) || 1.5})}
                        >
                          <option value={1}>1</option>
                          <option value={1.5}>1.5</option>
                          <option value={1.7}>1.7</option>
                          <option value={2}>2</option>
                          <option value={2.5}>2.5</option>
                          <option value={3}>3</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-muted-foreground uppercase">Costo ARS</Label>
                      <div className="h-9 w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm font-semibold flex items-center">
                        {formatCurrency(formData.costPesos)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-muted-foreground uppercase">Precio ARS</Label>
                      <div className="h-9 w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm font-semibold flex items-center">
                        {formatCurrency(formData.pricePesos)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-muted-foreground uppercase text-green-600">Costo USD</Label>
                      <div className="h-9 w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm text-green-600 font-semibold flex items-center">
                        {formatCurrency(formData.costDollars, 'USD')}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-primary uppercase">Precio USD</Label>
                      <div className="h-9 w-full rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary font-bold flex items-center shadow-sm">
                        {formatCurrency(formData.priceDollars, 'USD')}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <Label htmlFor="notes" className="text-xs font-bold text-muted-foreground uppercase">Notas / Observaciones</Label>
                    <textarea 
                      id="notes" 
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.notes || ''}
                      onChange={e => setFormData({...formData, notes: e.target.value})}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'items' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Muebles incluidos en el presupuesto</h3>
                    <Button type="button" variant="outline" size="sm" onClick={addDetail}>
                      <Plus className="h-4 w-4 mr-2" /> Agregar Item
                    </Button>
                  </div>
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50 text-[10px] uppercase font-bold">
                        <TableRow>
                          <TableHead>Mueble</TableHead>
                          <TableHead className="w-20">Cant.</TableHead>
                          <TableHead>Medidas (mm)</TableHead>
                          <TableHead>Precio Unit.</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.details.map((detail, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <select 
                                className="w-full bg-transparent border-none focus:ring-0 text-sm"
                                value={detail.furnitureId} 
                                onChange={e => updateDetail(idx, { furnitureId: e.target.value })}
                              >
                                <option value="" disabled>Seleccione mueble...</option>
                                {furnitures.map(f => (
                                  <option key={f.id} value={f.id}>
                                    [{f.code}] {f.name}
                                  </option>
                                ))}
                              </select>
                            </TableCell>
                            <TableCell>
                              <Input type="number" className="h-8 text-center" value={detail.quantity} onChange={e => updateDetail(idx, { quantity: parseInt(e.target.value) || 1 })} />
                            </TableCell>
                            <TableCell>
                                <div className="flex gap-1 items-center text-xs font-mono">
                                    <Input type="number" className="h-8 w-20 px-1 text-center" value={detail.length} onChange={e => updateDetail(idx, { length: parseInt(e.target.value) || 0 })} />
                                    <span className="text-muted-foreground">x</span>
                                    <Input type="number" className="h-8 w-20 px-1 text-center" value={detail.width} onChange={e => updateDetail(idx, { width: parseInt(e.target.value) || 0 })} />
                                    <span className="text-muted-foreground">x</span>
                                    <Input type="number" className="h-8 w-20 px-1 text-center" value={detail.depth} onChange={e => updateDetail(idx, { depth: parseInt(e.target.value) || 0 })} />
                                </div>
                            </TableCell>
                            <TableCell>
                                <Input type="number" step="0.01" className="h-8 w-24" value={detail.unitPrice} onChange={e => updateDetail(idx, { unitPrice: parseFloat(e.target.value) || 0 })} />
                            </TableCell>
                            <TableCell className="text-xs font-bold text-primary whitespace-nowrap">
                              {formatCurrency(detail.price)}
                            </TableCell>
                            <TableCell>
                              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => removeDetail(idx)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {formData.details.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm italic">
                              No hay muebles agregados a este presupuesto.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {activeTab === 'parts' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Piezas adicionales del presupuesto</h3>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={syncParts}>
                        <ArrowUpDown className="h-4 w-4 mr-2" /> Sincronizar desde Muebles
                      </Button>
                    </div>
                  </div>
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50 text-[10px] uppercase font-bold">
                        <TableRow>
                          <TableHead>Pieza</TableHead>
                          <TableHead>Mueble Relacionado</TableHead>
                          <TableHead className="text-center">Medidas (LxA)</TableHead>
                          <TableHead>Madera</TableHead>
                          <TableHead className="w-32">Veta</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.parts.map((part, idx) => {
                          const partDef = partsList.find(p => p.id.toString() === part.partId?.toString())
                          const furniture = furnitures.find(f => f.id.toString() === part.furnitureId?.toString())
                          const wood = woods.find(w => w.id.toString() === part.woodId?.toString()) || defaultWood
                          const thickness = wood ? Number(wood.thickness) : 18

                          const context = furniture ? {
                            L: Number(furniture.length),
                            A: Number(furniture.width),
                            P: Number(furniture.depth),
                            E: thickness
                          } : { L: 0, A: 0, P: 0, E: 0 }

                          const length = partDef ? evaluateFormula(partDef.formulaLength, context) : 0
                          const width = partDef ? evaluateFormula(partDef.formulaWidth, context) : 0

                          return (
                            <TableRow key={idx}>
                              <TableCell className="text-sm font-medium">
                                {partDef?.name || 'Pieza desconocida'}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {furniture ? `[${furniture.code}] ${furniture.name}` : 'Mueble desconocido'}
                              </TableCell>
                              <TableCell className="text-center font-mono text-xs">
                                {length} x {width}
                              </TableCell>
                              <TableCell>
                                <select 
                                  className="w-full bg-transparent border-none focus:ring-0 text-sm"
                                  value={part.woodId} 
                                  onChange={e => updatePart(idx, { woodId: e.target.value })}
                                >
                                  <option value="" disabled>Seleccione una madera...</option>
                                  {woods.map(w => (
                                    <option key={w.id} value={w.id}>
                                      {w.name}
                                    </option>
                                  ))}
                                </select>
                              </TableCell>
                              <TableCell>
                                <select 
                                  className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium"
                                  value={part.grain || 'Ninguna'} 
                                  onChange={e => updatePart(idx, { grain: e.target.value })}
                                >
                                  <option value="Ninguna">Ninguna</option>
                                  <option value="Longitud">Longitud</option>
                                  <option value="Ancho">Ancho</option>
                                </select>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                        {formData.parts.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-sm italic">
                              No hay piezas adicionales en este presupuesto.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {activeTab === 'woods' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Resumen de Maderas</h3>
                  </div>
                  {woodStatsArray.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm italic border rounded-md">
                      No hay muebles configurados o seleccionados aún.
                    </div>
                  ) : (
                    woodStatsArray.map((stats, index) => (
                      <div key={index} className="border rounded-md overflow-hidden text-sm shadow-sm">
                        <div className="grid grid-cols-4 divide-x divide-y border-b">
                          <div className="p-2 font-medium bg-primary/10">Madera Usada:</div>
                          <div className="p-2 text-left col-span-3 font-bold text-primary bg-primary/5">{stats.woodName}</div>
                          <div className="p-2 font-medium bg-muted/10">Tamaño del tablero</div>
                          <div className="p-2 text-right">{stats.boardSize}</div>
                          <div className="p-2 font-medium bg-muted/10">Cantidad de Piezas:</div>
                          <div className="p-2 text-right">{stats.piecesCount}</div>
                          <div className="p-2 font-medium bg-muted/10">Cantidad de tableros:</div>
                          <div className="p-2 text-right font-bold">{stats.boardsCount}</div>
                          <div className="p-2 font-medium bg-muted/10">Superficie de las piezas:</div>
                          <div className="p-2 text-right">{stats.piecesSurface.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })} mm</div>
                          <div className="p-2 font-medium bg-muted/10">Superficie del Tablero:</div>
                          <div className="p-2 text-right">{stats.boardSurface.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })} mm</div>
                          <div className="p-2 font-medium bg-muted/10">Superficie de nuevos remanentes:</div>
                          <div className="p-2 text-right">{stats.newRemnantsSurface.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })} mm</div>
                          <div className="p-2 font-medium bg-muted/10">Superficie tableros:</div>
                          <div className="p-2 text-right">{stats.totalBoardsSurface.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })} mm</div>
                          <div className="p-2 font-medium bg-muted/10">Superficie de desperdicio:</div>
                          <div className="p-2 text-right">{stats.wasteSurface.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })} mm</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'hardware' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Herrajes de los muebles</h3>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={addHardware}>
                        <Plus className="h-4 w-4 mr-2" /> Agregar Herraje
                      </Button>
                    </div>
                  </div>
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50 text-[10px] uppercase font-bold">
                        <TableRow>
                          <TableHead className="w-32">Código</TableHead>
                          <TableHead>Herraje</TableHead>
                          <TableHead>Mueble Relacionado</TableHead>
                          <TableHead className="w-20 text-center">Cant.</TableHead>
                          <TableHead className="w-24">U.M.</TableHead>
                          <TableHead className="w-24 text-right">Precio Unit.</TableHead>
                          <TableHead className="w-24 text-right">Precio Total</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.hardware.map((hw, idx) => {
                          const hardwareData = extraParts.find(p => p.id === hw.hardwareId)
                          const furniture = furnitures.find(f => f.id === hw.furnitureId)
                          
                          return (
                            <TableRow key={idx}>
                              <TableCell>
                                <Input 
                                  className="h-8 text-xs" 
                                  value={hw.code || ''} 
                                  onChange={e => updateHardware(idx, { code: e.target.value })} 
                                />
                              </TableCell>
                              <TableCell>
                                  <select
                                    className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={hw.hardwareId ?? ''}
                                    onChange={(e) => updateHardwareId(idx, e.target.value)}
                                  >
                                    <option value="" disabled>Seleccione herraje...</option>
                                  {extraParts.map(p => (
                                    <option key={p.id} value={p.id}>
                                      {p.name}
                                    </option>
                                  ))}
                                </select>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {furniture ? `[${furniture.code}] ${furniture.name}` : hw.hardwareId ? 'Varios Muebles / Resumen' : 'Manual / Sin mueble'}
                              </TableCell>
                              <TableCell>
                                <Input 
                                  type="number" 
                                  className="h-8 text-center" 
                                  value={hw.quantity} 
                                  onChange={e => {
                                    const qty = parseInt(e.target.value) || 0
                                    const unitPrice = hardwareData ? Number(hardwareData.price) : 0
                                    updateHardware(idx, { quantity: qty, totalPrice: qty * unitPrice })
                                  }} 
                                />
                              </TableCell>
                              <TableCell>
                                <Input 
                                  className="h-8 text-xs" 
                                  value={hw.unitMeasure || ''} 
                                  onChange={e => updateHardware(idx, { unitMeasure: e.target.value })} 
                                />
                              </TableCell>
                              <TableCell className="text-sm text-right font-mono">
                                {hardwareData ? formatCurrency(Number(hardwareData.price)) : '-'}
                              </TableCell>
                              <TableCell className="text-sm text-right font-bold text-primary">
                                {formatCurrency(hw.totalPrice ?? 0)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                  onClick={() => removeHardware(idx)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                        {formData.hardware.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-8 text-muted-foreground text-sm italic">
                              No hay herrajes para los muebles seleccionados.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {activeTab === 'finishes' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Acabados de los muebles</h3>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={addFinish}>
                        <Plus className="h-4 w-4 mr-2" /> Agregar Acabado
                      </Button>
                    </div>
                  </div>
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50 text-[10px] uppercase font-bold">
                        <TableRow>
                          <TableHead>Acabado</TableHead>
                          <TableHead>Mueble Relacionado</TableHead>
                          <TableHead className="w-20 text-center">Cant.</TableHead>
                          <TableHead className="w-24 text-right">Precio Unit.</TableHead>
                          <TableHead className="w-24 text-right">Precio Total</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.finishes.map((f, idx) => {
                          const finishData = costs.find(c => c.id === f.finishId)
                          const furniture = furnitures.find(fur => fur.id === f.furnitureId)
                          
                          return (
                            <TableRow key={idx}>
                              <TableCell>
                                <select
                                  className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                  value={f.finishId ?? ''}
                                  onChange={(e) => updateFinishId(idx, e.target.value)}
                                >
                                  <option value="" disabled>Seleccione acabado...</option>
                                  {costs.map(c => (
                                    <option key={c.id} value={c.id}>
                                      {c.name}
                                    </option>
                                  ))}
                                </select>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {furniture ? `[${furniture.code}] ${furniture.name}` : 'Manual / Sin mueble'}
                              </TableCell>
                              <TableCell>
                                <Input 
                                  type="number" 
                                  step="0.001"
                                  className="h-8 text-center" 
                                  value={f.quantity || 1} 
                                  disabled={finishData?.name.toUpperCase().includes('LAQUEA')}
                                  onChange={e => {
                                    const qty = parseFloat(e.target.value) || 0
                                    const unitPrice = finishData ? Number(finishData.price) : 0
                                    updateFinish(idx, { quantity: qty, totalPrice: qty * unitPrice })
                                  }} 
                                />
                              </TableCell>
                              <TableCell className="text-sm text-right font-mono">
                                {finishData ? formatCurrency(Number(finishData.price)) : '-'}
                              </TableCell>
                              <TableCell className="text-sm text-right font-bold text-primary">
                                {formatCurrency(f.totalPrice ?? 0)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive"
                                  onClick={() => removeFinish(idx)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                        {formData.finishes.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-sm italic">
                              No hay acabados para los muebles seleccionados.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {activeTab === 'labor' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Mano de obra de los muebles</h3>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={addLabor}>
                        <Plus className="h-4 w-4 mr-2" /> Agregar Mano de Obra
                      </Button>
                    </div>
                  </div>
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50 text-[10px] uppercase font-bold">
                        <TableRow>
                          <TableHead>Concepto Mano de Obra</TableHead>
                          <TableHead>Mueble Relacionado</TableHead>
                          <TableHead className="w-20 text-center">Cant.</TableHead>
                          <TableHead className="w-24 text-right">Precio Unit.</TableHead>
                          <TableHead className="w-24 text-right">Precio Total</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.labor.map((l, idx) => {
                          const laborData = laborCosts.find(lc => lc.id === l.laborId)
                          const furniture = furnitures.find(fur => fur.id === l.furnitureId)
                          
                          return (
                            <TableRow key={idx}>
                              <TableCell>
                                <select
                                  className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                  value={l.laborId ?? ''}
                                  onChange={(e) => updateLaborId(idx, e.target.value)}
                                >
                                  <option value="" disabled>Seleccione concepto...</option>
                                  {laborCosts.map(lc => (
                                    <option key={lc.id} value={lc.id}>
                                      {lc.name}
                                    </option>
                                  ))}
                                </select>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {furniture ? `[${furniture.code}] ${furniture.name}` : 'Manual / Sin mueble'}
                              </TableCell>
                              <TableCell>
                                <Input 
                                  type="number" 
                                  step="0.01"
                                  className="h-8 text-center" 
                                  value={l.quantity || 1} 
                                  disabled={(() => {
                                    const name = laborData?.name.toUpperCase() || ''
                                    return name.includes('FILO') || name.includes('PEGADO') || name.includes('CORTE')
                                  })()}
                                  onChange={e => {
                                    const qty = parseFloat(e.target.value) || 0
                                    const unitPrice = laborData ? Number(laborData.price) : 0
                                    updateLabor(idx, { quantity: qty, totalPrice: qty * unitPrice })
                                  }} 
                                />
                              </TableCell>
                              <TableCell className="text-sm text-right font-mono">
                                {laborData ? formatCurrency(Number(laborData.price)) : '-'}
                              </TableCell>
                              <TableCell className="text-sm text-right font-bold text-primary">
                                {formatCurrency(l.totalPrice ?? 0)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive"
                                  onClick={() => removeLabor(idx)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                        {formData.labor.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-sm italic">
                              No hay mano de obra para los muebles seleccionados.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {activeTab === 'costs' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Costos y Extras de los muebles</h3>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={addAdditionalCost}>
                        <Plus className="h-4 w-4 mr-2" /> Agregar Costo Extra
                      </Button>
                    </div>
                  </div>
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50 text-[10px] uppercase font-bold">
                        <TableRow>
                          <TableHead>Concepto</TableHead>
                          <TableHead>Mueble Relacionado</TableHead>
                          <TableHead className="w-20 text-center">Cant.</TableHead>
                          <TableHead className="w-24 text-right">Precio Unit.</TableHead>
                          <TableHead className="w-24 text-right">Precio Total</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.additionalCosts.map((c, idx) => {
                          const data = additionalCosts.find(ac => ac.id === c.additionalCostId)
                          const furniture = furnitures.find(fur => fur.id === c.furnitureId)
                          
                          return (
                            <TableRow key={idx}>
                              <TableCell>
                                <select
                                  className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                  value={c.additionalCostId ?? ''}
                                  onChange={(e) => updateAdditionalCostId(idx, e.target.value)}
                                >
                                  <option value="" disabled>Seleccione concepto...</option>
                                  {additionalCosts.map(ac => (
                                    <option key={ac.id} value={ac.id}>
                                      {ac.name}
                                    </option>
                                  ))}
                                </select>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {furniture ? `[${furniture.code}] ${furniture.name}` : 'Manual / Sin mueble'}
                              </TableCell>
                              <TableCell>
                                <Input 
                                  type="number" 
                                  step="0.01"
                                  className="h-8 text-center" 
                                  value={c.quantity || 1} 
                                  onChange={e => {
                                    const qty = parseFloat(e.target.value) || 0
                                    const unitPrice = data ? Number(data.price) : 0
                                    updateAdditionalCost(idx, { quantity: qty, totalPrice: qty * unitPrice })
                                  }} 
                                />
                              </TableCell>
                              <TableCell className="text-sm text-right font-mono">
                                {data ? formatCurrency(Number(data.price)) : '-'}
                              </TableCell>
                              <TableCell className="text-sm text-right font-bold text-primary">
                                {formatCurrency(c.totalPrice ?? 0)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive"
                                  onClick={() => removeAdditionalCost(idx)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                        {formData.additionalCosts.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-sm italic">
                              No hay costos extras para los muebles seleccionados.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <DialogFooter className="pt-4 border-t">
                <Button type="submit" disabled={isLoading} className="font-bold px-8">
                  {isLoading ? 'Guardando...' : editingQuote ? 'Actualizar Presupuesto' : 'Guardar Presupuesto'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-card overflow-x-auto shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="cursor-pointer font-bold" onClick={() => requestSort('code')}>
                <div className="flex items-center">Código <SortIcon columnKey="code" sortConfig={sortConfig} /></div>
              </TableHead>
              <TableHead className="cursor-pointer font-bold" onClick={() => requestSort('client.name')}>
                <div className="flex items-center">Cliente <SortIcon columnKey="client.name" sortConfig={sortConfig} /></div>
              </TableHead>
              <TableHead className="font-bold hidden md:table-cell">Descripción</TableHead>
              <TableHead className="cursor-pointer font-bold" onClick={() => requestSort('date')}>
                <div className="flex items-center">Fecha <SortIcon columnKey="date" sortConfig={sortConfig} /></div>
              </TableHead>
              <TableHead className="text-right font-bold">Items</TableHead>
              <TableHead className="text-right font-bold cursor-pointer" onClick={() => requestSort('pricePesos')}>
                <div className="flex items-center justify-end">Precio (ARS) <SortIcon columnKey="pricePesos" sortConfig={sortConfig} /></div>
              </TableHead>
              <TableHead className="text-center font-bold">Estado</TableHead>
              <TableHead className="text-right font-bold">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedQuotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-32 text-muted-foreground">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <FileText className="h-8 w-8 opacity-20" />
                    <p>No se encontraron presupuestos cargados.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedQuotes.map((quote) => {
                const status = STATUS_OPTIONS.find(s => s.value === quote.status)
                return (
                  <TableRow key={quote.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono font-medium text-primary">{quote.code}</TableCell>
                    <TableCell className="font-medium">{quote.client?.name || '-'}</TableCell>
                    <TableCell className="max-w-[180px] truncate hidden md:table-cell text-muted-foreground">
                        {quote.description}
                    </TableCell>
                    <TableCell className="text-sm">
                        {new Date(quote.date).toLocaleDateString('es-AR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center justify-center h-6 px-2 bg-muted rounded-md text-[10px] font-bold">
                        {quote.details?.length || 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      {formatCurrency(quote.pricePesos)}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase border ${status?.color || 'bg-gray-100 text-gray-700'}`}>
                        {status?.label || 'Desconocido'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(quote)}
                          className="h-8 w-8 text-primary hover:bg-primary/10"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={async () => {
                            try {
                              const result = await generateStrongWord(quote.id)
                              if (result.success) {
                                // Convert base64 to Blob
                                const byteCharacters = atob(result.data)
                                const byteNumbers = new Array(byteCharacters.length)
                                for (let i = 0; i < byteCharacters.length; i++) {
                                  byteNumbers[i] = byteCharacters.charCodeAt(i)
                                }
                                const byteArray = new Uint8Array(byteNumbers)
                                const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
                                
                                // Trigger download
                                const url = window.URL.createObjectURL(blob)
                                const a = document.createElement('a')
                                a.href = url
                                a.download = result.fileName
                                document.body.appendChild(a)
                                a.click()
                                window.URL.revokeObjectURL(url)
                                document.body.removeChild(a)
                              }
                            } catch (error) {
                              console.error('Error al generar Word:', error)
                              alert('Error al generar el documento Word con los datos actualizados')
                            }
                          }}
                          className="h-8 w-8 text-orange-600 hover:bg-orange-50"
                          title="Descargar Word"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => downloadCutsExcel(quote)}
                          className="h-8 w-8 text-indigo-600 hover:bg-indigo-50"
                          title="Cortes"
                        >
                          <Scissors className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDuplicate(quote.id)}
                          className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                          title="Duplicar"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(quote.id)}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/10">
            <div className="text-xs text-muted-foreground">
               Mostrando {paginatedQuotes.length} de {filteredQuotes.length} registros
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="h-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-xs font-bold px-4">
                Página {currentPage} de {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="h-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
