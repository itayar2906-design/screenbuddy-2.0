---
name: currency-rule
description: Time Bucks currency management rules for Screen Buddy
---

# Currency Rule

## Core Principle
Time Bucks balance is NEVER modified from the frontend. All mutations go through Supabase Edge Functions only.

## Implementation Rules

1. **Balance Mutations**
   - Every mutation writes an immutable transaction log entry
   - Transaction log fields: type, amount, actor_id, child_id, timestamp
   - Frontend only reads balance via GET requests
   - No direct UPDATE statements on `children.time_bucks` from client

2. **Currency Name**
   - The currency is called "T BUCKS" throughout the entire app
   - Never use: coins, gems, points, credits, or any other term
   - Always capitalize: T BUCKS (not Time Bucks or T Bucks)

3. **Exchange Rate**
   - 1 T BUCK = 1 minute of screen time on an unlocked app
   - This rate is the default and core mechanic
   - Parents can adjust per-app rates in blocked_apps table

4. **Transaction Types**
   - `earned`: Child completed approved task
   - `spent`: Child unlocked screen time
   - `adjusted`: Parent manually adjusted balance
   - `frozen`: Spending temporarily disabled by parent

5. **Audit Trail**
   - Every transaction must have a corresponding audit_log entry
   - Notes field format for screen time: `screen-time:[appName]:[minutes]min`
   - Example: `screen-time:YouTube:15min`
