-- Drop tables if you are starting fresh, or omit these if you just want to create new ones
-- DROP TABLE IF EXISTS decision_answers;
-- DROP TABLE IF EXISTS decision_questions;
-- DROP TABLE IF EXISTS analyses;
-- DROP TABLE IF EXISTS activities;
-- DROP TABLE IF EXISTS decisions;
-- DROP TABLE IF EXISTS profiles;

-- Make sure the UUID extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles (from original schema)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT
);

-- 2. Decisions Table
-- Added 'assumptions' as expected by the frontend/backend form.
CREATE TABLE IF NOT EXISTS decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT,
  category TEXT,
  description TEXT,
  reasoning TEXT,
  assumptions TEXT,
  expected_outcome TEXT,
  concerns TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Decision Questions Table
-- Stores the dynamically generated Gemini questions
CREATE TABLE IF NOT EXISTS decision_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  decision_id UUID REFERENCES decisions(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  question_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Decision Answers Table
-- Stores user answers to the dynamic questions
CREATE TABLE IF NOT EXISTS decision_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  decision_id UUID REFERENCES decisions(id) ON DELETE CASCADE,
  question_id UUID REFERENCES decision_questions(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Analyses Table
-- Modified to use a single 'data' JSONB column as the backend upserts the full AI response object
-- Added UNIQUE(decision_id) so that upsert (onConflict: 'decision_id') works
CREATE TABLE IF NOT EXISTS analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  decision_id UUID REFERENCES decisions(id) ON DELETE CASCADE UNIQUE,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Activities Table
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  decision_id UUID REFERENCES decisions(id) ON DELETE CASCADE,
  activity TEXT,
  category TEXT,
  status TEXT,
  duration TEXT,
  source TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Realtime for activities
-- alter publication supabase_realtime add table activities;
