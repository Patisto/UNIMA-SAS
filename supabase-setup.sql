-- Supabase SQL — run this in your Supabase SQL editor

-- Submissions table (one row per person who submits)
CREATE TABLE submissions (
  id BIGSERIAL PRIMARY KEY,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nominations table (multiple rows per submission)
CREATE TABLE nominations (
  id BIGSERIAL PRIMARY KEY,
  position_key TEXT NOT NULL,
  gender TEXT NOT NULL,        -- 'male' or 'female'
  nominee_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
