-- ============================================================
-- Lookout — Обновление схемы под Glassdoor модель
-- Выполни в Supabase SQL Editor
-- ============================================================

-- ─── Обновляем таблицу отзывов сотрудников ────────────────
ALTER TABLE reviews_employee
  ADD COLUMN IF NOT EXISTS recommend          boolean,
  ADD COLUMN IF NOT EXISTS ceo_approval       text CHECK (ceo_approval IN ('positive','neutral','negative')),
  ADD COLUMN IF NOT EXISTS business_outlook   text CHECK (business_outlook IN ('positive','neutral','negative')),
  ADD COLUMN IF NOT EXISTS rating_culture     integer CHECK (rating_culture BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS rating_management  integer CHECK (rating_management BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS rating_worklife    integer CHECK (rating_worklife BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS rating_compensation integer CHECK (rating_compensation BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS rating_career      integer CHECK (rating_career BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS employment_type    text DEFAULT 'full-time',
  ADD COLUMN IF NOT EXISTS location           text;

-- Делаем отзывы публичными без верификации (Glassdoor стиль)
ALTER TABLE reviews_employee
  ALTER COLUMN is_published SET DEFAULT true,
  ALTER COLUMN verification_status SET DEFAULT 'unverified';

-- ─── Таблица зарплат ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS salaries (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id        uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id           uuid REFERENCES auth.users(id),

  position_title    text NOT NULL,
  position_category text,
  experience_level  text CHECK (experience_level IN ('intern','junior','middle','senior','lead','manager','director')),
  experience_years  integer,
  employment_type   text DEFAULT 'full-time' CHECK (employment_type IN ('full-time','part-time','contract','intern')),

  salary_monthly    bigint NOT NULL,   -- Брутто в тенге
  salary_net        bigint,            -- Нетто (опционально)
  bonus_annual      bigint,            -- Годовой бонус

  city              text,
  year              integer DEFAULT EXTRACT(YEAR FROM NOW())::integer,
  is_published      boolean DEFAULT true,
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_salaries_company ON salaries(company_id);
CREATE INDEX IF NOT EXISTS idx_salaries_position ON salaries(position_category);
CREATE INDEX IF NOT EXISTS idx_salaries_city ON salaries(city);

-- RLS для зарплат
ALTER TABLE salaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "salaries_public_read" ON salaries FOR SELECT USING (is_published = true);
CREATE POLICY "salaries_insert" ON salaries FOR INSERT WITH CHECK (true);

-- ─── Обновляем метрики компании ───────────────────────────
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS recommend_pct    integer DEFAULT 0,  -- % рекомендуют
  ADD COLUMN IF NOT EXISTS ceo_approval_pct integer DEFAULT 0,  -- % одобряют CEO
  ADD COLUMN IF NOT EXISTS salaries_count   integer DEFAULT 0;  -- кол-во зарплат

-- ─── Функция пересчёта Glassdoor метрик ───────────────────
CREATE OR REPLACE FUNCTION recalculate_glassdoor_metrics(p_company_id uuid)
RETURNS void AS $$
DECLARE
  v_total       integer;
  v_recommend   integer;
  v_ceo_pos     integer;
  v_sal_count   integer;
BEGIN
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE recommend = true),
    COUNT(*) FILTER (WHERE ceo_approval = 'positive')
  INTO v_total, v_recommend, v_ceo_pos
  FROM reviews_employee
  WHERE company_id = p_company_id AND is_published = true;

  SELECT COUNT(*) INTO v_sal_count
  FROM salaries WHERE company_id = p_company_id AND is_published = true;

  UPDATE companies SET
    recommend_pct    = CASE WHEN v_total > 0 THEN (v_recommend * 100 / v_total) ELSE 0 END,
    ceo_approval_pct = CASE WHEN v_total > 0 THEN (v_ceo_pos * 100 / v_total) ELSE 0 END,
    salaries_count   = v_sal_count,
    reviews_count    = v_total,
    updated_at       = now()
  WHERE id = p_company_id;
END;
$$ LANGUAGE plpgsql;
