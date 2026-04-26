import { getExtraParts } from '@/app/actions/extra-part'
import { ExtraPartsClient } from './extra-parts-client'

export const dynamic = 'force-dynamic'

export default async function ExtraPartsPage() {
  const items = await getExtraParts()

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Herrajes</h2>
      </div>
      <ExtraPartsClient initialItems={items} />
    </div>
  )
}
