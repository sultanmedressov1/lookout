-- ============================================================
-- Lookout — Уведомления и профили работников
-- Запусти в Supabase SQL Editor
-- ============================================================

-- Уведомления
CREATE TABLE IF NOT EXISTS notifications (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        text NOT NULL, -- new_application, review_approved, job_closed
  title       text NOT NULL,
  message     text,
  link        text,
  is_read     boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_own" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notifications_update" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notifications_service" ON notifications FOR ALL USING (auth.role() = 'service_role');

-- Профили работников
CREATE TABLE IF NOT EXISTS worker_profiles (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       text,
  phone           text,
  city            text,
  about           text,
  education       text,
  experience_years integer,
  current_position text,
  skills          text, -- через запятую
  is_public       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE worker_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "worker_profiles_own" ON worker_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "worker_profiles_service" ON worker_profiles FOR ALL USING (auth.role() = 'service_role');

-- Добавляем profile_id к откликам
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS worker_profile_id uuid REFERENCES worker_profiles(id);
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS applicant_phone text;
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS applicant_city text;
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS applicant_about text;
