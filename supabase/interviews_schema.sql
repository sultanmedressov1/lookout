-- ============================================================
-- Lookout — Отзывы об интервью
-- Запусти в Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS reviews_interview (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id        uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id           uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Оценки
  rating_overall    integer NOT NULL CHECK (rating_overall BETWEEN 1 AND 5),
  experience        text CHECK (experience IN ('positive','neutral','negative')),
  difficulty        text CHECK (difficulty IN ('easy','average','difficult')),
  offer_received    text CHECK (offer_received IN ('yes','no','declined')),

  -- Контент
  title             text NOT NULL,
  description       text,
  questions         text,  -- Вопросы которые задавали

  -- Мета
  position_category text,
  position_title    text,
  duration_weeks    integer,
  year              integer DEFAULT EXTRACT(YEAR FROM NOW())::integer,

  is_published      boolean DEFAULT true,
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interviews_company ON reviews_interview(company_id);

ALTER TABLE reviews_interview ENABLE ROW LEVEL SECURITY;
CREATE POLICY "interviews_public_read" ON reviews_interview FOR SELECT USING (is_published = true);
CREATE POLICY "interviews_insert" ON reviews_interview FOR INSERT WITH CHECK (true);
CREATE POLICY "interviews_service" ON reviews_interview FOR ALL USING (auth.role() = 'service_role');

-- Добавляем счётчик в companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS interviews_count integer DEFAULT 0;
