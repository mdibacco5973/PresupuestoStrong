'use client'

import { useState, useEffect } from 'react'
import { Part } from '@prisma/client'
import { Plus, Pencil, Trash2, Check, X, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react'
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
import { createPart, updatePart, deletePart, PartInput } from '@/app/actions/part'

interface PartsClientProps {
  initialParts: Part[]
}

export function PartsClient({ initialParts }: PartsClientProps) {
  const [parts, setParts] = useState<Part[]>(initialParts)
  const [sortConfig, setSortConfig] = useState<{ key: keyof Part; direction: 'asc' | 'desc' } | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [editingPart, setEditingPart] = useState<Part | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const requestSort = (key: keyof Part) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const sortedParts = [...parts].sort((a, b) => {
    if (!sortConfig) return 0
    const { key, direction } = sortConfig
    const aValue = a[key]
    const bValue = b[key]
    
    if (aValue === null) return 1
    if (bValue === null) return -1
    
    // Type casting for comparison if needed, but strings/numbers work fine
    if (aValue < bValue) return direction === 'asc' ? -1 : 1
    if (aValue > bValue) return direction === 'asc' ? 1 : -1
    return 0
  })

  const SortIcon = ({ columnKey }: { columnKey: keyof Part }) => {
    if (sortConfig?.key !== columnKey) return <ArrowUpDown className="ml-2 h-4 w-4" />
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="ml-2 h-4 w-4 text-primary" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4 text-primary" />
    )
  }

  const filteredParts = sortedParts.filter(part => {
    const searchLower = searchTerm.toLowerCase()
    return (
      part.name.toLowerCase().includes(searchLower) ||
      (part.isEdges && 'cantos'.includes(searchLower)) ||
      (part.isCabinetWood && 'cuerpo'.includes(searchLower)) ||
      (part.isBaseCabinetWood && 'bajo mesada'.includes(searchLower)) ||
      (part.isWallCabinetWood && 'alacena'.includes(searchLower)) ||
      (part.isBackPanel && 'fondo'.includes(searchLower)) ||
      (part.isDrawer && 'cajón'.includes(searchLower)) ||
      (part.isLacquered && 'laqueado'.includes(searchLower))
    )
  })

  const totalPages = Math.ceil(filteredParts.length / itemsPerPage)
  const paginatedParts = filteredParts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])
  
  const [formData, setFormData] = useState<PartInput>({
    name: '',
    isEdges: false,
    isCabinetWood: false,
    isBaseCabinetWood: false,
    isWallCabinetWood: false,
    isBackPanel: false,
    isDrawer: false,
    isLacquered: false,
    formulaLength: '',
    formulaWidth: '',
  })

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setEditingPart(null)
      resetForm()
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      isEdges: false,
      isCabinetWood: false,
      isBaseCabinetWood: false,
      isWallCabinetWood: false,
      isBackPanel: false,
      isDrawer: false,
      isLacquered: false,
      formulaLength: '',
      formulaWidth: '',
    })
  }

  const handleEdit = (part: Part) => {
    setEditingPart(part)
    setFormData({
      name: part.name,
      isEdges: part.isEdges,
      isCabinetWood: part.isCabinetWood,
      isBaseCabinetWood: part.isBaseCabinetWood,
      isWallCabinetWood: part.isWallCabinetWood,
      isBackPanel: part.isBackPanel,
      isDrawer: part.isDrawer,
      isLacquered: part.isLacquered,
      formulaLength: part.formulaLength || '',
      formulaWidth: part.formulaWidth || '',
    })
    setIsOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this part?')) return
    
    try {
      await deletePart(id)
      setParts(parts.filter(p => p.id !== id))
    } catch (error) {
      console.error('Error deleting part:', error)
      alert('Failed to delete part')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPending(true)
    
    try {
      if (editingPart) {
        const updated = await updatePart(editingPart.id, formData)
        setParts(parts.map(p => p.id === updated.id ? updated : p))
      } else {
        const created = await createPart(formData)
        setParts([created, ...parts])
      }
      setIsOpen(false)
      resetForm()
      setEditingPart(null)
    } catch (error) {
      console.error('Error saving part:', error)
      alert('Failed to save part')
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative flex w-full max-w-sm items-center">
          <Input 
            placeholder="Buscar piezas..." 
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
                <Plus className="mr-2 h-4 w-4" /> Agregar Pieza
              </Button>
            }
          />
          <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPart ? 'Edit Part' : 'Add Part'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="formulaLength">Fórmula Longitud (L)</Label>
                  <Input
                    id="formulaLength"
                    placeholder="Ej: L - 20"
                    value={formData.formulaLength || ''}
                    onChange={e => setFormData({ ...formData, formulaLength: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="formulaWidth">Fórmula Ancho (D)</Label>
                  <Input
                    id="formulaWidth"
                    placeholder="Ej: P - 20"
                    value={formData.formulaWidth || ''}
                    onChange={e => setFormData({ ...formData, formulaWidth: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="text-[10px] text-muted-foreground bg-muted p-2 rounded">
                <span className="font-bold">Variables:</span> L = Largo Mueble, A = Ancho Mueble, P = Profundidad Mueble, E = Espesor Madera
              </div>

              
              <div className="space-y-4 border rounded-md p-4 bg-muted/50">
                <h4 className="font-medium text-sm">Atributos de la Pieza</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isEdges"
                      checked={formData.isEdges}
                      onChange={e => setFormData({ ...formData, isEdges: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="isEdges" className="font-normal cursor-pointer text-primary font-bold">Lleva Cantos</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isCabinetWood"
                      checked={formData.isCabinetWood}
                      onChange={e => setFormData({ ...formData, isCabinetWood: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="isCabinetWood" className="font-normal cursor-pointer">Cuerpo</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isBaseCabinetWood"
                      checked={formData.isBaseCabinetWood}
                      onChange={e => setFormData({ ...formData, isBaseCabinetWood: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="isBaseCabinetWood" className="font-normal cursor-pointer">Bajo Mesada</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isWallCabinetWood"
                      checked={formData.isWallCabinetWood}
                      onChange={e => setFormData({ ...formData, isWallCabinetWood: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="isWallCabinetWood" className="font-normal cursor-pointer">Alacena</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isBackPanel"
                      checked={formData.isBackPanel}
                      onChange={e => setFormData({ ...formData, isBackPanel: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="isBackPanel" className="font-normal cursor-pointer">Fondo</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isDrawer"
                      checked={formData.isDrawer}
                      onChange={e => setFormData({ ...formData, isDrawer: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="isDrawer" className="font-normal cursor-pointer">Cajón</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isLacquered"
                      checked={formData.isLacquered}
                      onChange={e => setFormData({ ...formData, isLacquered: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="isLacquered" className="font-normal cursor-pointer">Laqueado</Label>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Saving...' : 'Save Part'}
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
              <TableHead 
                className="cursor-pointer hover:text-primary transition-colors font-bold"
                onClick={() => requestSort('name')}
              >
                <div className="flex items-center">
                  Nombre <SortIcon columnKey="name" />
                </div>
              </TableHead>
              <TableHead className="font-bold">Atributos</TableHead>
              <TableHead className="font-bold">Fórmulas (L × A)</TableHead>
              <TableHead className="text-right font-bold w-20">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedParts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                  No se encontraron piezas.
                </TableCell>
              </TableRow>
            ) : (
              paginatedParts.map((part) => (
                <TableRow key={part.id} className="hover:bg-muted/50 transition-colors text-xs">
                  <TableCell className="font-medium py-2">{part.name}</TableCell>
                  <TableCell className="py-2">
                    <div className="flex flex-wrap gap-1">
                      <FlagBadge active={part.isEdges} label="Cantos" />
                      <FlagBadge active={part.isCabinetWood} label="Cuerpo" />
                      <FlagBadge active={part.isBaseCabinetWood} label="Bajo Mesada" />
                      <FlagBadge active={part.isWallCabinetWood} label="Alacena" />
                      <FlagBadge active={part.isBackPanel} label="Fondo" />
                      <FlagBadge active={part.isDrawer} label="Cajón" />
                      <FlagBadge active={part.isLacquered} label="Laqueado" />
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-mono py-2">
                    <div className="flex flex-col">
                      <span>L: {part.formulaLength || '-'}</span>
                      <span>A: {part.formulaWidth || '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right py-2">
                    <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(part)} className="mr-2">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(part.id)} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
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
              Mostrando {Math.min(filteredParts.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(filteredParts.length, currentPage * itemsPerPage)} de {filteredParts.length}
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
