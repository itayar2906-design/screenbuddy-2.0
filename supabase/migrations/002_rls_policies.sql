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
