'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, FileText, Calendar, DollarSign, User, Armchair, Layers, Info, CheckCircle2, AlertCircle, X } from 'lucide-react'
import { QuoteInput, QuoteDetailInput, QuoteCostInput, createQuote, updateQuote, deleteQuote } from '@/app/actions/quote'

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
  status: number
  notes: string | null
  client: {
    name: string | null
  }
  details: QuoteDetail[]
  costs: QuoteCost[]
}

type QuoteCost = {
  id: string
  costId: number
  quantity: number
  unitPrice: number
  price: number
  isCost: number
  isExtraPart: number
}

type QuoteDetail = {
  id: string
  furnitureId: number
  quantity: number
  unitPrice: number
  price: number
  length: number
  width: number
  depth: number
  woodId?: number | null
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
}: QuotesClientProps) {
  const [quotes, setQuotes] = useState<Quote[]>(initialQuotes)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'items' | 'woods' | 'costs'>('basic')
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
    status: 1,
    notes: '',
    details: [],
    costs: [],
  })

  // Auto-calculate totals from details and costs
  useEffect(() => {
    const totalDetailsPrice = formData.details.reduce((acc, d) => acc + d.price, 0)
    const totalCostsPrice = formData.costs.reduce((acc, c) => acc + c.price, 0)
    setFormData(prev => ({
        ...prev,
        pricePesos: totalDetailsPrice + totalCostsPrice,
    }))
  }, [formData.details, formData.costs])

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

      const wood = woods.find(w => w.id === detail.woodId) || defaultWood
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

      furniture.parts.forEach((p: any) => {
        const partData = p.part
        if (!partData) return

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
          stats.piecesSurface += ((l * w) / 1000000) * quantity
          
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
      const boardSurface = (stats.boardLength * stats.boardWidth) / 1000000
      const boardsCount = Math.ceil((stats.piecesSurface * 1.15) / boardSurface) || 0
      const totalBoardsSurface = boardsCount * boardSurface
      
      const wasteSurface = stats.piecesSurface > 0 ? stats.piecesSurface * 0.15 : 0
      const newRemnantsSurface = Math.max(0, totalBoardsSurface - stats.piecesSurface - wasteSurface)

      return {
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
        grooveLength: 0
      }
    })
  }, [formData.details, furnitures, woods, defaultWood])

  useEffect(() => {
    const costDollars = formData.exchangeRate > 0 ? formData.costPesos / formData.exchangeRate : 0
    const priceDollars = formData.exchangeRate > 0 ? formData.pricePesos / formData.exchangeRate : 0
    
    setFormData(prev => {
        if (Math.abs(prev.costDollars - costDollars) < 0.01 && Math.abs(prev.priceDollars - priceDollars) < 0.01) return prev
        return {
            ...prev,
            costDollars: Number(costDollars.toFixed(2)),
            priceDollars: Number(priceDollars.toFixed(2)),
        }
    })
  }, [formData.costPesos, formData.pricePesos, formData.exchangeRate])

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
      status: 1,
      notes: '',
      details: [],
      costs: [],
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
        woodId: d.woodId
      })),
      costs: (quote.costs || []).map(c => ({
        id: c.id,
        costId: c.costId,
        quantity: c.quantity,
        unitPrice: c.unitPrice,
        price: c.price,
        isCost: c.isCost,
        isExtraPart: c.isExtraPart
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

    try {
      if (editingQuote) {
        const updated = await updateQuote(editingQuote.id, formData)
        setQuotes((prev) =>
          prev.map((q) => (q.id === editingQuote.id ? { ...updated, client: { name: clients.find(c => c.id === formData.clientId)?.name || null } } : q))
        )
      } else {
        const created = await createQuote(formData)
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
    // Buscar el primer mueble que no sea idéntico a uno ya agregado en sus medidas por defecto
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
          woodId: defaultWood?.id || null,
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
    
    // Auto-calculate price
    if ('unitPrice' in updates || 'quantity' in updates) {
      detail.price = detail.unitPrice * detail.quantity
    }
    
    // If furniture changes, pre-fill values
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

  const addCost = () => {
    setFormData({
      ...formData,
      costs: [
        ...formData.costs,
        {
          costId: costs[0]?.id || 0,
          quantity: 1,
          unitPrice: costs[0]?.price || 0,
          price: costs[0]?.price || 0,
          isCost: 1,
          isExtraPart: 0,
        }
      ]
    })
  }

  const removeCost = (index: number) => {
    setFormData({
      ...formData,
      costs: formData.costs.filter((_, i) => i !== index)
    })
  }

  const updateCost = (index: number, updates: Partial<QuoteCostInput>) => {
    const newCosts = [...formData.costs]
    const cost = { ...newCosts[index], ...updates }
    
    if ('unitPrice' in updates || 'quantity' in updates) {
      cost.price = cost.unitPrice * cost.quantity
    }
    
    if ('costId' in updates || 'isCost' in updates || 'isExtraPart' in updates) {
      let selectedItem: any = null
      if (cost.isExtraPart) {
        selectedItem = extraParts.find(e => e.id === cost.costId)
      } else if (cost.isCost) {
        selectedItem = costs.find(c => c.id === cost.costId)
        if (!selectedItem) selectedItem = laborCosts.find(c => c.id === cost.costId)
        if (!selectedItem) selectedItem = additionalCosts.find(c => c.id === cost.costId)
      }

      if (selectedItem) {
        cost.unitPrice = selectedItem.price || selectedItem.Valor || 0
        cost.price = cost.unitPrice * cost.quantity
      }
    }

    newCosts[index] = cost
    setFormData({ ...formData, costs: newCosts })
  }

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
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
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
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'woods' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                onClick={() => setActiveTab('woods')}
              >
                Maderas
              </button>
              <button 
                type="button"
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'costs' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                onClick={() => setActiveTab('costs')}
              >
                Costos y Extras
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
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
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="code" className="text-xs font-bold text-muted-foreground uppercase">Código</Label>
                          <Input id="code" className="h-9" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="date" className="text-xs font-bold text-muted-foreground uppercase">Fecha</Label>
                          <Input id="date" className="h-9" type="date" value={formData.date.toISOString().split('T')[0]} onChange={e => setFormData({...formData, date: new Date(e.target.value)})} required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description" className="text-xs font-bold text-muted-foreground uppercase">Descripción</Label>
                        <Input id="description" className="h-9" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="dateDelivery" className="text-xs font-bold text-muted-foreground uppercase">Fecha Entrega</Label>
                        <Input id="dateDelivery" className="h-9" type="date" value={formData.dateDelivery.toISOString().split('T')[0]} onChange={e => setFormData({...formData, dateDelivery: new Date(e.target.value)})} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="exchangeRate" className="text-xs font-bold text-muted-foreground uppercase text-primary">Tipo de Cambio (ARS/USD)</Label>
                        <Input id="exchangeRate" className="h-9" type="number" step="0.01" value={formData.exchangeRate} onChange={e => setFormData({...formData, exchangeRate: parseFloat(e.target.value) || 0})} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status" className="text-xs font-bold text-muted-foreground uppercase">Estado</Label>
                        <select
                          id="status"
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
                        >
                          {STATUS_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-muted-foreground uppercase">Costo ARS</Label>
                      <Input type="number" step="0.01" className="h-9" value={formData.costPesos} onChange={e => setFormData({...formData, costPesos: parseFloat(e.target.value) || 0})} required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-muted-foreground uppercase">Precio ARS</Label>
                      <Input type="number" step="0.01" className="h-9" value={formData.pricePesos} onChange={e => setFormData({...formData, pricePesos: parseFloat(e.target.value) || 0})} required />
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
                          <TableHead className="w-24">Madera</TableHead>
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
                                {furnitures.map(f => {
                                  // Solo se deshabilita si YA existe otra fila con el mismo mueble Y las mismas medidas exactas que el mueble por defecto.
                                  // Esto permite agregar el mismo mueble si la fila actual ya tiene medidas distintas, o si va a cambiar las medidas después.
                                  const isSelected = formData.details.some((d2, i2) => 
                                    i2 !== idx && 
                                    d2.furnitureId === f.id && 
                                    d2.length === f.length && 
                                    d2.width === f.width && 
                                    d2.depth === f.depth
                                  )
                                  return (
                                    <option key={f.id} value={f.id} disabled={isSelected}>
                                      [{f.code}] {f.name}
                                    </option>
                                  )
                                })}
                              </select>
                            </TableCell>
                            <TableCell>
                              <select 
                                className="w-full bg-transparent border-none focus:ring-0 text-xs font-medium"
                                value={detail.woodId || defaultWood?.id || ''} 
                                onChange={e => updateDetail(idx, { woodId: parseInt(e.target.value) || null })}
                              >
                                {woods.map(w => (
                                  <option key={w.id} value={w.id}>
                                    {w.name}
                                  </option>
                                ))}
                              </select>
                            </TableCell>
                            <TableCell>
                              <Input type="number" className="h-8 text-center" value={detail.quantity} onChange={e => updateDetail(idx, { quantity: parseInt(e.target.value) || 1 })} />
                            </TableCell>
                            <TableCell>
                                <div className="flex gap-1 text-[10px] font-mono">
                                    <Input type="number" className="h-7 w-14 px-1 text-center" value={detail.length} onChange={e => updateDetail(idx, { length: parseInt(e.target.value) || 0 })} />
                                    <span>x</span>
                                    <Input type="number" className="h-7 w-14 px-1 text-center" value={detail.width} onChange={e => updateDetail(idx, { width: parseInt(e.target.value) || 0 })} />
                                    <span>x</span>
                                    <Input type="number" className="h-7 w-14 px-1 text-center" value={detail.depth} onChange={e => updateDetail(idx, { depth: parseInt(e.target.value) || 0 })} />
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
                          {/* Fila 0 */}
                          <div className="p-2 font-medium bg-primary/10">Madera Usada:</div>
                          <div className="p-2 text-left col-span-3 font-bold text-primary bg-primary/5">{stats.woodName}</div>

                          {/* Fila 1 */}
                          <div className="p-2 font-medium bg-muted/10">Tamaño del tablero</div>
                          <div className="p-2 text-right">{stats.boardSize}</div>
                          <div className="p-2 font-medium bg-muted/10">Cantidad de Piezas:</div>
                          <div className="p-2 text-right">{stats.piecesCount}</div>

                          {/* Fila 2 */}
                          <div className="p-2 font-medium bg-muted/10">Cantidad de tableros:</div>
                          <div className="p-2 text-right font-bold">{stats.boardsCount}</div>
                          <div className="p-2 font-medium bg-muted/10">Superficie de las piezas:</div>
                          <div className="p-2 text-right">{stats.piecesSurface.toFixed(3)} sq.m.</div>

                          {/* Fila 3 */}
                          <div className="p-2 font-medium bg-muted/10">Superficie del Tablero:</div>
                          <div className="p-2 text-right">{stats.boardSurface.toFixed(3)} sq.m.</div>
                          <div className="p-2 font-medium bg-muted/10">Superficie de nuevos remanentes:</div>
                          <div className="p-2 text-right">{stats.newRemnantsSurface.toFixed(3)} sq.m.</div>

                          {/* Fila 4 */}
                          <div className="p-2 font-medium bg-muted/10">Superficie tableros:</div>
                          <div className="p-2 text-right">{stats.totalBoardsSurface.toFixed(3)} sq.m.</div>
                          <div className="p-2 font-medium bg-muted/10">Superficie de desperdicio:</div>
                          <div className="p-2 text-right">{stats.wasteSurface.toFixed(3)} sq.m.</div>

                          {/* Fila 5 */}
                          <div className="p-2 font-medium bg-muted/10">Cantidad de remanentes usados:</div>
                          <div className="p-2 text-right">{stats.usedRemnantsCount}</div>
                          <div className="p-2 font-medium bg-muted/10">Largo de bordes - 2:</div>
                          <div className="p-2 text-right">{stats.edges2Length.toFixed(1)} m.</div>

                          {/* Fila 6 */}
                          <div className="p-2 font-medium bg-muted/10">Superficie de remanentes usados:</div>
                          <div className="p-2 text-right">{stats.usedRemnantsSurface} sq.m.</div>
                          <div className="p-2 font-medium bg-muted/10">Largo de bordes - 0.4:</div>
                          <div className="p-2 text-right">{stats.edges04Length.toFixed(1)} m.</div>

                          {/* Fila 7 */}
                          <div className="p-2 font-medium bg-muted/10">Distancia total cortada:</div>
                          <div className="p-2 text-right">{stats.totalCutDistance.toFixed(1)} m.</div>
                          <div className="p-2 font-medium bg-muted/10">Largo de surcos:</div>
                          <div className="p-2 text-right">{stats.grooveLength} m.</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'costs' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Costos y Extras</h3>
                    <Button type="button" onClick={addCost} variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" /> Agregar Costo
                    </Button>
                  </div>
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50 text-[10px] uppercase font-bold">
                        <TableRow>
                          <TableHead className="w-32">Tipo</TableHead>
                          <TableHead>Concepto</TableHead>
                          <TableHead className="w-20">Cant.</TableHead>
                          <TableHead>Precio Unit.</TableHead>
                          <TableHead>Subtotal</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.costs.map((cost, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <select 
                                className="w-full bg-transparent border-none focus:ring-0 text-xs font-medium"
                                value={cost.isExtraPart ? 'extraPart' : 'cost'}
                                onChange={e => {
                                  const val = e.target.value
                                  if (val === 'extraPart') {
                                    updateCost(idx, { isExtraPart: 1, isCost: 0, costId: extraParts[0]?.id || 0 })
                                  } else {
                                    updateCost(idx, { isExtraPart: 0, isCost: 1, costId: costs[0]?.id || 0 })
                                  }
                                }}
                              >
                                <option value="cost">Costo / Terminación</option>
                                <option value="extraPart">Pieza Extra</option>
                              </select>
                            </TableCell>
                            <TableCell>
                              <select 
                                className="w-full bg-transparent border-none focus:ring-0 text-xs"
                                value={cost.costId || ''} 
                                onChange={e => updateCost(idx, { costId: parseInt(e.target.value) || 0 })}
                              >
                                {cost.isExtraPart ? (
                                  extraParts.map(e => <option key={e.id} value={e.id}>{e.name}</option>)
                                ) : (
                                  <>
                                    <optgroup label="Terminaciones / Costos">
                                      {costs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </optgroup>
                                    <optgroup label="Mano de Obra">
                                      {laborCosts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </optgroup>
                                    <optgroup label="Costos Adicionales">
                                      {additionalCosts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </optgroup>
                                  </>
                                )}
                              </select>
                            </TableCell>
                            <TableCell>
                              <Input type="number" className="h-8 text-center" value={cost.quantity} onChange={e => updateCost(idx, { quantity: parseFloat(e.target.value) || 1 })} />
                            </TableCell>
                            <TableCell>
                              <Input type="number" step="0.01" className="h-8 w-24" value={cost.unitPrice} onChange={e => updateCost(idx, { unitPrice: parseFloat(e.target.value) || 0 })} />
                            </TableCell>
                            <TableCell className="text-xs font-bold text-primary whitespace-nowrap">
                              {formatCurrency(cost.price)}
                            </TableCell>
                            <TableCell>
                              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => removeCost(idx)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {formData.costs.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm italic">
                              No hay costos agregados.
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
