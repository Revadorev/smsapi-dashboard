import DashboardLayout from '@/components/DashboardLayout'
import SmsHistoryTable from '@/components/SmsHistoryTable'
import { getAccountBalance } from '@/lib/smsapi'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default async function HistoryPage() {
  const [balance, logsResult] = await Promise.allSettled([
    getAccountBalance(),
    createServerClient()
      .from('sms_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200),
  ])

  const balanceData = balance.status === 'fulfilled' ? balance.value : null
  const logs =
    logsResult.status === 'fulfilled' ? (logsResult.value.data ?? []) : []

  return (
    <DashboardLayout balance={balanceData}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Istoric complet SMS</h1>
          <p className="text-slate-500 text-sm mt-1">
            Toate mesajele SMS trimise prin dashboard
          </p>
        </div>
        <SmsHistoryTable logs={logs} />
      </div>
    </DashboardLayout>
  )
}
