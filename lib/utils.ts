import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatPhone(phone: string): string {
  // Normalize Romanian numbers display
  if (phone.startsWith('40') && phone.length >= 11) {
    return `+${phone.slice(0, 2)} ${phone.slice(2, 5)} ${phone.slice(5, 8)} ${phone.slice(8)}`
  }
  return phone
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    DELIVERED: 'bg-green-100 text-green-800',
    SENT: 'bg-blue-100 text-blue-800',
    QUEUE: 'bg-yellow-100 text-yellow-800',
    ACCEPTED: 'bg-indigo-100 text-indigo-800',
    UNDELIVERED: 'bg-red-100 text-red-800',
    FAILED: 'bg-red-100 text-red-800',
    REJECTED: 'bg-orange-100 text-orange-800',
    EXPIRED: 'bg-gray-100 text-gray-800',
    UNKNOWN: 'bg-gray-100 text-gray-600',
    PENDING: 'bg-yellow-100 text-yellow-700',
    ERROR: 'bg-red-100 text-red-800',
  }
  return map[status] ?? 'bg-gray-100 text-gray-600'
}
