import DashboardLayout from '@/components/DashboardLayout'
import TemplatesManager from '@/components/TemplatesManager'
import { getAccountBalance } from '@/lib/smsapi'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default async function TemplatesPage() {
  const [balance, templatesResult] = await Promise.allSettled([
    getAccountBalance(),
    createServerClient()
      .from('sms_templates')
      .select('*')
      .order('name'),
  ])

  const balanceData = balance.status === 'fulfilled' ? balance.value : null
  const templates =
    templatesResult.status === 'fulfilled'
      ? (templatesResult.value.data ?? [])
      : []

  return (
    <DashboardLayout balance={balanceData}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Template-uri SMS</h1>
          <p className="text-slate-500 text-sm mt-1">
            Gestionați mesajele predefinite reutilizabile
          </p>
        </div>
        <TemplatesManager templates={templates} />
      </div>
    </DashboardLayout>
  )
}
