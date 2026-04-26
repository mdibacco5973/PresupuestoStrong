import { getLaborCosts } from '@/app/actions/labor'
import { LaborClient } from './labor-client'

export const dynamic = 'force-dynamic'

export default async function LaborPage() {
  const items = await getLaborCosts()

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Mano de Obra</h2>
      </div>
      <LaborClient initialItems={items} />
    </div>
  )
}
