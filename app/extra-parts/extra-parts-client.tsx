'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react'
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
  id: number
  name: string
  price: number
  isHardwareStore: boolean
  isAccessory: boolean
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
    if (aValue === null) return 1
    if (bValue === null) return -1
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
      item.price.toString().includes(searchLower) ||
      (item.isHardwareStore && 'ferretería'.includes(searchLower)) ||
      (item.isAccessory && 'accesorio'.includes(searchLower))
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
    isHardwareStore: false,
    isAccessory: false,
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
      isHardwareStore: false,
      isAccessory: false,
    })
  }

  const handleEdit = (item: ExtraPartUI) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      price: item.price,
      isHardwareStore: item.isHardwareStore,
      isAccessory: item.isAccessory,
    })
    setIsOpen(true)
  }

  const handleDelete = async (id: number) => {
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

  const FlagBadge = ({ active, label }: { active: boolean, label: string }) => {
    if (!active) return null
    return (
      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
        {label}
      </span>
    )
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
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input 
            placeholder="Buscar herrajes..." 
            className="max-w-sm" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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
              
              <div className="space-y-4 border rounded-md p-4 bg-muted/50">
                <h4 className="font-medium text-sm">Categoría</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isHardwareStore"
                      checked={formData.isHardwareStore}
                      onChange={e => setFormData({ ...formData, isHardwareStore: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="isHardwareStore" className="font-normal cursor-pointer">Ferretería</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isAccessory"
                      checked={formData.isAccessory}
                      onChange={e => setFormData({ ...formData, isAccessory: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="isAccessory" className="font-normal cursor-pointer">Accesorio</Label>
                  </div>
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
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:text-primary transition-colors"
                onClick={() => requestSort('name')}
              >
                <div className="flex items-center">
                  Nombre <SortIcon columnKey="name" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:text-primary transition-colors"
                onClick={() => requestSort('price')}
              >
                <div className="flex items-center">
                  Precio <SortIcon columnKey="price" />
                </div>
              </TableHead>
              <TableHead>Atributos</TableHead>
              <TableHead>Recordatorio</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No se encontraron herrajes.
                </TableCell>
              </TableRow>
            ) : (
              paginatedItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>$ {item.price.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <FlagBadge active={item.isHardwareStore} label="Ferretería" />
                      <FlagBadge active={item.isAccessory} label="Accesorio" />
                    </div>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const reminder = getReminder(item.dateUpd)
                      return (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${reminder.color}`}>
                          {reminder.label}
                        </span>
                      )
                    })()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(item)}
                      className="h-8 w-8 mr-2"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(item.id)}
                      className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
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
