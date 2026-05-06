import { MessageSquare, CheckCircle2, XCircle, Coins } from 'lucide-react'
import type { AccountBalance } from '@/lib/smsapi'

interface Props {
  stats: {
    total: number
    delivered: number
    failed: number
    totalPoints: number
  }
  balance: AccountBalance | null
}

export default function StatsCards({ stats, balance }: Props) {
  const deliveryRate =
    stats.total > 0 ? Math.round((stats.delivered / stats.total) * 100) : 0

  const cards = [
    {
      label: 'Total SMS Trimise',
      value: stats.total.toLocaleString('ro-RO'),
      icon: MessageSquare,
      color: 'bg-indigo-50 text-indigo-600',
      border: 'border-indigo-100',
    },
    {
      label: 'Livrate',
      value: `${stats.delivered.toLocaleString('ro-RO')}`,
      sub: `${deliveryRate}% rată livrare`,
      icon: CheckCircle2,
      color: 'bg-green-50 text-green-600',
      border: 'border-green-100',
    },
    {
      label: 'Eșuate',
      value: stats.failed.toLocaleString('ro-RO'),
      icon: XCircle,
      color: 'bg-red-50 text-red-500',
      border: 'border-red-100',
    },
    {
      label: 'Credite Utilizate',
      value: stats.totalPoints.toFixed(2),
      sub: balance ? `${balance.points.toFixed(2)} rămase` : undefined,
      icon: Coins,
      color: 'bg-amber-50 text-amber-600',
      border: 'border-amber-100',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`bg-white rounded-xl border ${card.border} p-5 flex items-start gap-4 shadow-sm`}
        >
          <div className={`${card.color} p-2.5 rounded-lg flex-shrink-0`}>
            <card.icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{card.value}</p>
            <p className="text-xs font-medium text-slate-500 mt-0.5">{card.label}</p>
            {card.sub && (
              <p className="text-xs text-slate-400 mt-0.5">{card.sub}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
