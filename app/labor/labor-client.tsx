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
import { createLaborCost, updateLaborCost, deleteLaborCost, LaborCostInput } from '@/app/actions/labor'

type LaborCostUI = {
  id: string | number
  name: string
  price: number
  dateUpd: Date
}

interface LaborClientProps {
  initialItems: LaborCostUI[]
}

export function LaborClient({ initialItems }: LaborClientProps) {
  const [items, setItems] = useState<LaborCostUI[]>(initialItems)
  const [isOpen, setIsOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<LaborCostUI | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [sortConfig, setSortConfig] = useState<{ key: keyof LaborCostUI; direction: 'asc' | 'desc' } | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  
  const [formData, setFormData] = useState<LaborCostInput>({
    name: '',
    price: 0,
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
    })
  }

  const handleEdit = (item: LaborCostUI) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      price: item.price,
    })
    setIsOpen(true)
  }

  const handleDelete = async (id: number | string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este costo de mano de obra?')) return
    
    try {
      await deleteLaborCost(id)
      setItems(items.filter(i => i.id !== id))
    } catch (error) {
      console.error('Error deleting labor cost:', error)
      alert('Error al eliminar el costo de mano de obra')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPending(true)
    
    try {
      if (editingItem) {
        const updated = await updateLaborCost(editingItem.id, formData)
        setItems(items.map(i => i.id === updated.id ? updated : i))
      } else {
        const created = await createLaborCost(formData)
        setItems([created, ...items])
      }
      setIsOpen(false)
      resetForm()
      setEditingItem(null)
    } catch (error) {
      console.error('Error saving labor cost:', error)
      alert('Error al guardar el costo de mano de obra')
    } finally {
      setIsPending(false)
    }
  }

  const requestSort = (key: keyof LaborCostUI) => {
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
    if (aValue === null) return 1
    if (bValue === null) return -1
    if (aValue < bValue) return direction === 'asc' ? -1 : 1
    if (aValue > bValue) return direction === 'asc' ? 1 : -1
    return 0
  })

  const SortIcon = ({ columnKey }: { columnKey: keyof LaborCostUI }) => {
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

  const getReminder = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const updateDate = new Date(date)
    updateDate.setHours(0, 0, 0, 0)
    
    const diffTime = Math.abs(today.getTime() - updateDate.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays <= 5) return { label: 'Vió', color: 'bg-green-100 text-green-700 border-green-200' }
    if (diffDays <= 14) return { label: 'Revisó', color: 'bg-[#795548] text-white border-[#5d4037]' }
    if (diffDays <= 28) return { label: 'Olvidó', color: 'bg-orange-100 text-orange-700 border-orange-200' }
    if (diffDays <= 38) return { label: 'Cambiar', color: 'bg-red-100 text-red-700 border-red-200' }
    return { label: 'Pendiente', color: 'bg-blue-100 text-blue-700 border-blue-200' }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative flex w-full max-w-sm items-center">
          <Input 
            placeholder="Buscar mano de obra..." 
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
                <Plus className="mr-2 h-4 w-4" /> Agregar Mano de Obra
              </Button>
            }
          />
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Editar Mano de Obra' : 'Agregar Mano de Obra'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Precio ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              
              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Guardando...' : 'Guardar'}
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
              <TableHead className="cursor-pointer hover:text-primary transition-colors font-bold" onClick={() => requestSort('name')}>
                <div className="flex items-center">Nombre <SortIcon columnKey="name" /></div>
              </TableHead>
              <TableHead className="cursor-pointer hover:text-primary transition-colors font-bold text-right w-32" onClick={() => requestSort('price')}>
                <div className="flex items-center justify-end">Precio <SortIcon columnKey="price" /></div>
              </TableHead>
              <TableHead className="cursor-pointer hover:text-primary transition-colors font-bold w-32" onClick={() => requestSort('dateUpd')}>
                <div className="flex items-center">ÚIt. Actualiz. <SortIcon columnKey="dateUpd" /></div>
              </TableHead>
              <TableHead className="font-bold w-24">Recordatorio</TableHead>
              <TableHead className="text-right font-bold w-20">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No se encontró mano de obra.
                </TableCell>
              </TableRow>
            ) : (
              paginatedItems.map((item) => {
                const reminder = getReminder(item.dateUpd)
                return (
                  <TableRow key={item.id} className="hover:bg-muted/50 transition-colors text-xs">
                    <TableCell className="font-medium py-2">{item.name}</TableCell>
                    <TableCell className="text-right font-semibold text-primary py-2 whitespace-nowrap">$ {item.price.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</TableCell>
                    <TableCell className="py-2">{new Date(item.dateUpd).toLocaleDateString('es-AR')}</TableCell>
                    <TableCell className="py-2">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${reminder.color}`}>
                        {reminder.label}
                      </span>
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
                )
              })
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
