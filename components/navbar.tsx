'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Hammer, Settings, LayoutGrid, Layers, DollarSign, Package, Home, Users, Armchair, FileText, Menu, X } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen)

  const NavLinks = ({ className = "" }: { className?: string }) => (
    <>
      <Link
        href="/"
        onClick={() => setIsMobileMenuOpen(false)}
        className={`flex items-center gap-1.5 transition-colors hover:text-foreground/80 ${className}`}
      >
        <Home className="h-4 w-4" />
        Inicio
      </Link>

      <Link
        href="/clients"
        onClick={() => setIsMobileMenuOpen(false)}
        className={`flex items-center gap-1.5 transition-colors hover:text-foreground/80 ${className}`}
      >
        <Users className="h-4 w-4" />
        Clientes
      </Link>
      
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button className={`flex items-center gap-1.5 transition-colors hover:text-foreground/80 outline-none ${className}`}>
              <Settings className="h-4 w-4" />
              Configuración
            </button>
          }
        />
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem
            render={
              <Link href="/woods" className="flex items-center gap-2 cursor-pointer w-full">
                <LayoutGrid className="h-4 w-4" />
                <span>Maderas</span>
              </Link>
            }
          />
          <DropdownMenuItem
            render={
              <Link href="/parts" className="flex items-center gap-2 cursor-pointer w-full">
                <Layers className="h-4 w-4" />
                <span>Piezas</span>
              </Link>
            }
          />
          <DropdownMenuItem
            render={
              <Link href="/extra-parts" className="flex items-center gap-2 cursor-pointer w-full">
                <Layers className="h-4 w-4" />
                <span>Piezas Extra</span>
              </Link>
            }
          />
          <DropdownMenuItem
            render={
              <Link href="/costs" className="flex items-center gap-2 cursor-pointer w-full">
                <DollarSign className="h-4 w-4" />
                <span>Costos</span>
              </Link>
            }
          />
        </DropdownMenuContent>
      </DropdownMenu>

      <Link
        href="/furniture"
        onClick={() => setIsMobileMenuOpen(false)}
        className={`flex items-center gap-1.5 transition-colors hover:text-foreground/80 ${className}`}
      >
        <Armchair className="h-4 w-4" />
        Muebles
      </Link>

      <Link
        href="/quotes"
        onClick={() => setIsMobileMenuOpen(false)}
        className={`flex items-center gap-1.5 transition-colors hover:text-foreground/80 ${className}`}
      >
        <FileText className="h-4 w-4" />
        Presupuesto
      </Link>
    </>
  )

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="rounded-lg bg-primary p-1.5 text-primary-foreground">
              <Hammer className="h-5 w-5" />
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium ml-6">
            <NavLinks className="text-muted-foreground" />
          </nav>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex md:hidden items-center">
          <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        <div className="hidden md:flex items-center space-x-4">
          <Button variant="outline" size="sm">
            Cerrar Sesión
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-background p-4 space-y-4 flex flex-col">
          <NavLinks className="text-foreground text-base py-2 border-b last:border-0" />
          <Button variant="outline" size="sm" className="w-full justify-start mt-4">
            Cerrar Sesión
          </Button>
        </div>
      )}
    </header>
  )
}

