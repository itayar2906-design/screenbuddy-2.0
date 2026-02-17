---
name: auth-rule
description: Authentication and authorization rules for parents and children
---

# Auth Rule

## Core Principle
Parent and Child sessions are completely isolated. Parents use email/password. Children use PIN only.

## Parent Authentication
- Uses `supabase.auth.signInWithPassword` with email and password
- Standard Supabase Auth flow
- JWT stored in secure storage
- Session persists across app restarts

## Child Authentication
- Uses PIN only — never email, never `supabase.auth`
- PIN is hashed and stored in `children.pin_hash`
- Custom session management via Expo SecureStore
- No JWT — child_id stored locally after PIN verification
- PIN verification happens via Edge Function or RLS-protected query

## Session Isolation
- Parent sessions use Supabase Auth tokens
- Child sessions use local child_id reference
- No child can access parent routes
- No parent can accidentally act as child

## Re-Authentication
- Sensitive parent actions require re-authentication before proceeding
- Examples:
  - Manual Time Bucks balance adjustment
  - Deleting a child profile
  - Changing blocked app settings
  - Viewing transaction logs
- Implemented via `ReAuthModal` component
- Calls `supabase.auth.signInWithPassword({ email, password })`
- Only proceeds if error === null

## Critical Rules
- Never use `supabase.auth` for child login
- Never store child PIN in plain text
- Always verify parent JWT before sensitive operations
- Always show ReAuthModal for balance adjustments
