-- Запусти в Supabase SQL Editor

-- Таблица заявок бизнеса на модерацию
CREATE TABLE IF NOT EXISTS business_requests (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        uuid REFERENCES auth.users(id),
  company_name   text NOT NULL,
  company_bin    varchar(12) NOT NULL,
  contact_name   text,
  contact_email  text NOT NULL,
  status         text DEFAULT 'pending'
                 CHECK (status IN ('pending','approved','rejected')),
  admin_note     text,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

-- Только сервис может читать/писать
ALTER TABLE business_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "requests_service" ON business_requests
  USING (auth.role() = 'service_role');

-- Пользователь видит только свою заявку
CREATE POLICY "requests_own_read" ON business_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "requests_insert" ON business_requests
  FOR INSERT WITH CHECK (true);
