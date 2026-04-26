import { getCosts } from '@/app/actions/cost'
import { CostsClient } from './costs-client'

export const dynamic = 'force-dynamic'

export default async function CostsPage() {
  const items = await getCosts()

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Costos</h2>
      </div>
      <CostsClient initialItems={items} />
    </div>
  )
}
