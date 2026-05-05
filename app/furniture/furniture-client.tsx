'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Package, Layers, DollarSign, Image as ImageIcon, X, Copy } from 'lucide-react'
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
import { createFurniture, updateFurniture, deleteFurniture, duplicateFurniture, FurnitureInput, FurnitureConfigInput, FurnitureExtraConfigInput, FurnitureCostConfigInput, FurnitureLaborCostConfigInput, FurnitureAdditionalCostConfigInput } from '@/app/actions/furniture'
import Image from 'next/image'

interface FurnitureClientProps {
  initialItems: any[]
  parts: any[]
  extraParts: any[]
  costs: any[]
  laborCosts: any[]
  additionalCosts: any[]
  woods: any[]
}

export function FurnitureClient({ initialItems, parts, extraParts, costs, laborCosts, additionalCosts, woods }: FurnitureClientProps) {
  const [items, setItems] = useState<any[]>(initialItems)
  const [isOpen, setIsOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'parts' | 'extra' | 'costs' | 'labor' | 'additional'>('basic')

  // Listas ordenadas alfabéticamente para los combos
  const sortedParts = useMemo(() => [...parts].sort((a, b) => a.name.localeCompare(b.name)), [parts])
  const sortedExtraParts = useMemo(() => [...extraParts].sort((a, b) => a.name.localeCompare(b.name)), [extraParts])
  const sortedCosts = useMemo(() => [...costs].sort((a, b) => a.name.localeCompare(b.name)), [costs])
  const sortedLaborCosts = useMemo(() => [...laborCosts].sort((a, b) => a.name.localeCompare(b.name)), [laborCosts])
  const sortedAdditionalCosts = useMemo(() => [...additionalCosts].sort((a, b) => a.name.localeCompare(b.name)), [additionalCosts])
  const sortedWoods = useMemo(() => [...woods].sort((a, b) => a.name.localeCompare(b.name)), [woods])
  
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [formData, setFormData] = useState<FurnitureInput>({
    name: '',
    code: '',
    length: 0,
    width: 0,
    depth: 0,
    furniturePrice: 0,
    hardwarePrice: 0,
    costPrice: 0,
    laborPrice: 0,
    additionalPrice: 0,
    furnitureTotal: 0,
    image: null,
    parts: [],
    extraParts: [],
    costs: [],
    laborCosts: [],
    additionalCosts: [],
  })

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setEditingItem(null)
      resetForm()
      setActiveTab('basic')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      length: 0,
      width: 0,
      depth: 0,
      furniturePrice: 0,
      hardwarePrice: 0,
      costPrice: 0,
      laborPrice: 0,
      additionalPrice: 0,
      furnitureTotal: 0,
      image: null,
      parts: [],
      extraParts: [],
      costs: [],
      laborCosts: [],
      additionalCosts: [],
    })
  }

  const handleEdit = (item: any) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      code: item.code,
      length: item.length,
      width: item.width,
      depth: item.depth,
      furniturePrice: item.furniturePrice,
      hardwarePrice: item.hardwarePrice,
      costPrice: item.costPrice,
      laborPrice: item.laborPrice || 0,
      additionalPrice: item.additionalPrice || 0,
      furnitureTotal: item.furnitureTotal,
      image: item.image,
      parts: item.parts.map((p: any) => ({
        idPart: p.idPart,
        quantity: p.quantity,
        edges1: p.edges1,
        edges2: p.edges2,
        edges3: p.edges3,
        edges4: p.edges4,
        edgeSize: p.edgeSize,
        grain: p.grain ?? 'Ninguna'
      })),
      extraParts: item.extraParts.map((ep: any) => ({
        idPartExtra: ep.idPartExtra,
        quantity: ep.quantity,
      })),
      costs: item.costs.map((c: any) => ({
        idCost: c.idCost,
        quantity: c.quantity,
        faces: c.faces || 1,
      })),
      laborCosts: item.laborCosts ? item.laborCosts.map((l: any) => ({
        idLaborCost: l.idLaborCost,
        quantity: l.quantity,
      })) : [],
      additionalCosts: item.additionalCosts ? item.additionalCosts.map((a: any) => ({
        idAdditionalCosts: a.idAdditionalCosts,
        quantity: a.quantity,
      })) : [],
    })
    setIsOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este mueble?')) return
    setIsPending(true)
    try {
      await deleteFurniture(id)
      setItems(items.filter(item => item.id !== id))
    } catch (error) {
      console.error(error)
      alert('Error al eliminar el mueble')
    } finally {
      setIsPending(false)
    }
  }

  const handleDuplicate = async (id: string) => {
    if (!confirm('¿Deseas duplicar este mueble?')) return
    setIsPending(true)
    try {
      const duplicated = await duplicateFurniture(id)
      if (duplicated) {
        setItems([duplicated, ...items])
        alert('Mueble duplicado correctamente')
      }
    } catch (error) {
      console.error(error)
      alert('Error al duplicar el mueble')
    } finally {
      setIsPending(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar que se hayan seleccionado ítems en todas las filas
    const hasEmptyParts = formData.parts.some(p => !p.idPart)
    const hasEmptyExtra = formData.extraParts.some(ep => !ep.idPartExtra)
    const hasEmptyCosts = formData.costs.some(c => !c.idCost)
    const hasEmptyLabor = formData.laborCosts.some(l => !l.idLaborCost)
    const hasEmptyAdditional = formData.additionalCosts.some(a => !a.idAdditionalCosts)

    if (hasEmptyParts || hasEmptyExtra || hasEmptyCosts || hasEmptyLabor || hasEmptyAdditional) {
      alert('Por favor, seleccione un ítem en todas las filas de las grillas o elimine las filas vacías.')
      return
    }

    setIsPending(true)
    try {
      if (editingItem) {
        const updated = await updateFurniture(editingItem.id, formData)
        setItems(items.map(i => i.id === updated.id ? { ...updated, image: formData.image } : i))
      } else {
        const created = await createFurniture(formData)
        setItems([{ ...created, image: formData.image }, ...items])
      }
      setIsOpen(false)
      resetForm()
    } catch (error) {
      console.error(error)
      alert('Error al guardar el mueble')
    } finally {
      setIsPending(false)
    }
  }

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const sortedItems = [...items].sort((a, b) => {
    if (!sortConfig) return 0
    const { key, direction } = sortConfig
    const aValue = a[key as keyof any]
    const bValue = b[key as keyof any]
    if (aValue < bValue) return direction === 'asc' ? -1 : 1
    if (aValue > bValue) return direction === 'asc' ? 1 : -1
    return 0
  })

  const filteredItems = sortedItems.filter(item => {
    const searchLower = searchTerm.toLowerCase()
    return (
      item.name.toLowerCase().includes(searchLower) ||
      item.code.toLowerCase().includes(searchLower)
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

  const evaluateFormula = (formula: string, context: { L: number, A: number, P: number, E: number }) => {
    if (!formula) return 0
    try {
      // Reemplazar variables por valores
      const expression = formula.toUpperCase()
        .replace(/L/g, context.L.toString())
        .replace(/A/g, context.A.toString())
        .replace(/P/g, context.P.toString())
        .replace(/E/g, context.E.toString())
      
      // Evaluación simple
       
      const result = new Function(`return ${expression}`)()
      return Math.max(0, Math.round(result))
    } catch (e) {
      return 0
    }
  }

  const defaultWood = woods.find(w => w.isDefaultWood) || woods[0]

  useEffect(() => {
    // Calcular el precio de las piezas basado en fórmulas
    const totalFurniturePrice = formData.parts.reduce((acc, p) => {
      const partData = parts.find(part => part.id === p.idPart)
      if (!partData) return acc

      const context = {
        L: formData.length,
        A: formData.width,
        P: formData.depth,
        E: defaultWood?.thickness || 0
      }

      const length = evaluateFormula(partData.formulaLength, context)
      const width = evaluateFormula(partData.formulaWidth, context)
      
      // Superficie en mm2 convertida a m2 para multiplicar por el precio (que suele ser por m2)
      // O si el precio de la madera es por mm2, ajustar.
      // Basado en AGENT_SKILLS, SurfaceArea es mm2. El precio de la madera se asume por m2 o unidad?
      // Usaremos la lógica de: (Longitud * Ancho) * (Precio Madera / 1,000,000) si el precio es por m2
      const surfaceM2 = (length * width) / 1000000
      const price = surfaceM2 * (defaultWood?.price || 0)
      
      return acc + (price * p.quantity)
    }, 0)

    const totalHardware = formData.extraParts.reduce((acc, ep) => {
      const part = extraParts.find(p => p.id === ep.idPartExtra)
      return acc + (part ? Number(part.price) * ep.quantity : 0)
    }, 0)
    
    const totalCosts = formData.costs.reduce((acc, c) => {
      const cost = costs.find(item => item.id === c.idCost)
      return acc + (cost ? Number(cost.price) * c.quantity * (c.faces || 1) : 0)
    }, 0)

    // Calcular longitud de filos (mm)
    let totalEdgeLength = 0
    let totalPiecesCount = 0
    formData.parts.forEach(p => {
      totalPiecesCount += p.quantity
      const partData = parts.find(part => part.id === p.idPart)
      if (!partData) return
      const context = { L: formData.length, A: formData.width, P: formData.depth, E: defaultWood?.thickness || 0 }
      const l = evaluateFormula(partData.formulaLength, context)
      const w = evaluateFormula(partData.formulaWidth, context)
      
      let partEdges = 0
      if (p.edges1) partEdges += l
      if (p.edges2) partEdges += l
      if (p.edges3) partEdges += w
      if (p.edges4) partEdges += w
      
      // Convertir mm a metros para el cálculo de mano de obra
      totalEdgeLength += ((partEdges / 1000) * p.quantity)
    })

    const totalLabor = formData.laborCosts.reduce((acc, l) => {
      const labor = laborCosts.find(item => item.id === l.idLaborCost)
      if (!labor) return acc
      
      let qty = l.quantity
      if (labor.name.toUpperCase().includes('FILO') || labor.name.toUpperCase().includes('PEGADO')) {
        qty = totalEdgeLength
      } else if (labor.name.toUpperCase().includes('CORTE')) {
        qty = totalPiecesCount
      }
      
      return acc + (Number(labor.price) * qty)
    }, 0)

    const totalAdditional = formData.additionalCosts.reduce((acc, a) => {
      const additional = additionalCosts.find(item => item.id === a.idAdditionalCosts)
      return acc + (additional ? Number(additional.price) * a.quantity : 0)
    }, 0)

    const totalEverything = totalFurniturePrice + totalHardware + totalCosts + totalLabor + totalAdditional

    setFormData(prev => {
      // Actualizar cantidades de mano de obra automáticas
      const updatedLaborCosts = prev.laborCosts.map(l => {
        const labor = laborCosts.find(item => item.id === l.idLaborCost)
        if (labor) {
          const laborName = labor.name.toUpperCase()
          if (laborName.includes('FILO') || laborName.includes('PEGADO')) {
            const roundedQty = Number(totalEdgeLength.toFixed(2))
            if (l.quantity !== roundedQty) return { ...l, quantity: roundedQty }
          } else if (laborName.includes('CORTE')) {
            if (l.quantity !== totalPiecesCount) return { ...l, quantity: totalPiecesCount }
          }
        }
        return l
      })

      const laborCostsChanged = JSON.stringify(updatedLaborCosts) !== JSON.stringify(prev.laborCosts)

      if (Math.abs(totalFurniturePrice - prev.furniturePrice) < 0.01 && 
          Math.abs(totalHardware - prev.hardwarePrice) < 0.01 && 
          Math.abs(totalCosts - prev.costPrice) < 0.01 && 
          Math.abs(totalLabor - prev.laborPrice) < 0.01 && 
          Math.abs(totalAdditional - prev.additionalPrice) < 0.01 && 
          Math.abs(totalEverything - prev.furnitureTotal) < 0.01 &&
          !laborCostsChanged) {
        return prev
      }
      return {
        ...prev,
        laborCosts: updatedLaborCosts,
        furniturePrice: Number(totalFurniturePrice.toFixed(2)),
        hardwarePrice: Number(totalHardware.toFixed(2)),
        costPrice: Number(totalCosts.toFixed(2)),
        laborPrice: Number(totalLabor.toFixed(2)),
        additionalPrice: Number(totalAdditional.toFixed(2)),
        furnitureTotal: Number(totalEverything.toFixed(2))
      }
    })
  }, [formData.parts, formData.extraParts, formData.costs, formData.laborCosts, formData.additionalCosts, formData.length, formData.width, formData.depth, extraParts, costs, laborCosts, additionalCosts, parts, defaultWood])

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig?.key !== columnKey) return <ArrowUpDown className="ml-2 h-4 w-4" />
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="ml-2 h-4 w-4 text-primary" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4 text-primary" />
    )
  }

  // Configuration Handlers
  const addPartConfig = () => {
    setFormData({
      ...formData,
      parts: [
        ...formData.parts,
        { idPart: '', quantity: 1, edges1: false, edges2: false, edges3: false, edges4: false, edgeSize: 0, grain: 'Ninguna' }
      ]
    })
  }

  const removePartConfig = (index: number) => {
    const newParts = [...formData.parts]
    newParts.splice(index, 1)
    setFormData({ ...formData, parts: newParts })
  }

  const updatePartConfig = (index: number, field: keyof FurnitureConfigInput, value: any) => {
    const newParts = [...formData.parts]
    newParts[index] = { ...newParts[index], [field]: value }
    setFormData({ ...formData, parts: newParts })
  }

  const addExtraConfig = () => {
    setFormData({
      ...formData,
      extraParts: [...formData.extraParts, { idPartExtra: '', quantity: 1 }]
    })
  }

  const removeExtraConfig = (index: number) => {
    const newExtra = [...formData.extraParts]
    newExtra.splice(index, 1)
    setFormData({ ...formData, extraParts: newExtra })
  }

  const updateExtraConfig = (index: number, field: keyof FurnitureExtraConfigInput, value: any) => {
    const newExtra = [...formData.extraParts]
    newExtra[index] = { ...newExtra[index], [field]: value }
    setFormData({ ...formData, extraParts: newExtra })
  }

  const addCostConfig = () => {
    setFormData({
      ...formData,
      costs: [...formData.costs, { idCost: '', quantity: 1, faces: 1 }]
    })
  }

  const removeCostConfig = (index: number) => {
    const newCosts = [...formData.costs]
    newCosts.splice(index, 1)
    setFormData({ ...formData, costs: newCosts })
  }

  const updateCostConfig = (index: number, field: keyof FurnitureCostConfigInput, value: any) => {
    const newCosts = [...formData.costs]
    newCosts[index] = { ...newCosts[index], [field]: value }
    setFormData({ ...formData, costs: newCosts })
  }

  const addLaborCostConfig = () => {
    setFormData({
      ...formData,
      laborCosts: [...formData.laborCosts, { idLaborCost: '', quantity: 1 }]
    })
  }

  const removeLaborCostConfig = (index: number) => {
    const newLaborCosts = [...formData.laborCosts]
    newLaborCosts.splice(index, 1)
    setFormData({ ...formData, laborCosts: newLaborCosts })
  }

  const updateLaborCostConfig = (index: number, field: keyof FurnitureLaborCostConfigInput, value: any) => {
    const newLaborCosts = [...formData.laborCosts]
    newLaborCosts[index] = { ...newLaborCosts[index], [field]: value }
    setFormData({ ...formData, laborCosts: newLaborCosts })
  }

  const addAdditionalCostConfig = () => {
    setFormData({
      ...formData,
      additionalCosts: [...formData.additionalCosts, { idAdditionalCosts: '', quantity: 1 }]
    })
  }

  const removeAdditionalCostConfig = (index: number) => {
    const newAdditionalCosts = [...formData.additionalCosts]
    newAdditionalCosts.splice(index, 1)
    setFormData({ ...formData, additionalCosts: newAdditionalCosts })
  }

  const updateAdditionalCostConfig = (index: number, field: keyof FurnitureAdditionalCostConfigInput, value: any) => {
    const newAdditionalCosts = [...formData.additionalCosts]
    newAdditionalCosts[index] = { ...newAdditionalCosts[index], [field]: value }
    setFormData({ ...formData, additionalCosts: newAdditionalCosts })
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative flex w-full max-sm:w-1/2 max-w-sm items-center">
          <Input 
            placeholder="Buscar muebles..." 
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
                <Plus className="mr-2 h-4 w-4" /> Agregar Mueble
              </Button>
            }
          />
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Editar Mueble' : 'Agregar Mueble'}</DialogTitle>
            </DialogHeader>
            
            <div className="flex border-b mb-4 overflow-x-auto">
              <button 
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'basic' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                onClick={() => setActiveTab('basic')}
              >
                Información Básica
              </button>
              <button 
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'parts' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                onClick={() => setActiveTab('parts')}
              >
                Piezas ({formData.parts.length})
              </button>
              <button 
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'extra' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                onClick={() => setActiveTab('extra')}
              >
                Herrajes/Accesorios ({formData.extraParts.length})
              </button>
              <button 
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'costs' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                onClick={() => setActiveTab('costs')}
              >
                Acabados ({formData.costs.length})
              </button>
              <button 
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'labor' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                onClick={() => setActiveTab('labor')}
              >
                Mano de Obra ({formData.laborCosts.length})
              </button>
              <button 
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'additional' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                onClick={() => setActiveTab('additional')}
              >
                Extras ({formData.additionalCosts.length})
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Columna Izquierda: Datos Principales */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-xs font-bold text-muted-foreground uppercase">Nombre del Mueble</Label>
                        <Input id="name" className="h-9" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="code" className="text-xs font-bold text-muted-foreground uppercase">Código</Label>
                          <Input id="code" className="h-9" maxLength={5} value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="length" className="text-xs font-bold text-muted-foreground uppercase">Largo (mm)</Label>
                          <Input id="length" className="h-9" type="number" value={formData.length} onChange={e => setFormData({...formData, length: parseInt(e.target.value) || 0})} required />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="width" className="text-xs font-bold text-muted-foreground uppercase">Ancho (mm)</Label>
                          <Input id="width" className="h-9" type="number" value={formData.width} onChange={e => setFormData({...formData, width: parseInt(e.target.value) || 0})} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="depth" className="text-xs font-bold text-muted-foreground uppercase">Profundidad (mm)</Label>
                          <Input id="depth" className="h-9" type="number" value={formData.depth} onChange={e => setFormData({...formData, depth: parseInt(e.target.value) || 0})} required />
                        </div>
                      </div>
                    </div>

                    {/* Columna Derecha: Imagen */}
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-muted-foreground uppercase">Imagen del Mueble</Label>
                      <div className="border-2 border-dashed rounded-lg flex flex-col items-center justify-center space-y-2 hover:bg-muted/50 transition-colors cursor-pointer relative overflow-hidden h-40">
                        {formData.image ? (
                          <>
                            <Image src={formData.image.startsWith('data:') ? formData.image : `data:image/jpeg;base64,${formData.image}`} alt="Preview" fill className="object-contain p-2" />
                            <button type="button" onClick={() => setFormData({...formData, image: null})} className="absolute top-2 right-2 bg-destructive text-white rounded-full p-1 shadow-md hover:bg-destructive/90 z-10">
                              <X className="h-3 w-3" />
                            </button>
                          </>
                        ) : (
                          <>
                            <ImageIcon className="h-10 w-10 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground uppercase font-bold">Subir Imagen</span>
                            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageChange} />
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Fila Inferior: Precios en una sola línea */}
                  <div className="grid grid-cols-6 gap-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-muted-foreground uppercase">Precio Mueble</Label>
                      <div className="h-9 w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm text-primary font-semibold flex items-center">
                        {formatCurrency(formData.furniturePrice)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-muted-foreground uppercase text-orange-600">Herrajes</Label>
                      <div className="h-9 w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm text-orange-600 font-semibold flex items-center">
                        {formatCurrency(formData.hardwarePrice)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-muted-foreground uppercase text-green-600">Acabados</Label>
                      <div className="h-9 w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm text-green-600 font-semibold flex items-center">
                        {formatCurrency(formData.costPrice)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-muted-foreground uppercase text-blue-600">Mano de Obra</Label>
                      <div className="h-9 w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm text-blue-600 font-semibold flex items-center">
                        {formatCurrency(formData.laborPrice)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-muted-foreground uppercase text-purple-600">Extras</Label>
                      <div className="h-9 w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm text-purple-600 font-semibold flex items-center">
                        {formatCurrency(formData.additionalPrice)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-primary uppercase">Total Final</Label>
                      <div className="h-9 w-full rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary font-bold flex items-center shadow-sm">
                        {formatCurrency(formData.furnitureTotal)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'parts' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Configuración de Piezas</h3>
                    <Button type="button" variant="outline" size="sm" onClick={addPartConfig}>
                      <Plus className="h-4 w-4 mr-2" /> Agregar Pieza
                    </Button>
                  </div>
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead>Pieza</TableHead>
                          <TableHead className="w-20">Cant.</TableHead>
                          <TableHead>Medidas (mm)</TableHead>
                          <TableHead>Precio Unit.</TableHead>
                          <TableHead>Subtotal</TableHead>
                          <TableHead>Cantos (1-4)</TableHead>
                          <TableHead className="w-24">Tam. Canto</TableHead>
                          <TableHead className="w-32">Veta</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.parts.map((p, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <select 
                                className="w-full bg-transparent border-none focus:ring-0 text-sm"
                                value={p.idPart} 
                                onChange={e => updatePartConfig(idx, 'idPart', e.target.value)}
                              >
                                <option value="" disabled>Seleccione...</option>
                                {sortedParts.map((part: any) => {
                                  const isSelected = formData.parts.some((p2, i2) => i2 !== idx && p2.idPart === part.id)
                                  return <option key={part.id} value={part.id} disabled={isSelected}>{part.name}</option>
                                })}
                              </select>
                            </TableCell>
                            <TableCell>
                              <Input type="number" className="h-8" value={p.quantity} onChange={e => updatePartConfig(idx, 'quantity', parseFloat(e.target.value) || 1)} step="0.01" />
                            </TableCell>
                            <TableCell className="text-xs font-mono whitespace-nowrap">
                              {(() => {
                                const partData = parts.find(part => part.id === p.idPart)
                                if (!partData) return '-'
                                const context = {
                                  L: formData.length,
                                  A: formData.width,
                                  P: formData.depth,
                                  E: defaultWood?.thickness || 0
                                }
                                const l = evaluateFormula(partData.formulaLength, context)
                                const w = evaluateFormula(partData.formulaWidth, context)
                                return `${l} x ${w}`
                              })()}
                            </TableCell>
                            <TableCell className="text-xs font-medium text-primary">
                              {(() => {
                                const partData = parts.find(part => part.id === p.idPart)
                                if (!partData) return '-'
                                const context = {
                                  L: formData.length,
                                  A: formData.width,
                                  P: formData.depth,
                                  E: defaultWood?.thickness || 0
                                }
                                const l = evaluateFormula(partData.formulaLength, context)
                                const w = evaluateFormula(partData.formulaWidth, context)
                                const surfaceM2 = (l * w) / 1000000
                                const price = surfaceM2 * (defaultWood?.price || 0)
                                return formatCurrency(price)
                              })()}
                            </TableCell>
                            <TableCell className="text-xs font-bold text-primary">
                              {(() => {
                                const partData = parts.find(part => part.id === p.idPart)
                                if (!partData) return '-'
                                const context = {
                                  L: formData.length,
                                  A: formData.width,
                                  P: formData.depth,
                                  E: defaultWood?.thickness || 0
                                }
                                const l = evaluateFormula(partData.formulaLength, context)
                                const w = evaluateFormula(partData.formulaWidth, context)
                                const surfaceM2 = (l * w) / 1000000
                                const price = surfaceM2 * (defaultWood?.price || 0)
                                return formatCurrency(price * p.quantity)
                              })()}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {[1,2,3,4].map(num => (
                                  <label key={num} className="flex items-center gap-1 cursor-pointer">
                                    <input 
                                      type="checkbox" 
                                      className="h-4 w-4 rounded border-gray-300"
                                      checked={(p as any)[`edges${num}`]} 
                                      onChange={e => updatePartConfig(idx, `edges${num}` as any, e.target.checked)} 
                                    />
                                    <span className="text-[10px]">{num}</span>
                                  </label>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Input type="number" className="h-8" value={p.edgeSize ?? 0} onChange={e => updatePartConfig(idx, 'edgeSize', parseInt(e.target.value) || 0)} />
                            </TableCell>
                            <TableCell>
                              <select 
                                className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium"
                                value={p.grain || 'Ninguna'} 
                                onChange={e => updatePartConfig(idx, 'grain', e.target.value)}
                              >
                                <option value="Ninguna">Ninguna</option>
                                <option value="Longitud">Longitud</option>
                                <option value="Ancho">Ancho</option>
                              </select>
                            </TableCell>
                            <TableCell>
                              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removePartConfig(idx)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {formData.parts.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-4 text-muted-foreground text-sm">
                              Sin piezas configuradas. Haga clic en Agregar Pieza.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {activeTab === 'extra' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Herrajes y Accesorios</h3>
                    <Button type="button" variant="outline" size="sm" onClick={addExtraConfig}>
                      <Plus className="h-4 w-4 mr-2" /> Agregar Item
                    </Button>
                  </div>
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead>Descripción</TableHead>
                          <TableHead className="w-24">Cant.</TableHead>
                          <TableHead>Precio Unit.</TableHead>
                          <TableHead>Subtotal</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.extraParts.map((ep, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <select 
                                className="w-full bg-transparent border-none focus:ring-0 text-sm"
                                value={ep.idPartExtra} 
                                onChange={e => updateExtraConfig(idx, 'idPartExtra', e.target.value)}
                              >
                                <option value="" disabled>Seleccione...</option>
                                {sortedExtraParts.map((item: any) => {
                                  const isSelected = formData.extraParts.some((p2, i2) => i2 !== idx && p2.idPartExtra === item.id)
                                  return <option key={item.id} value={item.id} disabled={isSelected}>{item.name}</option>
                                })}
                              </select>
                            </TableCell>
                            <TableCell>
                              <Input type="number" className="h-8" value={ep.quantity} onChange={e => updateExtraConfig(idx, 'quantity', parseFloat(e.target.value) || 1)} step="0.01" />
                            </TableCell>
                            <TableCell className="text-xs font-medium text-primary">
                              {(() => {
                                const item = extraParts.find(p => p.id === ep.idPartExtra)
                                return item ? formatCurrency(Number(item.price)) : '-'
                              })()}
                            </TableCell>
                            <TableCell className="text-xs font-bold text-primary">
                              {(() => {
                                const item = extraParts.find(p => p.id === ep.idPartExtra)
                                return item ? formatCurrency(Number(item.price) * ep.quantity) : '-'
                              })()}
                            </TableCell>
                            <TableCell>
                              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeExtraConfig(idx)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {formData.extraParts.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4 text-muted-foreground text-sm">
                              Sin herrajes configurados. Haga clic en Agregar Item.
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
                    <h3 className="font-semibold">Configuración de Acabados</h3>
                    <Button type="button" variant="outline" size="sm" onClick={addCostConfig}>
                      <Plus className="h-4 w-4 mr-2" /> Agregar Acabado
                    </Button>
                  </div>
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead>Concepto</TableHead>
                          <TableHead className="w-24">Cant.</TableHead>
                          <TableHead className="w-20">Caras</TableHead>
                          <TableHead>Precio Unit.</TableHead>
                          <TableHead>Subtotal</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.costs.map((c, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <select 
                                className="w-full bg-transparent border-none focus:ring-0 text-sm"
                                value={c.idCost} 
                                onChange={e => updateCostConfig(idx, 'idCost', e.target.value)}
                              >
                                <option value="" disabled>Seleccione...</option>
                                {sortedCosts.map((item: any) => {
                                  const isSelected = formData.costs.some((c2, i2) => i2 !== idx && c2.idCost === item.id)
                                  return <option key={item.id} value={item.id} disabled={isSelected}>{item.name}</option>
                                })}
                              </select>
                            </TableCell>
                            <TableCell>
                              <Input type="number" className="h-8 text-center" value={c.quantity} onChange={e => updateCostConfig(idx, 'quantity', parseFloat(e.target.value) || 1)} step="0.01" />
                            </TableCell>
                            <TableCell>
                              <select
                                className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-center font-bold"
                                value={c.faces || 1}
                                onChange={(e) => updateCostConfig(idx, 'faces' as any, parseInt(e.target.value) || 1)}
                              >
                                <option value={1}>1</option>
                                <option value={2}>2</option>
                              </select>
                            </TableCell>
                                  <TableCell className="text-xs font-medium text-primary">
                              {(() => {
                                const item = costs.find(i => i.id === c.idCost)
                                return item ? formatCurrency(Number(item.price)) : '-'
                              })()}
                            </TableCell>
                            <TableCell className="text-xs font-bold text-primary">
                              {(() => {
                                const item = costs.find(i => i.id === c.idCost)
                                return item ? formatCurrency(Number(item.price) * c.quantity * (c.faces || 1)) : '-'
                              })()}
                            </TableCell>
                            <TableCell>
                              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeCostConfig(idx)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {formData.costs.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4 text-muted-foreground text-sm">
                              Sin acabados configurados. Haga clic en Agregar Acabado.
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
                    <h3 className="font-semibold">Configuración de Mano de Obra</h3>
                    <Button type="button" variant="outline" size="sm" onClick={addLaborCostConfig}>
                      <Plus className="h-4 w-4 mr-2" /> Agregar Mano de Obra
                    </Button>
                  </div>
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead>Concepto</TableHead>
                          <TableHead className="w-24">Cant.</TableHead>
                          <TableHead>Precio Unit.</TableHead>
                          <TableHead>Subtotal</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.laborCosts.map((l, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <select 
                                className="w-full bg-transparent border-none focus:ring-0 text-sm"
                                value={l.idLaborCost} 
                                onChange={e => updateLaborCostConfig(idx, 'idLaborCost', e.target.value)}
                              >
                                <option value="" disabled>Seleccione...</option>
                                {sortedLaborCosts.map((item: any) => {
                                  const isSelected = formData.laborCosts.some((l2, i2) => i2 !== idx && l2.idLaborCost === item.id)
                                  return <option key={item.id} value={item.id} disabled={isSelected}>{item.name}</option>
                                })}
                              </select>
                            </TableCell>
                            <TableCell>
                              <Input 
                                type="number" 
                                className="h-8" 
                                value={l.quantity} 
                                onChange={e => updateLaborCostConfig(idx, 'quantity', parseFloat(e.target.value) || 1)} step="0.01" 
                                disabled={(() => {
                                  const item = laborCosts.find(i => i.id === l.idLaborCost)
                                  if (!item) return false
                                  const name = item.name.toUpperCase()
                                  return name.includes('FILO') || name.includes('PEGADO') || name.includes('CORTE')
                                })()}
                              />
                            </TableCell>
                            <TableCell className="text-xs font-medium text-primary">
                              {(() => {
                                const item = laborCosts.find(i => i.id === l.idLaborCost)
                                return item ? formatCurrency(Number(item.price)) : '-'
                              })()}
                            </TableCell>
                            <TableCell className="text-xs font-bold text-primary">
                              {(() => {
                                const item = laborCosts.find(i => i.id === l.idLaborCost)
                                return item ? formatCurrency(Number(item.price) * l.quantity) : '-'
                              })()}
                            </TableCell>
                            <TableCell>
                              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeLaborCostConfig(idx)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {formData.laborCosts.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4 text-muted-foreground text-sm">
                              Sin mano de obra configurada. Haga clic en Agregar Mano de Obra.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {activeTab === 'additional' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Configuración de Extras</h3>
                    <Button type="button" variant="outline" size="sm" onClick={addAdditionalCostConfig}>
                      <Plus className="h-4 w-4 mr-2" /> Agregar Extra
                    </Button>
                  </div>
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead>Concepto</TableHead>
                          <TableHead className="w-24">Cant.</TableHead>
                          <TableHead>Precio Unit.</TableHead>
                          <TableHead>Subtotal</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.additionalCosts.map((a, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <select 
                                className="w-full bg-transparent border-none focus:ring-0 text-sm"
                                value={a.idAdditionalCosts} 
                                onChange={e => updateAdditionalCostConfig(idx, 'idAdditionalCosts', e.target.value)}
                              >
                                <option value="" disabled>Seleccione...</option>
                                {sortedAdditionalCosts.map((item: any) => {
                                  const isSelected = formData.additionalCosts.some((a2, i2) => i2 !== idx && a2.idAdditionalCosts === item.id)
                                  return <option key={item.id} value={item.id} disabled={isSelected}>{item.name}</option>
                                })}
                              </select>
                            </TableCell>
                            <TableCell>
                              <Input type="number" className="h-8" value={a.quantity} onChange={e => updateAdditionalCostConfig(idx, 'quantity', parseFloat(e.target.value) || 1)} step="0.01" />
                            </TableCell>
                            <TableCell className="text-xs font-medium text-primary">
                              {(() => {
                                const item = additionalCosts.find(i => i.id === a.idAdditionalCosts)
                                return item ? formatCurrency(Number(item.price)) : '-'
                              })()}
                            </TableCell>
                            <TableCell className="text-xs font-bold text-primary">
                              {(() => {
                                const item = additionalCosts.find(i => i.id === a.idAdditionalCosts)
                                return item ? formatCurrency(Number(item.price) * a.quantity) : '-'
                              })()}
                            </TableCell>
                            <TableCell>
                              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeAdditionalCostConfig(idx)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {formData.additionalCosts.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4 text-muted-foreground text-sm">
                              Sin extras configurados. Haga clic en Agregar Extra.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <DialogFooter className="pt-4">
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Guardando...' : editingItem ? 'Actualizar Mueble' : 'Guardar Mueble'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 text-xs">
              <TableHead 
                className="cursor-pointer hover:text-primary transition-colors font-bold w-20"
                onClick={() => requestSort('code')}
              >
                <div className="flex items-center">
                  Cód. <SortIcon columnKey="code" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:text-primary transition-colors font-bold"
                onClick={() => requestSort('name')}
              >
                <div className="flex items-center">
                  Nombre <SortIcon columnKey="name" />
                </div>
              </TableHead>
              <TableHead className="font-bold text-center w-32">Dim. (L×A×P)</TableHead>
              <TableHead 
                className="cursor-pointer hover:text-primary transition-colors font-bold text-right w-24"
                onClick={() => requestSort('furniturePrice')}
              >
                <div className="flex items-center justify-end">
                  Mueble <SortIcon columnKey="furniturePrice" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:text-primary transition-colors font-bold text-right w-24"
                onClick={() => requestSort('hardwarePrice')}
              >
                <div className="flex items-center justify-end">
                  Herrajes <SortIcon columnKey="hardwarePrice" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:text-primary transition-colors font-bold text-right w-24"
                onClick={() => requestSort('costPrice')}
              >
                <div className="flex items-center justify-end">
                  Acabados <SortIcon columnKey="costPrice" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:text-primary transition-colors font-bold text-right w-24"
                onClick={() => requestSort('laborPrice')}
              >
                <div className="flex items-center justify-end">
                  M. Obra <SortIcon columnKey="laborPrice" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:text-primary transition-colors font-bold text-right w-24"
                onClick={() => requestSort('additionalPrice')}
              >
                <div className="flex items-center justify-end">
                  Extras <SortIcon columnKey="additionalPrice" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:text-primary transition-colors font-bold text-right w-28"
                onClick={() => requestSort('furnitureTotal')}
              >
                <div className="flex items-center justify-end">
                  Total <SortIcon columnKey="furnitureTotal" />
                </div>
              </TableHead>
              <TableHead className="font-bold text-center w-24">Config.</TableHead>
              <TableHead className="text-right font-bold w-20">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center h-24 text-muted-foreground">
                  No se encontraron muebles.
                </TableCell>
              </TableRow>
            ) : (
              paginatedItems.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/50 transition-colors text-xs">
                  <TableCell className="font-mono text-xs uppercase py-2">{item.code}</TableCell>
                  <TableCell className="font-medium py-2 max-w-[140px] truncate" title={item.name}>{item.name}</TableCell>
                  <TableCell className="text-center text-xs py-2 whitespace-nowrap">
                    {item.length}×{item.width}×{item.depth}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-primary py-2 whitespace-nowrap">
                    $ {Number(item.furniturePrice).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </TableCell>
                  <TableCell className="text-right font-medium text-orange-600 py-2 whitespace-nowrap">
                    $ {Number(item.hardwarePrice).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </TableCell>
                  <TableCell className="text-right font-medium text-green-600 py-2 whitespace-nowrap">
                    $ {Number(item.costPrice).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </TableCell>
                  <TableCell className="text-right font-medium text-blue-600 py-2 whitespace-nowrap">
                    $ {Number(item.laborPrice || 0).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </TableCell>
                  <TableCell className="text-right font-medium text-purple-600 py-2 whitespace-nowrap">
                    $ {Number(item.additionalPrice || 0).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </TableCell>
                  <TableCell className="text-right font-bold text-primary py-2 whitespace-nowrap">
                    $ {Number(item.furnitureTotal).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </TableCell>
                  <TableCell className="text-center py-2">
                    <div className="flex justify-center gap-0.5">
                      <span className="bg-blue-100 text-blue-700 text-[9px] px-1 py-0.5 rounded-full" title="Piezas">{item.parts.length}P</span>
                      <span className="bg-orange-100 text-orange-700 text-[9px] px-1 py-0.5 rounded-full" title="Herrajes">{item.extraParts.length}H</span>
                      <span className="bg-green-100 text-green-700 text-[9px] px-1 py-0.5 rounded-full" title="Acabados">{item.costs.length}A</span>
                      <span className="bg-blue-100 text-blue-700 text-[9px] px-1 py-0.5 rounded-full" title="Mano de Obra">{item.laborCosts ? item.laborCosts.length : 0}M</span>
                      <span className="bg-purple-100 text-purple-700 text-[9px] px-1 py-0.5 rounded-full" title="Extras">{item.additionalCosts ? item.additionalCosts.length : 0}E</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(item)}
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDuplicate(item.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-blue-600"
                        title="Duplicar"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item.id)}
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
