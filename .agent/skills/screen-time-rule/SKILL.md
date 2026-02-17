---
name: screen-time-rule
description: Screen time enforcement rules using iOS and Android native APIs
---

# Screen Time Rule

## Core Principle
Screen Buddy uses the iOS Screen Time API (via a custom Expo native module) and Android Digital Wellbeing API to enforce app blocking at the OS level.

## How It Works

1. **Parent Configuration**
   - Parents block specific apps in the parent dashboard
   - Blocked apps remain locked until the child spends Time Bucks to unlock them

2. **Unlocking Process**
   - When a child spends Time Bucks on an app, the native screen time layer grants exactly that many minutes
   - The app automatically re-blocks when time expires
   - This is enforced at the OS level — not just in-app UI

3. **iOS Implementation**
   - Uses Screen Time API via FamilyControls framework
   - ManagedSettings framework to apply app restrictions
   - DeviceActivityMonitor to track and enforce time limits
   - Requires Family Sharing setup and parent authorization
   - Native module: `ScreenTimeModule.swift`
   - Exposed to React Native via RCTBridgeModule

4. **Android Implementation**
   - Uses Digital Wellbeing API
   - UsageStatsManager to track app usage
   - AppOpsManager to restrict/allow app access
   - AccessibilityService for enforcement
   - Native module: `ScreenTimeModule.kt`
   - Exposed to React Native via ReactContextBaseJavaModule

5. **JavaScript Interface**
   - Single unified API: `src/native/ScreenTime.js`
   - Platform detection handles iOS vs Android differences
   - Methods:
     - `blockApp(packageName, childId)`
     - `unblockAppForMinutes(packageName, minutes, childId)`
     - `getBlockedApps(childId)`
     - `getRemainingMinutes(packageName, childId)`
     - `onTimerExpired(callback)`
     - `onTwoMinuteWarning(callback)`

## Critical Rules
- Screen time enforcement happens at OS level, not app level
- Apps cannot be unlocked without spending Time Bucks
- Timer countdown is managed by native code, not JavaScript
- Auto-relock is guaranteed by the OS, not the app
