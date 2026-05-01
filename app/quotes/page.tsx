import { getQuotes } from '@/app/actions/quote'
import { getClients } from '@/app/actions/client'
import { getFurnitures } from '@/app/actions/furniture'
import { getWoods } from '@/app/actions/wood'
import { getCosts } from '@/app/actions/cost'
import { getExtraParts } from '@/app/actions/extra-part'
import { getLaborCosts } from '@/app/actions/labor'
import { getAdditionalCosts } from '@/app/actions/extra'
import { QuotesClient } from './quotes-client'

export const dynamic = 'force-dynamic'

export default async function QuotesPage() {
  const [quotes, clients, furnitures, woods, costs, extraParts, laborCosts, additionalCosts] = await Promise.all([
    getQuotes(),
    getClients(),
    getFurnitures(),
    getWoods(),
    getCosts(),
    getExtraParts(),
    getLaborCosts(),
    getAdditionalCosts(),
  ])

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Presupuestos</h2>
      </div>
      <QuotesClient 
        initialQuotes={quotes} 
        clients={clients} 
        furnitures={furnitures} 
        woods={woods}
        costs={costs}
        extraParts={extraParts}
        laborCosts={laborCosts}
        additionalCosts={additionalCosts}
      />
    </div>
  )
}
