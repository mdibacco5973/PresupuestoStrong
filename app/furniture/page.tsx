import { getFurnitures } from '@/app/actions/furniture'
import { getParts } from '@/app/actions/part'
import { getExtraParts } from '@/app/actions/extra-part'
import { getCosts } from '@/app/actions/cost'
import { getLaborCosts } from '@/app/actions/labor'
import { getAdditionalCosts } from '@/app/actions/extra'
import { getWoods } from '@/app/actions/wood'
import { FurnitureClient } from './furniture-client'

export const dynamic = 'force-dynamic'

export default async function FurniturePage() {
  const [furnitures, parts, extraParts, costs, laborCosts, additionalCosts, woods] = await Promise.all([
    getFurnitures(),
    getParts(),
    getExtraParts(),
    getCosts(),
    getLaborCosts(),
    getAdditionalCosts(),
    getWoods(),
  ])

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Muebles</h2>
      </div>
      <FurnitureClient 
        initialItems={furnitures} 
        parts={parts}
        extraParts={extraParts}
        costs={costs}
        laborCosts={laborCosts}
        additionalCosts={additionalCosts}
        woods={woods}
      />
    </div>
  )
}
