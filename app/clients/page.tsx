import { getClients } from '@/app/actions/client'
import { ClientsClient } from './clients-client'

export const dynamic = 'force-dynamic'

export default async function ClientsPage() {
  const clients = await getClients()

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Clientes</h2>
      </div>
      <ClientsClient initialClients={clients} />
    </div>
  )
}
