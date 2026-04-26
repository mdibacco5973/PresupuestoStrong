import Link from "next/link";
import { ArrowRight, Hammer, Settings2, Layers, DollarSign, Package, LayoutGrid } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-background">
      <div className="container px-4 py-16 text-center space-y-12">
        <div className="space-y-4 max-w-3xl mx-auto">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-foreground">
            Carpintería
          </h1>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {/* Muebles - Main Module */}
          <Link
            href="/furniture"
            className="group relative overflow-hidden rounded-2xl border-2 border-primary/20 bg-card p-8 transition-all hover:shadow-xl hover:-translate-y-2 hover:border-primary/50 sm:col-span-2 lg:col-span-1"
          >
            <div className="flex flex-col items-center text-center gap-4">
              <div className="rounded-2xl bg-primary/10 p-5 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Package className="h-10 w-10" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Muebles</h3>
                <p className="text-muted-foreground mt-2">Catálogo completo y configuración de estructuras.</p>
              </div>
              <div className="mt-2 flex items-center text-primary font-semibold">
                Gestionar <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </div>
          </Link>

          {/* Config Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2">
            <Link
              href="/woods"
              className="group relative overflow-hidden rounded-2xl border bg-card p-6 transition-all hover:shadow-lg hover:-translate-y-1"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-primary/10 p-3 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <LayoutGrid className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Maderas</h3>
                  <p className="text-sm text-muted-foreground">Placas, espesores y precios</p>
                </div>
              </div>
            </Link>

            <Link
              href="/parts"
              className="group relative overflow-hidden rounded-2xl border bg-card p-6 transition-all hover:shadow-lg hover:-translate-y-1"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-primary/10 p-3 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Layers className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Piezas</h3>
                  <p className="text-sm text-muted-foreground">Componentes y atributos</p>
                </div>
              </div>
            </Link>

            <Link
              href="/extra-parts"
              className="group relative overflow-hidden rounded-2xl border bg-card p-6 transition-all hover:shadow-lg hover:-translate-y-1"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-primary/10 p-3 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Package className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Piezas Extra</h3>
                  <p className="text-sm text-muted-foreground">Herrajes y accesorios</p>
                </div>
              </div>
            </Link>

            <Link
              href="/costs"
              className="group relative overflow-hidden rounded-2xl border bg-card p-6 transition-all hover:shadow-lg hover:-translate-y-1"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-primary/10 p-3 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Costos</h3>
                  <p className="text-sm text-muted-foreground">Mano de obra y fijos</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
