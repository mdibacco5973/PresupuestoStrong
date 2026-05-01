'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, X } from 'lucide-react'
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
import { createExtraPart, updateExtraPart, deleteExtraPart, ExtraPartInput } from '@/app/actions/extra-part'

type ExtraPartUI = {
  id: string | number
  name: string
  price: number
  code?: string | null
  quantity?: number
  unitMeasure?: string | null
  totalPrice?: number
  dateUpd: Date
}

interface ExtraPartsClientProps {
  initialItems: ExtraPartUI[]
}

export function ExtraPartsClient({ initialItems }: ExtraPartsClientProps) {
  const [items, setItems] = useState<ExtraPartUI[]>(initialItems)
  const [isOpen, setIsOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ExtraPartUI | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [sortConfig, setSortConfig] = useState<{ key: keyof ExtraPartUI; direction: 'asc' | 'desc' } | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const requestSort = (key: keyof ExtraPartUI) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const sortedItems = [...items].sort((a, b) => {
    if (!sortConfig) return 0
    const { key, direction } = sortConfig
    const aValue = a[key]
    const bValue = b[key]
    if (aValue === null || aValue === undefined) return 1
    if (bValue === null || bValue === undefined) return -1
    if (aValue < bValue) return direction === 'asc' ? -1 : 1
    if (aValue > bValue) return direction === 'asc' ? 1 : -1
    return 0
  })

  const SortIcon = ({ columnKey }: { columnKey: keyof ExtraPartUI }) => {
    if (sortConfig?.key !== columnKey) return <ArrowUpDown className="ml-2 h-4 w-4" />
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="ml-2 h-4 w-4 text-primary" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4 text-primary" />
    )
  }

  const filteredItems = sortedItems.filter(item => {
    const searchLower = searchTerm.toLowerCase()
    return (
      item.name.toLowerCase().includes(searchLower) ||
      item.price.toString().includes(searchLower)
    )
  })

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])
  
  const [formData, setFormData] = useState<ExtraPartInput>({
    name: '',
    price: 0,
    code: '',
    quantity: 0,
    unitMeasure: 'un',
    totalPrice: 0,
  })

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setEditingItem(null)
      resetForm()
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      price: 0,
      code: '',
      quantity: 0,
      unitMeasure: 'un',
      totalPrice: 0,
    })
  }

  const handleEdit = (item: ExtraPartUI) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      price: item.price,
      code: item.code || '',
      quantity: item.quantity || 0,
      unitMeasure: item.unitMeasure || 'un',
      totalPrice: item.totalPrice || 0,
    })
    setIsOpen(true)
  }

  const handleDelete = async (id: number | string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este herraje?')) return
    
    try {
      await deleteExtraPart(id)
      setItems(items.filter(i => i.id !== id))
    } catch (error) {
      console.error('Error deleting extra part:', error)
      alert('Error al eliminar el herraje')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPending(true)
    
    try {
      if (editingItem) {
        const updated = await updateExtraPart(editingItem.id, formData)
        setItems(items.map(i => i.id === updated.id ? updated : i))
      } else {
        const created = await createExtraPart(formData)
        setItems([created, ...items])
      }
      setIsOpen(false)
      resetForm()
      setEditingItem(null)
    } catch (error) {
      console.error('Error saving extra part:', error)
      alert('Error al guardar el herraje')
    } finally {
      setIsPending(false)
    }
  }



  const getReminder = (date: Date) => {
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays <= 7) return { label: 'Vió', color: 'bg-green-100 text-green-800 border-green-200' }
    if (diffDays <= 15) return { label: 'Revisó', color: 'bg-blue-100 text-blue-800 border-blue-200' }
    if (diffDays <= 30) return { label: 'Olvidó', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
    return { label: 'Dormido', color: 'bg-red-100 text-red-800 border-red-200' }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative flex w-full max-w-sm items-center">
          <Input 
            placeholder="Buscar herrajes..." 
            className="max-w-sm pr-8" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-transparent"
              onClick={() => setSearchTerm('')}
              title="Borrar búsqueda"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger
            render={
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" /> Agregar Herraje
              </Button>
            }
          />
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Editar Herraje' : 'Agregar Herraje'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Código</Label>
                  <Input
                    id="code"
                    value={formData.code || ''}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitMeasure">U.M.</Label>
                  <Input
                    id="unitMeasure"
                    value={formData.unitMeasure || ''}
                    onChange={e => setFormData({ ...formData, unitMeasure: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Cantidad</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={e => {
                      const qty = parseInt(e.target.value) || 0
                      setFormData({ ...formData, quantity: qty, totalPrice: qty * formData.price })
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Precio Unit.</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={e => {
                      const price = parseFloat(e.target.value) || 0
                      setFormData({ ...formData, price, totalPrice: (formData.quantity || 0) * price })
                    }}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalPrice">Precio Total</Label>
                  <Input
                    id="totalPrice"
                    type="number"
                    step="0.01"
                    value={formData.totalPrice}
                    onChange={e => setFormData({ ...formData, totalPrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              


              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Guardando...' : 'Guardar Herraje'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 text-xs">
              <TableHead className="cursor-pointer hover:text-primary transition-colors font-bold w-24" onClick={() => requestSort('code')}>
                <div className="flex items-center">Código <SortIcon columnKey="code" /></div>
              </TableHead>
              <TableHead className="cursor-pointer hover:text-primary transition-colors font-bold" onClick={() => requestSort('name')}>
                <div className="flex items-center">Nombre <SortIcon columnKey="name" /></div>
              </TableHead>
              <TableHead className="font-bold text-center w-16">Cant.</TableHead>
              <TableHead className="font-bold w-16 text-center">U.M.</TableHead>
              <TableHead className="cursor-pointer hover:text-primary transition-colors font-bold text-right w-28" onClick={() => requestSort('price')}>
                <div className="flex items-center justify-end">P. Unit. <SortIcon columnKey="price" /></div>
              </TableHead>
              <TableHead className="cursor-pointer hover:text-primary transition-colors font-bold text-right w-28" onClick={() => requestSort('totalPrice' as any)}>
                <div className="flex items-center justify-end">P. Total <SortIcon columnKey={'totalPrice' as any} /></div>
              </TableHead>

              <TableHead className="font-bold w-24">Recordatorio</TableHead>
              <TableHead className="text-right font-bold w-20">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  No se encontraron herrajes.
                </TableCell>
              </TableRow>
            ) : (
              paginatedItems.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono text-[11px]">{item.code || '-'}</TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-center">{item.quantity || 0}</TableCell>
                  <TableCell className="text-center text-xs text-muted-foreground">{item.unitMeasure || '-'}</TableCell>
                  <TableCell className="text-right font-mono">
                    {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(item.price)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-primary">
                    {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(item.totalPrice || 0)}
                  </TableCell>

                  <TableCell className="py-2">
                    {(() => {
                      const reminder = getReminder(item.dateUpd)
                      return (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${reminder.color}`}>
                          {reminder.label}
                        </span>
                      )
                    })()}
                  </TableCell>
                  <TableCell className="text-right py-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} className="h-8 w-8 mr-1">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-4 border-t bg-muted/20">
            <div className="text-sm text-muted-foreground">
              Mostrando {Math.min(filteredItems.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(filteredItems.length, currentPage * itemsPerPage)} de {filteredItems.length}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
              </Button>
              <div className="text-sm font-medium">
                Página {currentPage} de {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
