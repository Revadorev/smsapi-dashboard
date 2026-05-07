import DashboardLayout from '@/components/DashboardLayout'
import AwbManager from '@/components/AwbManager'
import { getAccountBalance } from '@/lib/smsapi'

export const dynamic = 'force-dynamic'

export default async function AwbPage() {
  let balance = null
  try { balance = await getAccountBalance() } catch {}

  return (
    <DashboardLayout balance={balance}>
      <AwbManager />
    </DashboardLayout>
  )
}
