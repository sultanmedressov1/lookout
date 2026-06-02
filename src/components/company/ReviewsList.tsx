'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Star, ShieldCheck, MessageSquare, ThumbsUp } from 'lucide-react'
import { timeAgo } from '@/lib/utils'
import type { EmployeeReview, CounterpartyReview } from '@/types'

interface ReviewsListProps {
  type: 'employee' | 'counterparty'
  reviews: (EmployeeReview | CounterpartyReview)[]
  companyId: string
  companyName: string
}

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-3.5 h-3.5 ${star <= value ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
        />
      ))}
    </div>
  )
}

export function ReviewsList({ type, reviews, companyId, companyName }: ReviewsListProps) {
  const isEmployee = type === 'employee'
  const title = isEmployee ? 'Отзывы сотрудников' : 'Отзывы контрагентов'
  const addUrl = `/reviews/add?company=${companyId}&type=${type}`

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      {/* Заголовок */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-slate-500" />
          <h2 className="font-semibold text-slate-900">{title}</h2>
          {reviews.length > 0 && (
            <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2 py-0.5 rounded-full">
              {reviews.length}
            </span>
          )}
        </div>
        <Link
          href={addUrl}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
        >
          + Оставить отзыв
        </Link>
      </div>

      {/* Список */}
      {reviews.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <div className="text-slate-400 text-sm mb-3">Отзывов пока нет</div>
          <Link
            href={addUrl}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Стать первым
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} type={type} />
          ))}
        </div>
      )}
    </div>
  )
}

function ReviewCard({ review, type }: { review: EmployeeReview | CounterpartyReview; type: string }) {
  const [helpful, setHelpful] = useState(false)
  const isEmployee = type === 'employee'
  const empReview = review as EmployeeReview
  const cptyReview = review as CounterpartyReview

  return (
    <div className="px-6 py-5">
      {/* Заголовок */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <StarRating value={review.rating_overall} />
            <span className="text-sm font-medium text-slate-700">{review.rating_overall}/5</span>
            {review.verification_status === 'verified' && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">
                <ShieldCheck className="w-3 h-3" />
                Верифицирован
              </span>
            )}
          </div>
          <h3 className="font-medium text-slate-900 text-sm">{isEmployee ? empReview.title : cptyReview.title}</h3>
        </div>
        <div className="text-xs text-slate-400 flex-shrink-0">{timeAgo(review.created_at)}</div>
      </div>

      {/* Контент для сотрудника */}
      {isEmployee && empReview.pros && (
        <div className="space-y-2 mb-3">
          {empReview.pros && (
            <div>
              <span className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Плюсы</span>
              <p className="text-sm text-slate-600 mt-0.5">{empReview.pros}</p>
            </div>
          )}
          {empReview.cons && (
            <div>
              <span className="text-xs font-medium text-red-500 uppercase tracking-wide">Минусы</span>
              <p className="text-sm text-slate-600 mt-0.5">{empReview.cons}</p>
            </div>
          )}
        </div>
      )}

      {/* Контент для контрагента */}
      {!isEmployee && (
        <p className="text-sm text-slate-600 mb-3">{cptyReview.content}</p>
      )}

      {/* Мета */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3 text-xs text-slate-400">
          {isEmployee && empReview.position_category && (
            <span>{empReview.position_category}</span>
          )}
          {isEmployee && empReview.is_current_employee !== null && (
            <span>{empReview.is_current_employee ? 'Текущий сотрудник' : 'Бывший сотрудник'}</span>
          )}
          {!isEmployee && cptyReview.deal_year && (
            <span>Сделка: {cptyReview.deal_year}</span>
          )}
          {!isEmployee && cptyReview.deal_type && (
            <span>{cptyReview.deal_type}</span>
          )}
        </div>

        {/* Полезно */}
        <button
          onClick={() => setHelpful(!helpful)}
          className={`flex items-center gap-1 text-xs transition-colors ${helpful ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          {(isEmployee ? (empReview.helpful_count || 0) : 0) + (helpful ? 1 : 0)}
        </button>
      </div>
    </div>
  )
}
