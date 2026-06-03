-- ============================================================
-- Lookout — Таблица вакансий
-- Добавь в Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS jobs (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id        uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  title             text NOT NULL,
  description       text NOT NULL,
  requirements      text,
  nice_to_have      text,

  category          text,
  employment_type   text DEFAULT 'full-time'
                    CHECK (employment_type IN ('full-time','part-time','contract','intern','remote')),
  experience_level  text CHECK (experience_level IN ('intern','junior','middle','senior','lead','any')),

  salary_from       bigint,
  salary_to         bigint,
  salary_currency   text DEFAULT 'KZT',
  salary_visible    boolean DEFAULT true,

  city              text,
  is_remote         boolean DEFAULT false,

  contact_email     text,
  contact_name      text,

  is_active         boolean DEFAULT true,
  views_count       integer DEFAULT 0,
  applies_count     integer DEFAULT 0,

  expires_at        timestamptz DEFAULT (now() + interval '30 days'),
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_active ON jobs(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);
CREATE INDEX IF NOT EXISTS idx_jobs_city ON jobs(city);

-- RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jobs_public_read"  ON jobs FOR SELECT USING (is_active = true);
CREATE POLICY "jobs_public_insert" ON jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "jobs_update" ON jobs FOR UPDATE USING (true);

-- Обновление updated_at
CREATE TRIGGER trg_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Добавляем счётчик вакансий в companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS jobs_count integer DEFAULT 0;
