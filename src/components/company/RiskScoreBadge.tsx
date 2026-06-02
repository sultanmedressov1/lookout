import { getRiskLevel, getRiskLabel, getRiskColor, getRiskBg } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface RiskScoreBadgeProps {
  score: number
  size?: 'sm' | 'default' | 'lg'
  showLabel?: boolean
}

export function RiskScoreBadge({ score, size = 'default', showLabel = true }: RiskScoreBadgeProps) {
  const level = getRiskLevel(score)

  const sizeClasses = {
    sm: 'w-10 h-10 text-sm',
    default: 'w-14 h-14 text-lg',
    lg: 'w-20 h-20 text-2xl',
  }

  const labelSizes = {
    sm: 'text-xs',
    default: 'text-xs',
    lg: 'text-sm',
  }

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Круговой индикатор */}
      <div className={cn(
        'rounded-full border-2 flex items-center justify-center font-bold',
        sizeClasses[size],
        level === 'low' && 'border-emerald-400 bg-emerald-50 text-emerald-700',
        level === 'medium' && 'border-amber-400 bg-amber-50 text-amber-700',
        level === 'high' && 'border-red-400 bg-red-50 text-red-700',
      )}>
        {score}
      </div>

      {showLabel && (
        <span className={cn('font-medium', labelSizes[size], getRiskColor(score))}>
          {getRiskLabel(score)}
        </span>
      )}
    </div>
  )
}
