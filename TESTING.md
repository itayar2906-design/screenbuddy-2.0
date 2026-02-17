# Automated Testing Guide

Since setting up a physical device or simulator can be complex, Screen Buddy includes a suite of automated tests to verify the core business logic (Tasks, Currency, Screen Time) instantly.

## Running Tests

Open a terminal in the project folder and run:

```bash
npm test
```

This will execute the test suite in `__tests__/BusinessLogic.test.js`.

## What is Tested?

The automated tests verify the following critical flows:

### 1. Currency System
- **Buying Power**: Verifies fetching child balance.
- **Spending Controls**: Verifies that parents can freeze spending (checks that the Edge Function is called correctly).

### 2. Task System
- **Creation**: Verifies that new tasks are structured correctly and sent to the database.
- **Submission**: Verifies that a child can mark a task as done.
- **Approval**: Verifies that approving a task triggers the `approve-task` Edge Function (which securely grants Time Bucks).

### 3. Screen Time Logic
- **Unlocking**: Verifies that the purchase flow calls the `unlock-screen-time` Edge Function with the correct parameters (Child ID, App Name, Duration).

## Extending Tests

You can add more tests in the `__tests__` directory. We use [Jest](https://jestjs.io/) for testing.

---

## 🔒 Manual Verification: RLS Policies

Since Row Level Security (RLS) is critical for privacy, you should manually verify it in the Supabase Dashboard after deploying.

1.  **Go to Authentication > Policies**:
    -   Ensure `Enable RLS` is checked for `children`, `tasks`, `transactions`, `streen_time_sessions`.
2.  **Verify `children` Table Policies**:
    -   **Users can view their own children**: check that the definition is `auth.uid() = parent_id`.
    -   **Users can insert their own children**: check that `auth.uid() = parent_id`.
3.  **Verify `tasks` Table Policies**:
    -   **Parents can view tasks for their children**: logic should join with `children` table to check ownership.

## 📱 Native Build & Test

To test Screen Time features, you must build the app on a physical device.

**iOS:**
1.  Open `ios/ScreenBuddy.xcworkspace` in Xcode.
2.  Select your Development Team.
3.  Add "Family Controls" capability in "Signing & Capabilities".
4.  Connect your iPhone and select it as the target.
5.  Run (Cmd+R).

**Android:**
1.  Open `android` folder in Android Studio.
2.  Let Gradle sync.
3.  Connect your Android device (enable USB Debugging).
4.  Run (Shift+F10).

> **Note**: Android requires the "Usage Access" permission to be granted manually in Settings > Security > Usage Access for the app to function if the prompt doesn't appear automatically.
