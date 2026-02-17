---
name: gimi-rule
description: GIMI mascot character appearance and interaction rules
---

# GIMI Rule

## Core Principle
GIMI is Screen Buddy's mascot character. GIMI MUST appear every time a child is about to spend Time Bucks on screen time.

## Asset Requirements
- User will provide GIMI image: `src/assets/gimi/gimi_base.png`
- Until provided, use a colorful friendly placeholder character
- Lottie animations required:
  - `gimi_happy.json` — when Time Bucks earned
  - `gimi_excited.json` — when screen time unlocked
  - `gimi_thinking.json` — when choosing which app
  - `gimi_wave.json` — greeting on dashboard

## Required Appearances

### 1. Child Dashboard
- Bottom right corner, waving
- Tap GIMI to see Time Bucks balance and tips

### 2. Screen Time Purchase Flow (FULL SCREEN)
- GIMI slides in from bottom
- Step 1: "Hey [child name]! Which app do you want to unlock?"
- Child picks app from blocked apps list
- Step 2: "Ooh nice choice! How many minutes do you want?"
- Child picks duration (5/10/15/30 min buttons)
- Step 3: "That's [X] Time Bucks! You have [balance] — let's do it!"
- Child confirms
- Step 4: GIMI excited animation
- "Unlocked! You've got [X] minutes. Make them count!"

### 3. Task Completion
- Small celebration in corner
- "Amazing! You earned [X] Time Bucks!"

### 4. Balance Too Low
- GIMI looks sympathetic
- "You need [X] more Time Bucks for that! Finish a task and come back!"

### 5. Time Running Out (2 min warning)
- GIMI pops up as notification
- "2 minutes left! Wrap it up or earn more Time Bucks!"

### 6. Time Expired
- GIMI appears on lock screen
- "Time's up! Great job managing your screen time. Earn more Time Bucks to keep going!"

## Dialogue Rules
- Always warm, encouraging, never scolding
- Use child's first name when possible
- Keep lines short — max 15 words per line
- Always reference Time Bucks by name
- Celebrate task completions enthusiastically

## Critical Rule
**Never skip GIMI on a Time Bucks spend flow.** This is non-negotiable.
