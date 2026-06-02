-- ============================================================
-- TRUSTLINK — Полная схема базы данных
-- Копируй и выполняй в Supabase SQL Editor
-- ============================================================

-- ─── РАСШИРЕНИЯ ────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- Для нечёткого поиска по названию

-- ─── ТИПЫ (ENUMS) ──────────────────────────────────────────
create type company_status as enum (
  'active',        -- Активна
  'liquidating',   -- В процессе ликвидации
  'liquidated',    -- Ликвидирована
  'suspended',     -- Приостановлена
  'reorganizing'   -- Реорганизация
);

create type review_verification_status as enum (
  'pending',      -- На проверке
  'verified',     -- Верифицирован
  'rejected',     -- Отклонён
  'unverified'    -- Опубликован без верификации
);

create type company_plan as enum (
  'free',              -- Бесплатный (заявка)
  'basic',             -- Базовый — ответы на отзывы
  'employer_branding'  -- Полный Employer Branding
);

-- ─── 1. КОМПАНИИ ───────────────────────────────────────────
create table companies (
  id                  uuid primary key default uuid_generate_v4(),
  bin                 varchar(12) unique not null,       -- БИН компании
  name_ru             text not null,                     -- Название на русском
  name_kz             text,                              -- Название на казахском
  status              company_status default 'active',
  registration_date   date,
  legal_form          text,                              -- ТОО, АО, ИП, ГП...
  industry_code       varchar(10),                       -- Код по ОКЭД
  industry_name       text,
  address             text,
  region              text,
  city                text,
  director_name       text,                              -- Только имя, без ИИН!
  charter_capital     bigint,                            -- Уставный капитал в тенге
  employee_range      text,                              -- "1-10", "11-50", "51-200"...

  -- Агрегированные метрики (обновляются автоматически)
  court_cases_count   integer default 0,
  active_cases_count  integer default 0,
  has_tax_debt        boolean default false,
  tax_debt_amount     bigint default 0,
  reviews_count       integer default 0,
  avg_rating          numeric(3,2),

  -- Скоры (0-100)
  risk_score          integer default 50 check (risk_score between 0 and 100),
  kyb_score           integer default 50 check (kyb_score between 0 and 100),
  trust_rank_score    integer default 50 check (trust_rank_score between 0 and 100),

  -- SEO & profile
  slug                text unique,  -- URL-friendly: "too-arman-stroy"
  profile_views       integer default 0,
  is_claimed          boolean default false,  -- Заявлен ли профиль компанией

  -- Служебное
  last_scraped_at     timestamptz,
  data_quality_score  integer default 0,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- Индексы для быстрого поиска
create index idx_companies_bin on companies(bin);
create index idx_companies_name_ru_trgm on companies using gin(name_ru gin_trgm_ops);
create index idx_companies_name_kz_trgm on companies using gin(name_kz gin_trgm_ops);
create index idx_companies_status on companies(status);
create index idx_companies_region on companies(region);
create index idx_companies_industry on companies(industry_code);
create index idx_companies_risk_score on companies(risk_score);

-- ─── 2. ИСТОРИЯ СОБСТВЕННИКОВ ──────────────────────────────
create table company_owners (
  id              uuid primary key default uuid_generate_v4(),
  company_id      uuid not null references companies(id) on delete cascade,
  owner_type      text check (owner_type in ('individual', 'company')),
  owner_name      text not null,       -- Только имя физлица, БИН компании
  ownership_share numeric(5,2),        -- Доля в %
  date_from       date,
  date_to         date,
  is_current      boolean default true,
  scraped_at      timestamptz default now()
);

create index idx_owners_company on company_owners(company_id);

-- ─── 3. СУДЕБНЫЕ ДЕЛА ──────────────────────────────────────
create table court_cases (
  id              uuid primary key default uuid_generate_v4(),
  company_id      uuid not null references companies(id) on delete cascade,
  case_number     text,
  case_date       date,
  case_type       text,    -- civil, tax, criminal, administrative, bankruptcy
  case_status     text,    -- active, completed, appeal, enforcement
  role            text,    -- plaintiff, defendant, third_party
  counterparty    text,    -- Анонимизировано если физлицо
  amount          bigint,  -- Сумма иска в тенге
  court_name      text,
  judge_name      text,
  result          text,
  result_date     date,
  source_url      text,
  scraped_at      timestamptz default now()
);

create index idx_cases_company on court_cases(company_id);
create index idx_cases_status on court_cases(case_status);
create index idx_cases_type on court_cases(case_type);

-- ─── 4. НАЛОГОВЫЕ ДАННЫЕ ───────────────────────────────────
create table tax_records (
  id              uuid primary key default uuid_generate_v4(),
  company_id      uuid not null references companies(id) on delete cascade,
  record_type     text,       -- debt, restriction, blacklist, paid
  amount          bigint,
  description     text,
  date_from       date,
  date_to         date,
  is_active       boolean default true,
  scraped_at      timestamptz default now()
);

create index idx_tax_company on tax_records(company_id);

-- ─── 5. ОТЗЫВЫ СОТРУДНИКОВ ─────────────────────────────────
create table reviews_employee (
  id                      uuid primary key default uuid_generate_v4(),
  company_id              uuid not null references companies(id) on delete cascade,
  user_id                 uuid references auth.users(id),  -- null = анонимно

  -- Рейтинги (1-5)
  rating_overall          integer not null check (rating_overall between 1 and 5),
  rating_salary           integer check (rating_salary between 1 and 5),
  rating_management       integer check (rating_management between 1 and 5),
  rating_culture          integer check (rating_culture between 1 and 5),
  rating_growth           integer check (rating_growth between 1 and 5),

  -- Контент
  title                   text not null,
  pros                    text,        -- Плюсы
  cons                    text,        -- Минусы
  advice_to_management    text,        -- Совет руководству

  -- Метаданные (анонимизированные)
  is_current_employee     boolean,
  employment_year_start   integer,
  employment_year_end     integer,
  position_category       text,  -- "Менеджмент", "IT", "Продажи" (общая категория)

  -- Верификация
  verification_status     review_verification_status default 'pending',
  verification_type       text,  -- email, contract_photo, linkedin
  verification_data       text,  -- Хэш верификационных данных (не оригинал!)

  -- Модерация
  is_published            boolean default false,
  moderation_notes        text,
  moderated_at            timestamptz,

  -- Реакции
  helpful_count           integer default 0,

  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

create index idx_emp_reviews_company on reviews_employee(company_id);
create index idx_emp_reviews_published on reviews_employee(company_id, is_published);
create index idx_emp_reviews_user on reviews_employee(user_id);

-- ─── 6. ОТЗЫВЫ КОНТРАГЕНТОВ ────────────────────────────────
create table reviews_counterparty (
  id                      uuid primary key default uuid_generate_v4(),
  company_id              uuid not null references companies(id) on delete cascade,
  user_id                 uuid references auth.users(id),
  reviewer_company_bin    varchar(12),   -- БИН компании, оставляющей отзыв
  reviewer_company_name   text,

  -- Рейтинги (1-5)
  rating_overall          integer not null check (rating_overall between 1 and 5),
  rating_payment          integer check (rating_payment between 1 and 5),      -- Платёжная дисциплина
  rating_communication    integer check (rating_communication between 1 and 5),
  rating_quality          integer check (rating_quality between 1 and 5),

  -- Контент
  title                   text not null,
  content                 text not null,
  deal_year               integer,
  deal_type               text,  -- goods, services, construction, it, logistics

  -- Верификация через сделку
  invoice_reference_hash  text,   -- Хэш номера счёта-фактуры (не сам номер!)
  confirmation_status     text default 'pending',  -- pending, confirmed, rejected
  is_mutual               boolean default false,   -- Обе стороны подтвердили

  -- Модерация
  verification_status     review_verification_status default 'pending',
  is_published            boolean default false,
  moderation_notes        text,
  weight                  numeric(3,2) default 1.0,  -- Вес в алгоритме (1.0 = обычный, 1.5 = верифицирован)

  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

create index idx_cpty_reviews_company on reviews_counterparty(company_id);
create index idx_cpty_reviews_published on reviews_counterparty(company_id, is_published);

-- ─── 7. ПРОФИЛИ КОМПАНИЙ (платный функционал) ──────────────
create table company_profiles (
  id                uuid primary key default uuid_generate_v4(),
  company_id        uuid unique not null references companies(id) on delete cascade,
  user_id           uuid not null references auth.users(id),  -- Кто управляет профилем

  -- Верификация компании
  is_verified       boolean default false,
  verified_at       timestamptz,

  -- Тариф
  plan              company_plan default 'free',
  plan_expires_at   timestamptz,

  -- Публичный профиль
  description_ru    text,
  description_kz    text,
  website           text,
  phone             text,
  email             text,
  logo_url          text,
  cover_url         text,
  social_links      jsonb default '{}',  -- {linkedin, instagram, facebook}

  -- Флаги возможностей
  can_respond_reviews   boolean default false,
  show_in_top_employers boolean default false,

  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ─── 8. ОТВЕТЫ КОМПАНИЙ НА ОТЗЫВЫ ─────────────────────────
create table review_responses (
  id                  uuid primary key default uuid_generate_v4(),
  review_type         text not null check (review_type in ('employee', 'counterparty')),
  review_id           uuid not null,
  company_profile_id  uuid not null references company_profiles(id),
  content             text not null,
  is_published        boolean default true,
  created_at          timestamptz default now()
);

-- ─── 9. ЛОГИ СКРАПЕРОВ ─────────────────────────────────────
create table scraper_logs (
  id                    uuid primary key default uuid_generate_v4(),
  source                text not null,  -- egov, kgd, sud_kz
  status                text,           -- running, completed, failed
  companies_processed   integer default 0,
  companies_updated     integer default 0,
  errors_count          integer default 0,
  error_details         jsonb,
  started_at            timestamptz default now(),
  finished_at           timestamptz
);

-- ─── 10. ИСТОРИЯ РИСК-БАЛЛА ────────────────────────────────
create table risk_score_history (
  id              uuid primary key default uuid_generate_v4(),
  company_id      uuid not null references companies(id) on delete cascade,
  risk_score      integer,
  kyb_score       integer,
  trust_rank_score integer,
  factors         jsonb,  -- {court_cases: -10, tax_debt: -20, age_bonus: +5, ...}
  calculated_at   timestamptz default now()
);

create index idx_risk_history_company on risk_score_history(company_id, calculated_at desc);

-- ─── ФУНКЦИЯ: Обновление updated_at ────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_companies_updated_at
  before update on companies
  for each row execute function update_updated_at();

create trigger trg_emp_reviews_updated_at
  before update on reviews_employee
  for each row execute function update_updated_at();

create trigger trg_cpty_reviews_updated_at
  before update on reviews_counterparty
  for each row execute function update_updated_at();

-- ─── ФУНКЦИЯ: Пересчёт метрик компании ─────────────────────
create or replace function recalculate_company_metrics(p_company_id uuid)
returns void as $$
declare
  v_court_count     integer;
  v_active_cases    integer;
  v_has_debt        boolean;
  v_debt_amount     bigint;
  v_reviews_count   integer;
  v_avg_rating      numeric;
  v_kyb_score       integer := 50;
  v_trust_score     integer := 50;
  v_risk_score      integer;
  v_reg_date        date;
  v_company_age     integer;
begin
  -- Суды
  select count(*), count(*) filter (where case_status = 'active')
  into v_court_count, v_active_cases
  from court_cases where company_id = p_company_id;

  -- Налоговые долги
  select exists(select 1 from tax_records where company_id = p_company_id and is_active = true and record_type = 'debt'),
         coalesce(sum(amount) filter (where is_active = true and record_type = 'debt'), 0)
  into v_has_debt, v_debt_amount
  from tax_records where company_id = p_company_id;

  -- Отзывы
  select count(*), round(avg(rating_overall), 2)
  into v_reviews_count, v_avg_rating
  from reviews_employee where company_id = p_company_id and is_published = true;

  -- Возраст компании
  select registration_date into v_reg_date from companies where id = p_company_id;
  v_company_age := extract(year from age(current_date, coalesce(v_reg_date, current_date)));

  -- ── KYB Score ──
  -- Базовый балл: 60
  v_kyb_score := 60;
  -- Возраст (до +20)
  v_kyb_score := v_kyb_score + least(v_company_age * 2, 20);
  -- Штраф за судебные дела
  v_kyb_score := v_kyb_score - least(v_court_count * 3, 25);
  -- Активные дела — дополнительный штраф
  v_kyb_score := v_kyb_score - least(v_active_cases * 5, 15);
  -- Налоговый долг
  if v_has_debt then v_kyb_score := v_kyb_score - 20; end if;
  -- Ограничения: не ниже 0, не выше 100
  v_kyb_score := greatest(0, least(100, v_kyb_score));

  -- ── TrustRank Score ──
  if v_reviews_count > 0 then
    v_trust_score := (v_avg_rating / 5.0 * 100)::integer;
    -- Бонус за количество отзывов (достоверность)
    if v_reviews_count >= 10 then v_trust_score := v_trust_score + 5; end if;
    if v_reviews_count >= 30 then v_trust_score := v_trust_score + 5; end if;
    v_trust_score := greatest(0, least(100, v_trust_score));
  else
    v_trust_score := 50; -- Нейтральный если отзывов нет
  end if;

  -- ── Итоговый Риск-балл: 60% KYB + 40% TrustRank ──
  v_risk_score := (v_kyb_score * 0.6 + v_trust_score * 0.4)::integer;

  -- Обновляем компанию
  update companies set
    court_cases_count = v_court_count,
    active_cases_count = v_active_cases,
    has_tax_debt = v_has_debt,
    tax_debt_amount = v_debt_amount,
    reviews_count = v_reviews_count,
    avg_rating = v_avg_rating,
    kyb_score = v_kyb_score,
    trust_rank_score = v_trust_score,
    risk_score = v_risk_score,
    updated_at = now()
  where id = p_company_id;

  -- Сохраняем историю
  insert into risk_score_history (company_id, risk_score, kyb_score, trust_rank_score, factors)
  values (p_company_id, v_risk_score, v_kyb_score, v_trust_score, jsonb_build_object(
    'court_cases', v_court_count,
    'active_cases', v_active_cases,
    'has_tax_debt', v_has_debt,
    'company_age', v_company_age,
    'reviews_count', v_reviews_count,
    'avg_rating', v_avg_rating
  ));
end;
$$ language plpgsql;

-- ─── ФУНКЦИЯ: Поиск компаний ────────────────────────────────
create or replace function search_companies(
  p_query text,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id uuid, bin varchar, name_ru text, name_kz text,
  status company_status, legal_form text, city text,
  risk_score integer, reviews_count integer, avg_rating numeric,
  relevance real
) as $$
begin
  return query
  select
    c.id, c.bin, c.name_ru, c.name_kz,
    c.status, c.legal_form, c.city,
    c.risk_score, c.reviews_count, c.avg_rating,
    greatest(
      similarity(c.name_ru, p_query),
      similarity(coalesce(c.name_kz, ''), p_query),
      case when c.bin = p_query then 1.0 else 0.0 end
    ) as relevance
  from companies c
  where
    c.bin = p_query
    or c.name_ru ilike '%' || p_query || '%'
    or c.name_kz ilike '%' || p_query || '%'
    or similarity(c.name_ru, p_query) > 0.2
  order by relevance desc, c.risk_score desc
  limit p_limit offset p_offset;
end;
$$ language plpgsql;

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────

-- Компании: читают все, пишет только сервис
alter table companies enable row level security;
create policy "companies_public_read" on companies for select using (true);
create policy "companies_service_write" on companies for all using (auth.role() = 'service_role');

-- Суды: читают все, пишет только сервис
alter table court_cases enable row level security;
create policy "cases_public_read" on court_cases for select using (true);
create policy "cases_service_write" on court_cases for all using (auth.role() = 'service_role');

-- Налоги: читают все, пишет только сервис
alter table tax_records enable row level security;
create policy "tax_public_read" on tax_records for select using (true);
create policy "tax_service_write" on tax_records for all using (auth.role() = 'service_role');

-- Отзывы сотрудников: публикованные читают все, свои создаёт залогиненный
alter table reviews_employee enable row level security;
create policy "emp_reviews_public_read" on reviews_employee for select using (is_published = true);
create policy "emp_reviews_insert" on reviews_employee for insert with check (auth.uid() = user_id or user_id is null);
create policy "emp_reviews_own_read" on reviews_employee for select using (auth.uid() = user_id);

-- Отзывы контрагентов: аналогично
alter table reviews_counterparty enable row level security;
create policy "cpty_reviews_public_read" on reviews_counterparty for select using (is_published = true);
create policy "cpty_reviews_insert" on reviews_counterparty for insert with check (auth.uid() = user_id or user_id is null);

-- Профили компаний: публичные данные читают все, редактирует владелец
alter table company_profiles enable row level security;
create policy "profiles_public_read" on company_profiles for select using (true);
create policy "profiles_owner_write" on company_profiles for all using (auth.uid() = user_id);

-- ─── ТЕСТОВЫЕ ДАННЫЕ ────────────────────────────────────────
insert into companies (bin, name_ru, name_kz, status, registration_date, legal_form, industry_name, city, region, risk_score, kyb_score, trust_rank_score)
values
  ('050340009739', 'Казахтелеком АО', 'Қазақтелеком АҚ', 'active', '1994-04-18', 'АО', 'Телекоммуникации', 'Алматы', 'Алматинская', 82, 88, 73),
  ('941240000494', 'Народный Банк Казахстана АО', 'Халық Банкі Қазақстан АҚ', 'active', '1994-01-01', 'АО', 'Банковская деятельность', 'Алматы', 'Алматинская', 85, 90, 77),
  ('020540000199', 'Тестовая Компания ТОО', null, 'active', '2002-03-15', 'ТОО', 'Строительство', 'Астана', 'Акмолинская', 38, 42, 32);
