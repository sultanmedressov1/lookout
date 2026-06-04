-- ============================================================
-- Lookout — Отклики на вакансии
-- Запусти в Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS job_applications (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id          uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  company_id      uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  applicant_name  text NOT NULL,
  applicant_email text NOT NULL,
  cover_letter    text,

  status          text DEFAULT 'new'
                  CHECK (status IN ('new','viewed','shortlisted','rejected')),

  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_applications_job ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_company ON job_applications(company_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON job_applications(status);

ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "applications_insert" ON job_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "applications_service" ON job_applications FOR ALL USING (auth.role() = 'service_role');

-- Счётчик откликов в jobs
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS applications_count integer DEFAULT 0;
