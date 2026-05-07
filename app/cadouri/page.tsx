import { createServerClient } from '@/lib/supabase'
import DashboardLayout from '@/components/DashboardLayout'
import GiftsManager from '@/components/GiftsManager'
import { getAccountBalance } from '@/lib/smsapi'

export const dynamic = 'force-dynamic'

async function getGiftProducts() {
  try {
    const db = createServerClient()
    const { data } = await db
      .from('gift_products')
      .select('*')
      .order('created_at', { ascending: false })
    return data ?? []
  } catch {
    return []
  }
}

export default async function CadouriPage() {
  const [balance, products] = await Promise.allSettled([
    getAccountBalance(),
    getGiftProducts(),
  ])

  const balanceData = balance.status === 'fulfilled' ? balance.value : null
  const productsData = products.status === 'fulfilled' ? products.value : []

  return (
    <DashboardLayout balance={balanceData}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">🎁 Cadouri pentru clienți</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Produse recomandate de pe eMAG — adaugă un link și datele sunt completate automat.
          </p>
        </div>

        <GiftsManager initialProducts={productsData as GiftProduct[]} />
      </div>
    </DashboardLayout>
  )
}

export type GiftProduct = {
  id: string
  pnk: string
  title: string
  description: string | null
  price: string | null
  image_url: string | null
  emag_url: string
  created_at: string
  updated_at: string
}
