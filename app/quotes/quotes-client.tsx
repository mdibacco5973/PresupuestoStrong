'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, FileText, Calendar, DollarSign, User, Armchair, Layers, Info, CheckCircle2, AlertCircle, X } from 'lucide-react'
import { QuoteInput, QuoteDetailInput, createQuote, updateQuote, deleteQuote } from '@/app/actions/quote'

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
  furniture: {
    name: string
    code: string
  }
}

interface QuotesClientProps {
  initialQuotes: Quote[]
  clients: any[]
  furnitures: any[]
}

const STATUS_OPTIONS = [
  { value: 1, label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  { value: 2, label: 'Aprobado', color: 'bg-green-100 text-green-700' },
  { value: 3, label: 'Rechazado', color: 'bg-red-100 text-red-700' },
  { value: 4, label: 'Finalizado', color: 'bg-blue-100 text-blue-700' },
]

export function QuotesClient({ initialQuotes, clients, furnitures }: QuotesClientProps) {
  const [quotes, setQuotes] = useState<Quote[]>(initialQuotes)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'items'>('basic')
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
  })

  // Auto-calculate totals from details
  useEffect(() => {
    const totalDetailsPrice = formData.details.reduce((acc, d) => acc + d.price, 0)
    setFormData(prev => ({
        ...prev,
        pricePesos: totalDetailsPrice,
    }))
  }, [formData.details])

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
      })),
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
    const firstFurniture = furnitures[0]
    setFormData({
      ...formData,
      details: [
        ...formData.details,
        {
          furnitureId: firstFurniture?.id || 0,
          quantity: 1,
          unitPrice: firstFurniture?.furnitureTotal || 0,
          price: firstFurniture?.furnitureTotal || 0,
          length: firstFurniture?.length || 0,
          width: firstFurniture?.width || 0,
          depth: firstFurniture?.depth || 0,
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
                                {furnitures.map(f => <option key={f.id} value={f.id}>[{f.code}] {f.name}</option>)}
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
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm italic">
                              No hay muebles agregados a este presupuesto.
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
