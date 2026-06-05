import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { CompanyStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Риск-балл ───────────────────────────────────────────
export function getRiskLevel(score: number): 'low' | 'medium' | 'high' {
  if (score >= 70) return 'low'
  if (score >= 40) return 'medium'
  return 'high'
}

export function getRiskLabel(score: number): string {
  if (score >= 70) return 'Надёжная'
  if (score >= 40) return 'Умеренный риск'
  return 'Высокий риск'
}

export function getRiskColor(score: number): string {
  if (score >= 70) return 'text-emerald-600'
  if (score >= 40) return 'text-amber-600'
  return 'text-red-600'
}

export function getRiskBg(score: number): string {
  if (score >= 70) return 'bg-emerald-50 border-emerald-200'
  if (score >= 40) return 'bg-amber-50 border-amber-200'
  return 'bg-red-50 border-red-200'
}

// ─── Статус компании ─────────────────────────────────────
export function getStatusLabel(status: CompanyStatus): string {
  const labels: Record<CompanyStatus, string> = {
    active: 'Активна',
    liquidating: 'Ликвидируется',
    liquidated: 'Ликвидирована',
    suspended: 'Приостановлена',
    reorganizing: 'Реорганизация',
  }
  return labels[status] || status
}

export function getStatusColor(status: CompanyStatus): string {
  const colors: Record<CompanyStatus, string> = {
    active: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    liquidating: 'text-orange-700 bg-orange-50 border-orange-200',
    liquidated: 'text-red-700 bg-red-50 border-red-200',
    suspended: 'text-yellow-700 bg-yellow-50 border-yellow-200',
    reorganizing: 'text-blue-700 bg-blue-50 border-blue-200',
  }
  return colors[status] || 'text-gray-700 bg-gray-50'
}

// ─── Форматирование ──────────────────────────────────────
export function formatMoney(amount: number | null): string {
  if (!amount) return '—'
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)} млрд ₸`
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)} млн ₸`
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)} тыс ₸`
  return `${amount} ₸`
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatBin(bin?: string): string {
  if (!bin) return ''
  return bin.replace(/(\d{6})(\d{6})/, '$1 $2')
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'сегодня'
  if (days === 1) return 'вчера'
  if (days < 30) return `${days} дн. назад`
  if (days < 365) return `${Math.floor(days / 30)} мес. назад`
  return `${Math.floor(days / 365)} лет назад`
}

// ─── Slug ────────────────────────────────────────────────
export function generateSlug(name?: string, bin?: string): string {
  if (!name) name = 'company'
  if (!bin) bin = '000000'

  const safeName = name.toLowerCase()

  const slug = safeName
    .replace(/[а-яё]/g, (char) => {
      const map: Record<string, string> = {
        а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',
        и:'i',й:'j',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',
        с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'ts',ч:'ch',ш:'sh',
        щ:'sch',ы:'y',э:'e',ю:'yu',я:'ya',
      }
      return map[char] ?? char
    })
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  return `${slug || 'company'}-${bin.slice(-6)}`
}
