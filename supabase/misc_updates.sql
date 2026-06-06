-- Misc updates
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_type text DEFAULT 'gross' CHECK (salary_type IN ('gross','net'));
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS company_notes text;
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS external_status text CHECK (external_status IN ('invite_interview','offer','waitlist','reject'));
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS worker_user_id uuid REFERENCES auth.users(id);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS company_size text;
