import { getAdditionalCosts } from '@/app/actions/extra'
import { ExtrasClient } from './extras-client'

export const dynamic = 'force-dynamic'

export default async function ExtrasPage() {
  const items = await getAdditionalCosts()

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Extras</h2>
      </div>
      <ExtrasClient initialItems={items} />
    </div>
  )
}
