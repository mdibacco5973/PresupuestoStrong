import { getParts } from '@/app/actions/part'
import { PartsClient } from './parts-client'

export const dynamic = 'force-dynamic'

export default async function PartsPage() {
  const parts = await getParts()

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Piezas</h2>
      </div>
      <PartsClient initialParts={parts} />
    </div>
  )
}
