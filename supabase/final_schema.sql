-- Screen Buddy Initial Schema
-- Creates all core tables for the application

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('parent', 'child')),
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Children table
CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  avatar TEXT,
  level INT DEFAULT 1,
  xp INT DEFAULT 0,
  time_bucks INT DEFAULT 0,
  freeze BOOLEAN DEFAULT FALSE,
  streak INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blocked apps table
CREATE TABLE blocked_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  app_name TEXT NOT NULL,
  package_name TEXT NOT NULL,
  bundle_id TEXT,
  time_bucks_per_minute INT DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Screen time sessions table
CREATE TABLE screen_time_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  app_name TEXT NOT NULL,
  package_name TEXT NOT NULL,
  minutes_granted INT NOT NULL,
  time_bucks_spent INT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'cancelled')) DEFAULT 'active'
);

-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'custom')),
  time_bucks_reward INT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'archived')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task completions table
CREATE TABLE task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- Transactions table (immutable log)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES profiles(id),
  type TEXT NOT NULL CHECK (type IN ('earned', 'spent', 'adjusted', 'frozen')),
  amount INT NOT NULL,
  notes TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs table (immutable log)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stripe customers table
CREATE TABLE stripe_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  stripe_subscription_id TEXT,
  price_id TEXT,
  active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_children_parent_id ON children(parent_id);
CREATE INDEX idx_blocked_apps_child_id ON blocked_apps(child_id);
CREATE INDEX idx_screen_time_sessions_child_id ON screen_time_sessions(child_id);
CREATE INDEX idx_screen_time_sessions_status ON screen_time_sessions(status);
CREATE INDEX idx_tasks_child_id ON tasks(child_id);
CREATE INDEX idx_task_completions_child_id ON task_completions(child_id);
CREATE INDEX idx_task_completions_status ON task_completions(status);
CREATE INDEX idx_transactions_child_id ON transactions(child_id);
CREATE INDEX idx_audit_logs_child_id ON audit_logs(child_id);
CREATE INDEX idx_stripe_customers_parent_id ON stripe_customers(parent_id);
-- Row Level Security Policies for Screen Buddy
-- Enforces parent-child data isolation and security

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE screen_time_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Children policies
CREATE POLICY "Parents can view own children"
  ON children FOR SELECT
  USING (parent_id = auth.uid());

CREATE POLICY "Parents can insert own children"
  ON children FOR INSERT
  WITH CHECK (parent_id = auth.uid());

CREATE POLICY "Parents can update own children"
  ON children FOR UPDATE
  USING (parent_id = auth.uid());

CREATE POLICY "Parents can delete own children"
  ON children FOR DELETE
  USING (parent_id = auth.uid());

-- Blocked apps policies
CREATE POLICY "Parents can view own children's blocked apps"
  ON blocked_apps FOR SELECT
  USING (parent_id = auth.uid());

CREATE POLICY "Parents can insert blocked apps for own children"
  ON blocked_apps FOR INSERT
  WITH CHECK (parent_id = auth.uid());

CREATE POLICY "Parents can update own children's blocked apps"
  ON blocked_apps FOR UPDATE
  USING (parent_id = auth.uid());

CREATE POLICY "Parents can delete own children's blocked apps"
  ON blocked_apps FOR DELETE
  USING (parent_id = auth.uid());

-- Screen time sessions policies
CREATE POLICY "Parents can view own children's sessions"
  ON screen_time_sessions FOR SELECT
  USING (
    child_id IN (
      SELECT id FROM children WHERE parent_id = auth.uid()
    )
  );

-- Tasks policies
CREATE POLICY "Parents can view own children's tasks"
  ON tasks FOR SELECT
  USING (parent_id = auth.uid());

CREATE POLICY "Parents can insert tasks for own children"
  ON tasks FOR INSERT
  WITH CHECK (parent_id = auth.uid());

CREATE POLICY "Parents can update own children's tasks"
  ON tasks FOR UPDATE
  USING (parent_id = auth.uid());

CREATE POLICY "Parents can delete own children's tasks"
  ON tasks FOR DELETE
  USING (parent_id = auth.uid());

-- Task completions policies
CREATE POLICY "Parents can view own children's task completions"
  ON task_completions FOR SELECT
  USING (
    child_id IN (
      SELECT id FROM children WHERE parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can update own children's task completions"
  ON task_completions FOR UPDATE
  USING (
    child_id IN (
      SELECT id FROM children WHERE parent_id = auth.uid()
    )
  );

-- Transactions policies (read-only for parents)
CREATE POLICY "Parents can view own children's transactions"
  ON transactions FOR SELECT
  USING (
    child_id IN (
      SELECT id FROM children WHERE parent_id = auth.uid()
    )
  );

-- Audit logs policies (read-only for parents)
CREATE POLICY "Parents can view own children's audit logs"
  ON audit_logs FOR SELECT
  USING (
    child_id IN (
      SELECT id FROM children WHERE parent_id = auth.uid()
    )
  );

-- Stripe customers policies
CREATE POLICY "Parents can view own stripe customer"
  ON stripe_customers FOR SELECT
  USING (parent_id = auth.uid());

CREATE POLICY "Parents can update own stripe customer"
  ON stripe_customers FOR UPDATE
  USING (parent_id = auth.uid());

-- Note: Transactions and audit_logs INSERT policies are not defined here
-- These tables can only be written to by Edge Functions using service role key
-- This prevents clients from manipulating the immutable logs
-- Stripe Integration Schema
-- Additional tables and functions for Stripe payment processing

-- Function to update stripe_customers updated_at timestamp
CREATE OR REPLACE FUNCTION update_stripe_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER stripe_customers_updated_at
  BEFORE UPDATE ON stripe_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_stripe_customers_updated_at();

-- Function to handle new user signup (creates profile)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    'parent',
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
