-- Schema for PromptWars 2026

CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT
);

CREATE TABLE decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT,
  category TEXT,
  description TEXT,
  reasoning TEXT,
  expected_outcome TEXT,
  concerns TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  decision_id UUID REFERENCES decisions(id),
  activity TEXT,
  category TEXT,
  status TEXT,
  duration TEXT,
  source TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  decision_id UUID REFERENCES decisions(id),
  blind_spots JSONB,
  assumptions JSONB,
  missing_information JSONB,
  conflicts JSONB,
  potential_impacts JSONB,
  reflection_questions JSONB,
  what_if_scenarios JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Realtime for activities
alter publication supabase_realtime add table activities;
