'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, FileText, Calendar, DollarSign, User, Armchair, Layers, Info, CheckCircle2, AlertCircle, X } from 'lucide-react'
import { QuoteInput, QuoteDetailInput, QuoteAdditionalCostInput, QuotePartInput, QuoteHardwareInput, QuoteFinishInput, QuoteLaborInput, QuoteWoodInput, createQuote, updateQuote, deleteQuote } from '@/app/actions/quote'

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
}

type QuoteLabor = {
  id: string | number
  laborId: string | number
  furnitureId: string | number
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
  clients: any[]
  furnitures: any[]
  woods: any[]
  costs: any[]
  extraParts: any[]
  laborCosts: any[]
  additionalCosts: any[]
  partsList: any[]
}

const STATUS_OPTIONS = [
  { value: 1, label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  { value: 2, label: 'Aprobado', color: 'bg-green-100 text-green-700' },
  { value: 3, label: 'Rechazado', color: 'bg-red-100 text-red-700' },
  { value: 4, label: 'Finalizado', color: 'bg-blue-100 text-blue-700' },
]

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
      const data = additionalCosts.find(ac => ac.id === c.additionalCostId)
      return acc + (data ? Number(data.price) : 0)
    }, 0)

    const hardwareTotal = formData.hardware.reduce((acc, hw) => {
      const hwData = extraParts.find(p => p.id === hw.hardwareId)
      return acc + (hwData ? Number(hwData.price) : 0)
    }, 0)

    const finishesTotal = formData.finishes.reduce((acc, f) => {
      const fData = costs.find(c => c.id === f.finishId)
      return acc + (fData ? Number(fData.price) : 0)
    }, 0)

    const laborTotal = formData.labor.reduce((acc, l) => {
      const lData = laborCosts.find(lc => lc.id === l.laborId)
      return acc + (lData ? Number(lData.price) : 0)
    }, 0)

    const totalCostPesos = totalDetailsPrice + totalAdditionalPrice + hardwareTotal + finishesTotal + laborTotal
    
    setFormData(prev => {
      const pricePesos = totalCostPesos * prev.profit
      const costDollars = prev.exchangeRate > 0 ? totalCostPesos / prev.exchangeRate : 0
      const priceDollars = prev.exchangeRate > 0 ? pricePesos / prev.exchangeRate : 0

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

  const evaluateFormula = (formula: string, context: { L: number, A: number, P: number, E: number }) => {
    if (!formula) return 0
    try {
      let expression = formula.toUpperCase()
        .replace(/L/g, context.L.toString())
        .replace(/A/g, context.A.toString())
        .replace(/P/g, context.P.toString())
        .replace(/E/g, context.E.toString())
      const result = new Function(`return ${expression}`)()
      return Math.max(0, Math.round(result))
    } catch (e) {
      return 0
    }
  }

  const woodStatsArray = useMemo(() => {
    const statsByWood = new Map<number, any>()

    formData.details.forEach(detail => {
      const furniture = furnitures.find(f => f.id === detail.furnitureId)
      if (!furniture || !furniture.parts) return

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
  }, [formData.details, furnitures, woods, defaultWood])

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
    const aValue = (a as any)[key]
    const bValue = (b as any)[key]

    if (aValue === null) return 1
    if (bValue === null) return -1
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
        additionalCostId: c.additionalCostId,
        furnitureId: c.furnitureId
      })),
      parts: (quote.parts || []).map(p => ({
        id: p.id,
        partId: p.partId,
        furnitureId: p.furnitureId,
        woodId: p.woodId
      })),
      hardware: (quote.hardware || []).map(hw => ({
        id: hw.id,
        hardwareId: hw.hardwareId,
        furnitureId: hw.furnitureId,
        code: hw.code,
        quantity: hw.quantity,
        unitMeasure: hw.unitMeasure,
        totalPrice: hw.totalPrice
      })),
      finishes: (quote.finishes || []).map(f => ({
        id: f.id,
        finishId: f.finishId,
        furnitureId: f.furnitureId
      })),
      labor: (quote.labor || []).map(l => ({
        id: l.id,
        laborId: l.laborId,
        furnitureId: l.furnitureId
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
        quantityCut: w.quantityCut
      }))
    })
    setIsOpen(true)
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

    try {
      if (editingQuote) {
        const updated = await updateQuote(editingQuote.id, submissionData)
        setQuotes((prev) =>
          prev.map((q) => (q.id === editingQuote.id ? { ...updated, client: { name: clients.find(c => c.id === formData.clientId)?.name || null } } : q))
        )
      } else {
        const created = await createQuote(submissionData)
        setQuotes((prev) => [{ ...created, client: { name: clients.find(c => c.id === formData.clientId)?.name || null } }, ...prev])
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

  const addDetail = () => {
    const availableFurnitures = furnitures.filter(f => 
      !formData.details.some(d => d.furnitureId === f.id && d.length === f.length && d.width === f.width && d.depth === f.depth)
    )
    
    const furnitureToAdd = availableFurnitures.length > 0 ? availableFurnitures[0] : furnitures[0]
    
    setFormData({
      ...formData,
      details: [
        ...formData.details,
        {
          furnitureId: furnitureToAdd.id,
          quantity: 1,
          unitPrice: furnitureToAdd.furnitureTotal || 0,
          price: furnitureToAdd.furnitureTotal || 0,
          length: furnitureToAdd.length || 0,
          width: furnitureToAdd.width || 0,
          depth: furnitureToAdd.depth || 0,
        }
      ]
    })
  }

  const removeDetail = (index: number) => {
    setFormData({
      ...formData,
      details: formData.details.filter((_, i) => i !== index)
    })
  }

  const updateDetail = (index: number, updates: Partial<QuoteDetailInput>) => {
    const newDetails = [...formData.details]
    const detail = { ...newDetails[index], ...updates }
    
    if ('unitPrice' in updates || 'quantity' in updates) {
      detail.price = detail.unitPrice * detail.quantity
    }
    
    if ('furnitureId' in updates) {
      const furniture = furnitures.find(f => f.id === updates.furnitureId)
      if (furniture) {
        detail.length = furniture.length
        detail.width = furniture.width
        detail.depth = furniture.depth
        detail.unitPrice = furniture.furnitureTotal
        detail.price = furniture.furnitureTotal * detail.quantity
      }
    }

    newDetails[index] = detail
    setFormData({ ...formData, details: newDetails })
  }

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

  const removePart = (index: number) => {
    setFormData({
      ...formData,
      parts: formData.parts.filter((_, i) => i !== index)
    })
  }

  const updatePart = (index: number, updates: Partial<QuotePartInput>) => {
    const newParts = [...formData.parts]
    newParts[index] = { ...newParts[index], ...updates }
    setFormData({ ...formData, parts: newParts })
  }

  const syncParts = () => {
    const newParts: QuotePartInput[] = []
    
    formData.details.forEach(detail => {
      const furniture = furnitures.find(f => f.id === detail.furnitureId)
      if (!furniture || !furniture.parts) return

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
          woodId: woodId || 0
        })
      })
    })

    setFormData(prev => ({ ...prev, parts: newParts }))
  }

  const syncHardware = () => {
    const newHardware: QuoteHardwareInput[] = []
    
    formData.details.forEach(detail => {
      const furniture = furnitures.find(f => f.id === detail.furnitureId)
      if (!furniture || !furniture.extraParts) return

      furniture.extraParts.forEach((ep: any) => {
        if (!ep.extraPart) return

        newHardware.push({
          hardwareId: ep.extraPart.id,
          furnitureId: furniture.id,
          code: ep.extraPart.code || '',
          quantity: (ep.quantity || 1) * detail.quantity,
          unitMeasure: 'un',
          totalPrice: Number(ep.extraPart.price || 0) * (ep.quantity || 1) * detail.quantity
        })
      })
    })

    setFormData(prev => ({ ...prev, hardware: newHardware }))
  }

  const syncFinishes = () => {
    const newFinishes: QuoteFinishInput[] = []
    
    formData.details.forEach(detail => {
      const furniture = furnitures.find(f => f.id === detail.furnitureId)
      if (!furniture || !furniture.costs) return

      furniture.costs.forEach((c: any) => {
        if (!c.cost) return

        newFinishes.push({
          finishId: c.cost.id,
          furnitureId: furniture.id
        })
      })
    })

    setFormData(prev => ({ ...prev, finishes: newFinishes }))
  }

  const syncLabor = () => {
    const newLabor: QuoteLaborInput[] = []
    
    formData.details.forEach(detail => {
      const furniture = furnitures.find(f => f.id === detail.furnitureId)
      if (!furniture || !furniture.laborCosts) return

      furniture.laborCosts.forEach((l: any) => {
        if (!l.laborCost) return

        newLabor.push({
          laborId: l.laborCost.id,
          furnitureId: furniture.id
        })
      })
    })

    setFormData(prev => ({ ...prev, labor: newLabor }))
  }

  const syncAdditionalCosts = () => {
    const newAdditionalCosts: QuoteAdditionalCostInput[] = []
    
    formData.details.forEach(detail => {
      const furniture = furnitures.find(f => f.id === detail.furnitureId)
      if (!furniture || !furniture.additionalCosts) return

      furniture.additionalCosts.forEach((ac: any) => {
        if (!ac.additionalCost) return

        newAdditionalCosts.push({
          additionalCostId: ac.additionalCost.id,
          furnitureId: furniture.id
        })
      })
    })

    setFormData(prev => ({ ...prev, additionalCosts: newAdditionalCosts }))
  }

  const addHardware = () => {
    const defaultHW = extraParts[0]
    setFormData(prev => ({
      ...prev,
      hardware: [
        ...prev.hardware,
        { 
          hardwareId: defaultHW?.id || 0, 
          furnitureId: prev.details[0]?.furnitureId || 0,
          code: defaultHW?.code || '',
          quantity: 1,
          unitMeasure: 'un',
          totalPrice: Number(defaultHW?.price || 0)
        }
      ]
    }))
  }

  const addFinish = () => {
    setFormData(prev => ({
      ...prev,
      finishes: [
        ...prev.finishes,
        { finishId: costs[0]?.id || 0, furnitureId: formData.details[0]?.furnitureId || 0 }
      ]
    }))
  }

  const addLabor = () => {
    setFormData(prev => ({
      ...prev,
      labor: [
        ...prev.labor,
        { laborId: laborCosts[0]?.id || 0, furnitureId: formData.details[0]?.furnitureId || 0 }
      ]
    }))
  }

  const addAdditionalCost = () => {
    setFormData(prev => ({
      ...prev,
      additionalCosts: [
        ...prev.additionalCosts,
        { additionalCostId: additionalCosts[0]?.id || 0, furnitureId: formData.details[0]?.furnitureId || 0 }
      ]
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

  const updateHardware = (index: number, updates: Partial<QuoteHardware>) => {
    setFormData(prev => {
      const newHardware = [...prev.hardware]
      newHardware[index] = { ...newHardware[index], ...updates }
      return { ...prev, hardware: newHardware }
    })
  }

  const updateHardwareId = (index: number, hardwareId: number) => {
    const hwData = extraParts.find(p => p.id === hardwareId)
    updateHardware(index, { 
      hardwareId, 
      code: hwData?.code || '',
      totalPrice: Number(hwData?.price || 0) * (formData.hardware[index]?.quantity || 1)
    })
  }

  const updateFinishId = (index: number, finishId: number) => {
    setFormData(prev => {
      const newFinishes = [...prev.finishes]
      newFinishes[index] = { ...newFinishes[index], finishId }
      return { ...prev, finishes: newFinishes }
    })
  }

  const updateLaborId = (index: number, laborId: number) => {
    setFormData(prev => {
      const newLabor = [...prev.labor]
      newLabor[index] = { ...newLabor[index], laborId }
      return { ...prev, labor: newLabor }
    })
  }

  const updateAdditionalCostId = (index: number, additionalCostId: number) => {
    setFormData(prev => {
      const newAdditionalCosts = [...prev.additionalCosts]
      newAdditionalCosts[index] = { ...newAdditionalCosts[index], additionalCostId }
      return { ...prev, additionalCosts: newAdditionalCosts }
    })
  }

  useEffect(() => {
    if (activeTab === 'parts' && formData.parts.length === 0 && formData.details.length > 0) {
      syncParts()
    }
    if (activeTab === 'hardware' && formData.hardware.length === 0 && formData.details.length > 0) {
      syncHardware()
    }
    if (activeTab === 'finishes' && formData.finishes.length === 0 && formData.details.length > 0) {
      syncFinishes()
    }
    if (activeTab === 'labor' && formData.labor.length === 0 && formData.details.length > 0) {
      syncLabor()
    }
    if (activeTab === 'costs' && formData.additionalCosts.length === 0 && formData.details.length > 0) {
      syncAdditionalCosts()
    }
  }, [activeTab])

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig?.key !== columnKey) return <ArrowUpDown className="ml-2 h-4 w-4" />
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="ml-2 h-4 w-4 text-primary" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4 text-primary" />
    )
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
                onClick={() => setActiveTab('basic')}
              >
                Información Básica
              </button>
              <button 
                type="button"
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'items' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                onClick={() => setActiveTab('items')}
              >
                Muebles / Detalles ({formData.details.length})
              </button>
              <button 
                type="button"
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'parts' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                onClick={() => setActiveTab('parts')}
              >
                Piezas ({formData.parts.length})
              </button>
              <button 
                type="button"
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'hardware' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                onClick={() => setActiveTab('hardware')}
              >
                Herrajes ({formData.hardware.length})
              </button>
              <button 
                type="button"
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'finishes' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                onClick={() => setActiveTab('finishes')}
              >
                Acabados ({formData.finishes.length})
              </button>
              <button 
                type="button"
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'labor' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                onClick={() => setActiveTab('labor')}
              >
                Mano de obra ({formData.labor.length})
              </button>
              <button 
                type="button"
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'costs' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                onClick={() => setActiveTab('costs')}
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
                      <Input type="number" step="0.01" className="h-9" value={formData.costPesos} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-muted-foreground uppercase">Precio ARS</Label>
                      <Input type="number" step="0.01" className="h-9" value={formData.pricePesos} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-muted-foreground uppercase text-green-600">Costo USD</Label>
                      <div className="h-9 w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm text-green-600 font-semibold flex items-center">
                        {formatCurrency(formData.costDollars)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-primary uppercase">Precio USD</Label>
                      <div className="h-9 w-full rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary font-bold flex items-center shadow-sm">
                        {formatCurrency(formData.priceDollars)}
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
                          <TableHead>Subtotal</TableHead>
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
                                onChange={e => updateDetail(idx, { furnitureId: parseInt(e.target.value) })}
                              >
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
                          <TableHead>Madera</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.parts.map((part, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-sm font-medium">
                              {partsList.find(p => p.id === part.partId)?.name || 'Pieza desconocida'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {(() => {
                                const f = furnitures.find(f => f.id === part.furnitureId);
                                return f ? `[${f.code}] ${f.name}` : 'Mueble desconocido';
                              })()}
                            </TableCell>
                            <TableCell>
                              <select 
                                className="w-full bg-transparent border-none focus:ring-0 text-sm"
                                value={part.woodId} 
                                onChange={e => updatePart(idx, { woodId: parseInt(e.target.value) })}
                              >
                                <option value={0} disabled>Seleccione una madera...</option>
                                {woods.map(w => (
                                  <option key={w.id} value={w.id}>
                                    {w.name}
                                  </option>
                                ))}
                              </select>
                            </TableCell>
                          </TableRow>
                        ))}
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
                      <Button type="button" variant="outline" size="sm" onClick={syncHardware}>
                        <ArrowUpDown className="h-4 w-4 mr-2" /> Sincronizar desde Muebles
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
                                  value={hw.hardwareId}
                                  onChange={(e) => updateHardwareId(idx, Number(e.target.value))}
                                >
                                  <option value={0} disabled>Seleccione herraje...</option>
                                  {extraParts.map(p => (
                                    <option key={p.id} value={p.id}>
                                      {p.name}
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
                                {formatCurrency(hw.totalPrice)}
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
                      <Button type="button" variant="outline" size="sm" onClick={syncFinishes}>
                        <ArrowUpDown className="h-4 w-4 mr-2" /> Sincronizar desde Muebles
                      </Button>
                    </div>
                  </div>
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50 text-[10px] uppercase font-bold">
                        <TableRow>
                          <TableHead>Acabado</TableHead>
                          <TableHead>Mueble Relacionado</TableHead>
                          <TableHead className="w-24 text-right">Precio Unit.</TableHead>
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
                                  value={f.finishId}
                                  onChange={(e) => updateFinishId(idx, Number(e.target.value))}
                                >
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
                              <TableCell className="text-sm text-right font-mono">
                                {finishData ? formatCurrency(Number(finishData.price)) : '-'}
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
                      <Button type="button" variant="outline" size="sm" onClick={syncLabor}>
                        <ArrowUpDown className="h-4 w-4 mr-2" /> Sincronizar desde Muebles
                      </Button>
                    </div>
                  </div>
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50 text-[10px] uppercase font-bold">
                        <TableRow>
                          <TableHead>Concepto Mano de Obra</TableHead>
                          <TableHead>Mueble Relacionado</TableHead>
                          <TableHead className="w-24 text-right">Precio Unit.</TableHead>
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
                                  value={l.laborId}
                                  onChange={(e) => updateLaborId(idx, Number(e.target.value))}
                                >
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
                              <TableCell className="text-sm text-right font-mono">
                                {laborData ? formatCurrency(Number(laborData.price)) : '-'}
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
                      <Button type="button" variant="outline" size="sm" onClick={syncAdditionalCosts}>
                        <ArrowUpDown className="h-4 w-4 mr-2" /> Sincronizar desde Muebles
                      </Button>
                    </div>
                  </div>
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50 text-[10px] uppercase font-bold">
                        <TableRow>
                          <TableHead>Concepto</TableHead>
                          <TableHead>Mueble Relacionado</TableHead>
                          <TableHead className="w-24 text-right">Precio Unit.</TableHead>
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
                                  value={c.additionalCostId}
                                  onChange={(e) => updateAdditionalCostId(idx, Number(e.target.value))}
                                >
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
                              <TableCell className="text-sm text-right font-mono">
                                {data ? formatCurrency(Number(data.price)) : '-'}
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
                <div className="flex items-center">Código <SortIcon columnKey="code" /></div>
              </TableHead>
              <TableHead className="cursor-pointer font-bold" onClick={() => requestSort('client.name')}>
                <div className="flex items-center">Cliente <SortIcon columnKey="client.name" /></div>
              </TableHead>
              <TableHead className="font-bold hidden md:table-cell">Descripción</TableHead>
              <TableHead className="cursor-pointer font-bold" onClick={() => requestSort('date')}>
                <div className="flex items-center">Fecha <SortIcon columnKey="date" /></div>
              </TableHead>
              <TableHead className="text-right font-bold">Items</TableHead>
              <TableHead className="text-right font-bold cursor-pointer" onClick={() => requestSort('pricePesos')}>
                <div className="flex items-center justify-end">Precio (ARS) <SortIcon columnKey="pricePesos" /></div>
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
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(quote.id)}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
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
