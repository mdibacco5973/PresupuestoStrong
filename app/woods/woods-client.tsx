'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { WoodInput, createWood, updateWood, deleteWood } from '@/app/actions/wood'

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
} from '@/components/ui/dialog'

type WoodWithNumberPrice = {
  id: number
  name: string
  thickness: number | null
  length: number | null
  width: number | null
  price: number
  isBack: boolean
  isDrawer: boolean
  surfaceArea: number
  isDefaultWood: boolean
  dateUpd: Date
}

interface WoodsClientProps {
  initialWoods: WoodWithNumberPrice[]
}

export function WoodsClient({ initialWoods }: WoodsClientProps) {
  const [woods, setWoods] = useState<WoodWithNumberPrice[]>(initialWoods)
  const [sortConfig, setSortConfig] = useState<{ key: keyof WoodWithNumberPrice; direction: 'asc' | 'desc' } | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [editingWood, setEditingWood] = useState<WoodWithNumberPrice | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const requestSort = (key: keyof WoodWithNumberPrice) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const sortedWoods = [...woods].sort((a, b) => {
    if (!sortConfig) return 0
    const { key, direction } = sortConfig
    
    let aValue = a[key]
    let bValue = b[key]

    if (aValue === null) return 1
    if (bValue === null) return -1
    if (aValue < bValue) return direction === 'asc' ? -1 : 1
    if (aValue > bValue) return direction === 'asc' ? 1 : -1
    return 0
  })

  const SortIcon = ({ columnKey }: { columnKey: keyof WoodWithNumberPrice }) => {
    if (sortConfig?.key !== columnKey) return <ArrowUpDown className="ml-2 h-4 w-4" />
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="ml-2 h-4 w-4 text-primary" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4 text-primary" />
    )
  }

  const filteredWoods = sortedWoods.filter(wood => {
    const searchLower = searchTerm.toLowerCase()
    return (
      wood.name.toLowerCase().includes(searchLower) ||
      (wood.thickness?.toString() || '').includes(searchLower) ||
      (wood.length?.toString() || '').includes(searchLower) ||
      (wood.width?.toString() || '').includes(searchLower) ||
      wood.price.toString().includes(searchLower)
    )
  })

  const totalPages = Math.ceil(filteredWoods.length / itemsPerPage)
  const paginatedWoods = filteredWoods.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])


  const [formData, setFormData] = useState<WoodInput>({
    name: '',
    thickness: null,
    length: null,
    width: null,
    price: 0,
    isBack: false,
    isDrawer: false,
    surfaceArea: 0,
    isDefaultWood: false,
  })

  useEffect(() => {
    const area = (formData.length || 0) * (formData.width || 0)
    if (area !== formData.surfaceArea) {
      setFormData(prev => ({ ...prev, surfaceArea: area }))
    }
  }, [formData.length, formData.width, formData.surfaceArea])

  const resetForm = () => {
    setFormData({
      name: '',
      thickness: null,
      length: null,
      width: null,
      price: 0,
      isBack: false,
      isDrawer: false,
      surfaceArea: 0,
      isDefaultWood: false,
    })
    setEditingWood(null)
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) resetForm()
  }

  const handleEdit = (wood: WoodWithNumberPrice) => {
    setEditingWood(wood)
    setFormData({
      name: wood.name,
      thickness: wood.thickness,
      length: wood.length,
      width: wood.width,
      price: wood.price,
      isBack: wood.isBack,
      isDrawer: wood.isDrawer,
      surfaceArea: wood.surfaceArea,
      isDefaultWood: wood.isDefaultWood,
    })
    setIsOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this wood?')) return
    setIsLoading(true)
    try {
      await deleteWood(id)
      setWoods((prev) => prev.filter((w) => w.id !== id))
    } catch (error) {
      console.error(error)
      alert('Error deleting wood')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (editingWood) {
        const updated = await updateWood(editingWood.id, formData)
        setWoods((prev) =>
          prev.map((w) => {
            if (updated.isDefaultWood && w.id !== updated.id) {
              return { ...w, isDefaultWood: false }
            }
            return w.id === editingWood.id
              ? { ...updated, price: Number(updated.price), surfaceArea: Number(updated.surfaceArea) }
              : w
          })
        )
      } else {
        const created = await createWood(formData)
        setWoods((prev) => {
          const newList = [{ ...created, price: Number(created.price), surfaceArea: Number(created.surfaceArea) }, ...prev]
          if (created.isDefaultWood) {
            return newList.map(w => w.id !== created.id ? { ...w, isDefaultWood: false } : w)
          }
          return newList
        })
      }
      setIsOpen(false)
      resetForm()
    } catch (error) {
      console.error(error)
      alert('Error saving wood')
    } finally {
      setIsLoading(false)
    }
  }

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
        <div className="relative w-72">
          <Input 
            placeholder="Buscar maderas..." 
            className="max-w-sm" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger
            render={
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" /> Agregar Madera
              </Button>
            }
          />
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingWood ? 'Editar Madera' : 'Agregar Madera'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="thickness">Espesor (mm)</Label>
                  <Input
                    id="thickness"
                    type="number"
                    value={formData.thickness || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        thickness: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Precio ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="length">Largo (mm)</Label>
                  <Input
                    id="length"
                    type="number"
                    value={formData.length || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        length: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="width">Ancho (mm)</Label>
                  <Input
                    id="width"
                    type="number"
                    value={formData.width || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        width: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="surfaceArea">Superficie (mm²)</Label>
                  <Input
                    id="surfaceArea"
                    type="number"
                    value={formData.surfaceArea}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isDefaultWood"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={formData.isDefaultWood}
                      onChange={(e) => {
                        const isChecked = e.target.checked
                        if (isChecked) {
                          const existingDefault = woods.find(w => w.isDefaultWood && w.id !== editingWood?.id)
                          if (existingDefault) {
                            if (!confirm(`La madera "${existingDefault.name}" ya está marcada como predeterminada. ¿Deseas cambiarla por esta?`)) {
                              return
                            }
                          }
                        }
                        setFormData({ ...formData, isDefaultWood: isChecked })
                      }}
                    />
                    <Label htmlFor="isDefaultWood">Por Defecto</Label>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4 pt-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isBack"
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={formData.isBack}
                    onChange={(e) => setFormData({ ...formData, isBack: e.target.checked })}
                  />
                  <Label htmlFor="isBack">Es Fondo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isDrawer"
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={formData.isDrawer}
                    onChange={(e) => setFormData({ ...formData, isDrawer: e.target.checked })}
                  />
                  <Label htmlFor="isDrawer">Es Cajón</Label>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Guardando...' : editingWood ? 'Actualizar' : 'Guardar'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>

          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead 
                className="cursor-pointer hover:text-primary transition-colors font-bold"
                onClick={() => requestSort('name')}
              >
                <div className="flex items-center">
                  Nombre <SortIcon columnKey="name" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:text-primary transition-colors font-bold"
                onClick={() => requestSort('thickness')}
              >
                <div className="flex items-center">
                  Espesor <SortIcon columnKey="thickness" />
                </div>
              </TableHead>
              <TableHead className="font-bold">Dimensiones (L x A)</TableHead>
              <TableHead 
                className="cursor-pointer hover:text-primary transition-colors font-bold"
                onClick={() => requestSort('price')}
              >
                <div className="flex items-center">
                  Precio <SortIcon columnKey="price" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:text-primary transition-colors font-bold"
                onClick={() => requestSort('surfaceArea')}
              >
                <div className="flex items-center">
                  Superficie <SortIcon columnKey="surfaceArea" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:text-primary transition-colors font-bold"
                onClick={() => requestSort('dateUpd')}
              >
                <div className="flex items-center">
                  Recordatorio <SortIcon columnKey="dateUpd" />
                </div>
              </TableHead>
              <TableHead className="text-right font-bold">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedWoods.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  No se encontraron maderas.
                </TableCell>
              </TableRow>
            ) : (
              paginatedWoods.map((wood) => (
                <TableRow key={wood.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">{wood.name}</TableCell>
                  <TableCell>
                    {wood.thickness ? `${wood.thickness} mm` : '-'}
                    {wood.isBack && <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full uppercase">Fondo</span>}
                    {wood.isDrawer && <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full uppercase">Cajón</span>}
                  </TableCell>
                  <TableCell>
                    {wood.length && wood.width ? `${wood.length} x ${wood.width} mm` : '-'}
                  </TableCell>
                  <TableCell className="font-semibold text-primary">
                    $ {wood.price.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    {wood.surfaceArea.toLocaleString('es-AR')} mm²
                    {wood.isDefaultWood && <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full uppercase font-bold">Defecto</span>}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const reminder = getReminder(wood.dateUpd)
                      return (
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${reminder.color}`}>
                          {reminder.label}
                        </span>
                      )
                    })()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(wood)}
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(wood.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-4 border-t bg-muted/20">
            <div className="text-sm text-muted-foreground">
              Mostrando {Math.min(filteredWoods.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(filteredWoods.length, currentPage * itemsPerPage)} de {filteredWoods.length}
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
