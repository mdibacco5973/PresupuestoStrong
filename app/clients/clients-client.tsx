'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { ClientInput, createClient, updateClient, deleteClient } from '@/app/actions/client'

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

type Client = {
  id: string
  name: string | null
  email: string | null
  phone: string
  userCreatedId: string | null
  userUpdatedId: string | null
  createdAt: Date
  updatedAt: Date
}

interface ClientsClientProps {
  initialClients: Client[]
}

export function ClientsClient({ initialClients }: ClientsClientProps) {
  const [clients, setClients] = useState<Client[]>(initialClients)
  const [sortConfig, setSortConfig] = useState<{ key: keyof Client; direction: 'asc' | 'desc' } | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const requestSort = (key: keyof Client) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const sortedClients = [...clients].sort((a, b) => {
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

  const SortIcon = ({ columnKey }: { columnKey: keyof Client }) => {
    if (sortConfig?.key !== columnKey) return <ArrowUpDown className="ml-2 h-4 w-4" />
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="ml-2 h-4 w-4 text-primary" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4 text-primary" />
    )
  }

  const filteredClients = sortedClients.filter(client => {
    const searchLower = searchTerm.toLowerCase()
    return (
      (client.name?.toLowerCase() || '').includes(searchLower) ||
      (client.email?.toLowerCase() || '').includes(searchLower) ||
      client.phone.toLowerCase().includes(searchLower)
    )
  })

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage)
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const [formData, setFormData] = useState<ClientInput>({
    name: '',
    email: '',
    phone: '',
  })

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
    })
    setEditingClient(null)
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) resetForm()
  }

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone,
    })
    setIsOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este cliente?')) return
    setIsLoading(true)
    try {
      await deleteClient(id)
      setClients((prev) => prev.filter((c) => c.id !== id))
    } catch (error) {
      console.error(error)
      alert('Error al eliminar el cliente')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (editingClient) {
        const updated = await updateClient(editingClient.id, formData)
        setClients((prev) =>
          prev.map((c) => (c.id === editingClient.id ? updated : c))
        )
      } else {
        const created = await createClient(formData)
        setClients((prev) => [created, ...prev])
      }
      setIsOpen(false)
      resetForm()
    } catch (error) {
      console.error(error)
      alert('Error al guardar el cliente')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-72">
          <Input 
            placeholder="Buscar clientes..." 
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
                <Plus className="mr-2 h-4 w-4" /> Agregar Cliente
              </Button>
            }
          />
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingClient ? 'Editar Cliente' : 'Agregar Cliente'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Guardando...' : editingClient ? 'Actualizar' : 'Guardar'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>

          <TableHeader>
            <TableRow className="bg-muted/50 text-xs">
              <TableHead className="cursor-pointer hover:text-primary transition-colors font-bold" onClick={() => requestSort('name')}>
                <div className="flex items-center">Nombre <SortIcon columnKey="name" /></div>
              </TableHead>
              <TableHead className="cursor-pointer hover:text-primary transition-colors font-bold" onClick={() => requestSort('email')}>
                <div className="flex items-center">Email <SortIcon columnKey="email" /></div>
              </TableHead>
              <TableHead className="cursor-pointer hover:text-primary transition-colors font-bold w-32" onClick={() => requestSort('phone')}>
                <div className="flex items-center">Teléfono <SortIcon columnKey="phone" /></div>
              </TableHead>
              <TableHead className="cursor-pointer hover:text-primary transition-colors font-bold w-32" onClick={() => requestSort('updatedAt')}>
                <div className="flex items-center">ÚIt. Actualiz. <SortIcon columnKey="updatedAt" /></div>
              </TableHead>
              <TableHead className="text-right font-bold w-20">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  No se encontraron clientes.
                </TableCell>
              </TableRow>
            ) : (
              paginatedClients.map((client) => (
                <TableRow key={client.id} className="hover:bg-muted/50 transition-colors text-xs">
                  <TableCell className="font-medium py-2">{client.name || '-'}</TableCell>
                  <TableCell className="py-2">{client.email || '-'}</TableCell>
                  <TableCell className="py-2">{client.phone}</TableCell>
                  <TableCell className="py-2">{new Date(client.updatedAt).toLocaleDateString('es-AR')}</TableCell>
                  <TableCell className="text-right py-2">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(client)} className="h-8 w-8 text-muted-foreground hover:text-primary">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(client.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
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
              Mostrando {Math.min(filteredClients.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(filteredClients.length, currentPage * itemsPerPage)} de {filteredClients.length}
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
