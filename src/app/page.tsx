import Link from 'next/link'
import { SearchBar } from '@/components/search/SearchBar'
import {
  Shield, Star, Building2, TrendingUp,
  CheckCircle2, ArrowRight, Users, Scale, AlertTriangle
} from 'lucide-react'

const POPULAR_SEARCHES = [
  'Казахтелеком', 'Народный банк', 'Kaspi', 'Самрук-Казына', 'Beeline'
]

const STATS = [
  { value: '500K+', label: 'Компаний в базе' },
  { value: '100%', label: 'Бесплатно для всех' },
  { value: 'КГД + eGov', label: 'Официальные данные' },
  { value: 'ежедневно', label: 'Обновление базы' },
]

const USE_CASES = [
  {
    icon: Building2,
    color: 'bg-blue-50 text-blue-600',
    title: 'Проверьте контрагента',
    desc: 'Узнайте о судах, налоговых долгах и владельцах компании до подписания договора.',
    href: '/search',
    cta: 'Проверить компанию',
  },
  {
    icon: Star,
    color: 'bg-emerald-50 text-emerald-600',
    title: 'Найдите честного работодателя',
    desc: 'Реальные отзывы сотрудников о зарплатах, культуре и руководстве — до подписания договора.',
    href: '/employers',
    cta: 'Смотреть отзывы',
  },
  {
    icon: Shield,
    color: 'bg-purple-50 text-purple-600',
    title: 'Защититесь от мошенников',
    desc: 'Фирма-однодневка или реальный бизнес? Проверьте за 30 секунд по официальным реестрам.',
    href: '/search',
    cta: 'Проверить сейчас',
  },
]

const HOW_IT_WORKS = [
  {
    icon: Scale,
    color: 'text-blue-600 bg-blue-50',
    title: 'Официальные реестры',
    items: ['КГД — налоговые долги и статус', 'eGov — регистрационные данные', 'Sud.kz — судебные дела', 'Обновляется автоматически'],
  },
  {
    icon: Users,
    color: 'text-emerald-600 bg-emerald-50',
    title: 'Верифицированные отзывы',
    items: ['Сотрудники подтверждают через корп. почту', 'Контрагенты — через счёт-фактуру', 'AI-модерация от фейков', 'Анонимность гарантирована'],
  },
]

export default function HomePage() {
  return (
    <div>

      {/* ─── Hero ──────────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-blue-600 to-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 py-16 md:py-24 text-center">
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
            Будьте на шаг впереди.
            <br />
            <span className="text-blue-200">Проверяйте до того, как доверять.</span>
          </h1>
          <p className="text-blue-100 text-lg mb-10 max-w-xl mx-auto">
            Реестр, суды, налоги и честные отзывы сотрудников — всё бесплатно в одном месте.
          </p>

          {/* Поиск */}
          <div className="max-w-2xl mx-auto mb-6">
            <SearchBar size="lg" theme="dark" />
          </div>

          {/* Популярные поиски */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="text-blue-300 text-sm">Популярные:</span>
            {POPULAR_SEARCHES.map((name) => (
              <Link
                key={name}
                href={`/search?q=${encodeURIComponent(name)}`}
                className="text-sm text-blue-100 hover:text-white bg-blue-500/40 hover:bg-blue-500/60 px-3 py-1 rounded-full transition-colors"
              >
                {name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Статистика ────────────────────────────────────────── */}
      <section className="border-b border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {STATS.map((s) => (
              <div key={s.label}>
                <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                <div className="text-sm text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Для кого ──────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Кому нужен Lookout
          </h2>
          <p className="text-gray-500 text-center mb-10">
            Три ситуации — один инструмент
          </p>
          <div className="grid md:grid-cols-3 gap-5">
            {USE_CASES.map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color} mb-4`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-5">{item.desc}</p>
                <Link
                  href={item.href}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {item.cta} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Как работает ──────────────────────────────────────── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Как работают данные
          </h2>
          <p className="text-gray-500 text-center mb-10">
            Два слоя информации, которых нет нигде больше
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {HOW_IT_WORKS.map((block) => (
              <div key={block.title} className="border border-gray-200 rounded-xl p-6">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${block.color} mb-4`}>
                  <block.icon className="w-4.5 h-4.5" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-4">{block.title}</h3>
                <ul className="space-y-2.5">
                  {block.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA для бизнеса ───────────────────────────────────── */}
      <section className="py-14 px-4 bg-gray-50 border-t border-gray-200">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Вы представляете компанию?
          </h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Заявите профиль, отвечайте на отзывы и управляйте репутацией на Lookout.
            Базовый профиль — бесплатно.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/claim"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              Заявить профиль компании
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium px-6 py-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
            >
              Узнать подробнее
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
