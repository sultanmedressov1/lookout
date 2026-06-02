// ─── Типы базы данных TrustLink ───────────────────────────

export type CompanyStatus = 'active' | 'liquidating' | 'liquidated' | 'suspended' | 'reorganizing'
export type ReviewVerificationStatus = 'pending' | 'verified' | 'rejected' | 'unverified'
export type CompanyPlan = 'free' | 'basic' | 'employer_branding'

// ─── Компания ────────────────────────────────────────────
export interface Company {
  id: string
  bin: string
  name_ru: string
  name_kz: string | null
  status: CompanyStatus
  registration_date: string | null
  legal_form: string | null
  industry_code: string | null
  industry_name: string | null
  address: string | null
  region: string | null
  city: string | null
  director_name: string | null
  charter_capital: number | null
  employee_range: string | null

  // Метрики
  court_cases_count: number
  active_cases_count: number
  has_tax_debt: boolean
  tax_debt_amount: number
  reviews_count: number
  avg_rating: number | null

  // Скоры
  risk_score: number
  kyb_score: number
  trust_rank_score: number

  slug: string | null
  profile_views: number
  is_claimed: boolean
  last_scraped_at: string | null
  created_at: string
  updated_at: string
}

// ─── Судебное дело ───────────────────────────────────────
export interface CourtCase {
  id: string
  company_id: string
  case_number: string | null
  case_date: string | null
  case_type: string | null   // civil, tax, criminal, administrative, bankruptcy
  case_status: string | null // active, completed, appeal, enforcement
  role: string | null        // plaintiff, defendant, third_party
  counterparty: string | null
  amount: number | null
  court_name: string | null
  result: string | null
  result_date: string | null
  source_url: string | null
  scraped_at: string
}

// ─── Налоговая запись ────────────────────────────────────
export interface TaxRecord {
  id: string
  company_id: string
  record_type: string   // debt, restriction, blacklist, paid
  amount: number | null
  description: string | null
  date_from: string | null
  date_to: string | null
  is_active: boolean
  scraped_at: string
}

// ─── Отзыв сотрудника ────────────────────────────────────
export interface EmployeeReview {
  id: string
  company_id: string
  user_id: string | null

  rating_overall: number
  rating_salary: number | null
  rating_management: number | null
  rating_culture: number | null
  rating_growth: number | null

  title: string
  pros: string | null
  cons: string | null
  advice_to_management: string | null

  is_current_employee: boolean | null
  employment_year_start: number | null
  employment_year_end: number | null
  position_category: string | null

  verification_status: ReviewVerificationStatus
  verification_type: string | null

  is_published: boolean
  helpful_count: number
  created_at: string
}

// ─── Отзыв контрагента ───────────────────────────────────
export interface CounterpartyReview {
  id: string
  company_id: string
  user_id: string | null
  reviewer_company_bin: string | null
  reviewer_company_name: string | null

  rating_overall: number
  rating_payment: number | null
  rating_communication: number | null
  rating_quality: number | null

  title: string
  content: string
  deal_year: number | null
  deal_type: string | null

  confirmation_status: string
  is_mutual: boolean
  verification_status: ReviewVerificationStatus
  is_published: boolean
  weight: number
  created_at: string
}

// ─── Профиль компании ────────────────────────────────────
export interface CompanyProfile {
  id: string
  company_id: string
  user_id: string
  is_verified: boolean
  verified_at: string | null
  plan: CompanyPlan
  plan_expires_at: string | null
  description_ru: string | null
  description_kz: string | null
  website: string | null
  phone: string | null
  email: string | null
  logo_url: string | null
  cover_url: string | null
  social_links: Record<string, string>
  can_respond_reviews: boolean
  show_in_top_employers: boolean
  created_at: string
}

// ─── Полный профиль компании (для страницы) ──────────────
export interface CompanyFull extends Company {
  court_cases?: CourtCase[]
  tax_records?: TaxRecord[]
  employee_reviews?: EmployeeReview[]
  counterparty_reviews?: CounterpartyReview[]
  company_profile?: CompanyProfile | null
}

// ─── Результат поиска ────────────────────────────────────
export interface SearchResult {
  id: string
  bin: string
  name_ru: string
  name_kz: string | null
  status: CompanyStatus
  legal_form: string | null
  city: string | null
  risk_score: number
  reviews_count: number
  avg_rating: number | null
  relevance: number
}

// ─── Форма отзыва сотрудника ─────────────────────────────
export interface EmployeeReviewForm {
  rating_overall: number
  rating_salary: number
  rating_management: number
  rating_culture: number
  rating_growth: number
  title: string
  pros: string
  cons: string
  advice_to_management: string
  is_current_employee: boolean
  employment_year_start: number
  employment_year_end?: number
  position_category: string
  verification_type: 'email' | 'contract_photo' | 'linkedin'
}
