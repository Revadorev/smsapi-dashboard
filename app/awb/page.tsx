import DashboardLayout from '@/components/DashboardLayout'
import AwbManager from '@/components/AwbManager'
import { getAccountBalance } from '@/lib/smsapi'

export const dynamic = 'force-dynamic'

export default async function AwbPage() {
  let balance = null
  try { balance = await getAccountBalance() } catch {}

  return (
    <DashboardLayout balance={balance}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">📦 Creare AWB SameDay</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Generează etichete de livrare pentru cadouri eMAG KidGPS — ramburs 0, plată expeditor.
          </p>
        </div>
        <AwbManager />
      </div>
    </DashboardLayout>
  )
}
