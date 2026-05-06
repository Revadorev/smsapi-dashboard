import { Suspense } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import StatsCards from '@/components/StatsCards'
import SendSmsForm from '@/components/SendSmsForm'
import SmsHistoryTable from '@/components/SmsHistoryTable'
import { getAccountBalance } from '@/lib/smsapi'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

async function getStats() {
  const db = createServerClient()
  const { data: logs } = await db
    .from('sms_logs')
    .select('status, points')
    .order('created_at', { ascending: false })

  const total = logs?.length ?? 0
  const delivered = logs?.filter((l) => l.status === 'DELIVERED').length ?? 0
  const failed = logs?.filter((l) =>
    ['FAILED', 'UNDELIVERED', 'REJECTED', 'ERROR'].includes(l.status)
  ).length ?? 0
  const totalPoints = logs?.reduce((acc, l) => acc + (l.points ?? 0), 0) ?? 0

  return { total, delivered, failed, totalPoints }
}

async function getRecentLogs() {
  const db = createServerClient()
  const { data } = await db
    .from('sms_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)
  return data ?? []
}

async function getTemplates() {
  const db = createServerClient()
  const { data } = await db
    .from('sms_templates')
    .select('*')
    .order('name')
  return data ?? []
}

export default async function HomePage() {
  const [balance, stats, logs, templates] = await Promise.allSettled([
    getAccountBalance(),
    getStats(),
    getRecentLogs(),
    getTemplates(),
  ])

  const balanceData = balance.status === 'fulfilled' ? balance.value : null
  const statsData =
    stats.status === 'fulfilled'
      ? stats.value
      : { total: 0, delivered: 0, failed: 0, totalPoints: 0 }
  const logsData = logs.status === 'fulfilled' ? logs.value : []
  const templatesData = templates.status === 'fulfilled' ? templates.value : []

  return (
    <DashboardLayout balance={balanceData}>
      <div className="space-y-8">
        {/* Stats */}
        <Suspense fallback={<div className="h-32 animate-pulse bg-white rounded-xl" />}>
          <StatsCards stats={statsData} balance={balanceData} />
        </Suspense>

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          {/* Send SMS Form */}
          <div className="xl:col-span-2">
            <SendSmsForm templates={templatesData} />
          </div>

          {/* History */}
          <div className="xl:col-span-3">
            <SmsHistoryTable logs={logsData} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
