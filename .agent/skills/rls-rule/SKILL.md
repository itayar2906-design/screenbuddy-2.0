---
name: rls-rule
description: Row Level Security policies for all Supabase tables
---

# RLS Rule

## Core Principle
Every Supabase table has Row Level Security enabled. Parents can only read and write their own children's data. Children can only read their own row.

## RLS Requirements

### Every Table Must Have:
1. RLS enabled: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
2. Policies for SELECT, INSERT, UPDATE, DELETE operations
3. Policies that enforce parent-child ownership

## Policy Patterns

### Parent Access
```sql
-- Parents can only see their own children
CREATE POLICY "Parents can view own children"
ON children FOR SELECT
USING (parent_id = auth.uid());

-- Parents can only modify their own children
CREATE POLICY "Parents can update own children"
ON children FOR UPDATE
USING (parent_id = auth.uid());
```

### Child Access
```sql
-- Children can only view their own profile
CREATE POLICY "Children can view own profile"
ON children FOR SELECT
USING (id = current_setting('app.child_id')::uuid);
```

### Protected Tables
- `transactions` — INSERT only via Edge Functions with service role
- `audit_logs` — INSERT only via Edge Functions with service role
- No direct client access to these tables

## Service Role Usage
- Edge Functions use service role key to bypass RLS
- Service role ONLY used in Edge Functions, never in client code
- Service role writes to `transactions` and `audit_logs`

## Critical Rules
- Never disable RLS on any table
- Never expose service role key to client
- Always test policies with both parent and child roles
- Policies must prevent cross-family data access
- Children cannot INSERT, UPDATE, or DELETE — only SELECT their own data
