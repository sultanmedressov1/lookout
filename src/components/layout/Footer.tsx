import Link from 'next/link'
import { Eye } from 'lucide-react'

const LINKS = {
  'Продукт': [
    ['Поиск компаний', '/search'],
    ['Работодатели', '/employers'],
    ['Оставить отзыв', '/reviews/add'],
    ['Для бизнеса', '/claim'],
  ],
  'Данные': [
    ['КГД — налоги', 'https://kgd.gov.kz'],
    ['eGov — реестр', 'https://egov.kz'],
    ['Sud.kz — суды', 'https://sud.kz'],
    ['Как мы работаем', '/about'],
  ],
  'Компания': [
    ['О Lookout', '/about'],
    ['Блог', '/blog'],
    ['Контакты', '/contact'],
    ['API для бизнеса', '/api-docs'],
  ],
  'Правовое': [
    ['Конфиденциальность', '/privacy'],
    ['Условия использования', '/terms'],
    ['Правила отзывов', '/review-policy'],
  ],
}

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 pt-12 pb-8 mt-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">

          {/* Бренд */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                <Eye className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-gray-900">Lookout</span>
            </Link>
            <p className="text-xs text-gray-400 leading-relaxed">
              Проверка компаний Казахстана. Официальные данные + верифицированные отзывы. Бесплатно.
            </p>
          </div>

          {/* Ссылки */}
          {Object.entries(LINKS).map(([section, items]) => (
            <div key={section}>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                {section}
              </div>
              <ul className="space-y-2">
                {items.map(([label, href]) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-400">
            © 2024 Lookout.kz. Данные носят информационный характер и обновляются из официальных источников.
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>🇰🇿 Казахстан</span>
            <span>Все данные публичны</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
