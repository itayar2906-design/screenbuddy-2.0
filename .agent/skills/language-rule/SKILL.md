---
name: language-rule
description: Language and file type rules for Screen Buddy codebase
---

# Language Rule

## Core Principle
Supabase Edge Functions are TypeScript strict mode. Mobile app files are JavaScript only.

## Supabase Edge Functions
- **Language**: TypeScript ONLY
- **Mode**: Strict mode enabled
- **Types**: No `any`, no implicit types
- **File extension**: `.ts`
- **Location**: `supabase/functions/*/index.ts`

## Native Modules
- **iOS**: Swift (`.swift`)
- **Android**: Kotlin (`.kt`) or Java (`.java`)
- **Location**: `ios/` and `android/` directories

## Mobile App JavaScript Layer
- **Language**: JavaScript ONLY
- **File extensions**: `.js` and `.jsx`
- **No TypeScript**: No `.ts` or `.tsx` files ever
- **Validation**: Use PropTypes for all component validation
- **Location**: `src/` directory

## Critical Rules
- Never create `.ts` or `.tsx` files in `src/` directory
- Always use PropTypes for React components
- Edge Functions must have explicit return types
- Edge Functions must validate all input parameters
- No `any` type in Edge Functions — use proper interfaces

## Example PropTypes Usage
```javascript
import PropTypes from 'prop-types';

const GimiCharacter = ({ mood, dialogue, position }) => {
  // component code
};

GimiCharacter.propTypes = {
  mood: PropTypes.oneOf(['happy', 'excited', 'thinking', 'wave', 'sad']).isRequired,
  dialogue: PropTypes.string,
  position: PropTypes.oneOf(['corner', 'fullscreen', 'notification']).isRequired,
};
```
