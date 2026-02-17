# Screen Buddy - Setup Guide

## Prerequisites

- Node.js 18+ and npm
- Expo CLI (`npm install -g expo-cli`)
- iOS: Xcode 14+ and CocoaPods
- Android: Android Studio with SDK 33+
- Supabase account
- Stripe account (optional, for payments)

---

## 1. Install Dependencies

```bash
cd screenbuddy
npm install
```

---

## 2. Set Up Supabase

### Create Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

### Apply Migrations

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push
```

Or manually:
1. Go to SQL Editor in Supabase dashboard
2. Copy and paste each migration file:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_stripe_and_triggers.sql`
3. Run each one

### Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy approve-task
supabase functions deploy unlock-screen-time
supabase functions deploy adjust-balance
supabase functions deploy freeze-spending
supabase functions deploy create-checkout-session
supabase functions deploy create-customer-portal
supabase functions deploy stripe-webhook
```

### Set Environment Secrets

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_key
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_secret
```

---

## 3. Configure Environment Variables

Create `.env` file in project root:

```bash
cp .env.example .env
```

Edit `.env`:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 4. iOS Setup

### Install Pods

```bash
cd ios
pod install
cd ..
```

### Add Capabilities

Open `ios/ScreenBuddy.xcworkspace` in Xcode:

1. Select your project target
2. Go to "Signing & Capabilities"
3. Add "Family Controls" capability
4. Add "Screen Time" capability

### Update Info.plist

Add to `ios/ScreenBuddy/Info.plist`:

```xml
<key>NSFamilyControlsUsageDescription</key>
<string>Screen Buddy needs access to Screen Time to help manage your child's app usage</string>
```

---

## 5. Android Setup

### Update AndroidManifest.xml

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.PACKAGE_USAGE_STATS" />
<uses-permission android:name="android.permission.QUERY_ALL_PACKAGES" />
```

### Register Native Module

Edit `android/app/src/main/java/com/screenbuddy/MainApplication.java`:

```java
import com.screenbuddy.ScreenTimePackage;

// In getPackages():
packages.add(new ScreenTimePackage());
```

---

## 6. Replace GIMI Placeholder

Replace the placeholder image with your actual GIMI character:

```bash
# Copy your GIMI image to:
src/assets/gimi/gimi_base.png
```

The image should be:
- PNG format
- Transparent background
- ~500x500px recommended

---

## 7. Run the App

### iOS

```bash
npx expo run:ios
```

Or open in Xcode and run from there.

### Android

```bash
npx expo run:android
```

Or open in Android Studio and run from there.

---

## 8. Create Test Data

### Create Parent Account

1. Run the app
2. Sign up with email/password
3. This creates a parent profile

### Create Child Profile

Use Supabase SQL Editor:

```sql
INSERT INTO children (parent_id, name, pin_hash, time_bucks, level, xp)
VALUES (
  'parent-user-id-here',
  'Test Child',
  'hashed-pin-here',  -- In production, hash the PIN
  100,  -- Starting Time Bucks
  1,
  0
);
```

### Create Sample Tasks

```sql
INSERT INTO tasks (parent_id, child_id, title, description, frequency, time_bucks_reward, status)
VALUES
  ('parent-id', 'child-id', 'Make Your Bed', 'Make your bed every morning', 'daily', 10, 'active'),
  ('parent-id', 'child-id', 'Do Homework', 'Complete all homework assignments', 'daily', 20, 'active'),
  ('parent-id', 'child-id', 'Clean Room', 'Clean and organize your room', 'weekly', 50, 'active');
```

### Block Sample Apps

```sql
INSERT INTO blocked_apps (parent_id, child_id, app_name, package_name, time_bucks_per_minute, is_active)
VALUES
  ('parent-id', 'child-id', 'YouTube', 'com.google.android.youtube', 1, true),
  ('parent-id', 'child-id', 'TikTok', 'com.zhiliaoapp.musically', 2, true),
  ('parent-id', 'child-id', 'Instagram', 'com.instagram.android', 1, true);
```

---

## 9. Testing Screen Time Flow

### End-to-End Test

1. **Parent Side**:
   - Log in as parent
   - Go to "Blocked Apps"
   - Block YouTube for the test child
   - Create a task worth 30 Time Bucks

2. **Child Side**:
   - Log in as child (with PIN)
   - Complete the task
   - Wait for parent approval

3. **Parent Side**:
   - Approve the task
   - Child should see +30 Time Bucks

4. **Child Side**:
   - Tap "Unlock Screen Time"
   - GIMI appears: "Which app?"
   - Select YouTube
   - GIMI: "How long?"
   - Select 15 minutes
   - GIMI: "That's 15 Time Bucks!"
   - Confirm
   - YouTube unlocks for 15 minutes
   - After 13 minutes: 2-minute warning
   - After 15 minutes: YouTube re-locks

---

## 10. Stripe Integration (Optional)

### Set Up Stripe

1. Create Stripe account
2. Get API keys (test mode)
3. Create a subscription product
4. Note the price ID

### Configure Webhook

1. In Stripe dashboard, go to Webhooks
2. Add endpoint: `https://your-project.supabase.co/functions/v1/stripe-webhook`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy webhook secret

### Update Environment

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_your_key
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_secret
```

---

## Troubleshooting

### iOS Screen Time Not Working

- Ensure you're testing on a **physical device** (not simulator)
- Verify Family Sharing is set up
- Check that parent has authorized Screen Time access
- Confirm capabilities are added in Xcode

### Android Screen Time Not Working

- Grant Usage Stats permission manually in Settings
- Enable Accessibility Service for Screen Buddy
- Test on Android 9+ device

### Edge Functions Failing

- Check Supabase logs in dashboard
- Verify environment secrets are set
- Ensure migrations were applied correctly

### Balance Not Updating

- Check Supabase Realtime is enabled
- Verify RLS policies allow reading children table
- Check browser console for errors

---

## Next Steps

1. **Complete Placeholder Screens**
   - Implement full TaskManager
   - Build Analytics dashboard
   - Add Settings screen with Stripe

2. **Enhance GIMI**
   - Add Lottie animations
   - Create more dialogue variations
   - Add sound effects

3. **Production Readiness**
   - Implement proper PIN hashing
   - Add error boundaries
   - Set up crash reporting (Sentry)
   - Add analytics (Mixpanel/Amplitude)

4. **App Store Submission**
   - Create app icons
   - Design splash screen
   - Write app description
   - Take screenshots
   - Submit for review

---

## Support

For issues or questions:
- Check Supabase logs
- Review React Native logs: `npx react-native log-ios` or `npx react-native log-android`
- Check Edge Function logs in Supabase dashboard
