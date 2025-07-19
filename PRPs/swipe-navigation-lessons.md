# PRP: Swipe Navigation Between Lessons

## Goal
Implement touch-friendly swipe navigation between lessons in the Solidity learning platform, providing a native app-like experience for mobile users.

## Why
- **User Experience**: Mobile users expect swipe gestures for navigation (like Instagram stories or TikTok)
- **Engagement**: Seamless navigation increases lesson completion rates
- **Accessibility**: Alternative to button-based navigation for touch devices
- **Performance**: Hardware-accelerated transitions feel more responsive

## What
Swipe gesture navigation system that allows users to navigate between lessons with left/right swipes, including visual feedback and smooth transitions.

### Success Criteria
- [ ] Users can swipe left to go to next lesson
- [ ] Users can swipe right to go to previous lesson
- [ ] Visual progress indicator shows current position
- [ ] Smooth, performant animations during swipe
- [ ] Fallback navigation buttons for non-touch devices
- [ ] Accessibility support with keyboard navigation
- [ ] Works in both portrait and landscape orientations

## All Needed Context

### Existing Code & Patterns

- file: /home/elo/learning_solidity/learning_sol/lib/hooks/useSwipeGesture.ts
  why: Existing swipe gesture hook to build upon

- file: /home/elo/learning_solidity/learning_sol/components/MobileNavigation.tsx
  why: Current mobile navigation implementation for integration

- file: /home/elo/learning_solidity/learning_sol/types.ts
  why: LearningModule and lesson types for navigation

### Libraries & Documentation

- url: https://www.framer.com/motion/gestures/
  why: Framer Motion gesture documentation for drag animations

- doc: https://developer.mozilla.org/en-US/docs/Web/API/Touch_events
  section: Handling gestures
  why: Web standards for touch event handling

### Known Gotchas

# CRITICAL: Prevent default scrolling when swiping horizontally
# CRITICAL: Handle edge cases (first/last lesson)
# CRITICAL: Debounce rapid swipes to prevent skipping lessons
# CRITICAL: Test on actual devices, not just Chrome DevTools

### Performance Considerations
- Use CSS transforms for animations (GPU accelerated)
- Preload adjacent lessons for instant navigation
- Lazy load lesson content after swipe completes

## Implementation Blueprint

### 1. Create Swipeable Lesson Container Component

```typescript
// components/learning/SwipeableLessonContainer.tsx
interface SwipeableLessonContainerProps {
  lessons: Lesson[];
  currentLessonIndex: number;
  onLessonChange: (index: number) => void;
}

// Features:
// - Wrap lessons in draggable container
// - Track swipe velocity and distance
// - Animate between lessons
// - Show progress dots
```

### 2. Enhance useSwipeGesture Hook

```typescript
// Add to lib/hooks/useSwipeGesture.ts
// - Velocity-based swipe detection
// - Swipe progress tracking (0-1)
// - Cancel swipe on vertical movement
// - Haptic feedback on successful swipe
```

### 3. Create Progress Indicator Component

```typescript
// components/ui/LessonProgressDots.tsx
// - Show dots for each lesson
// - Highlight current lesson
// - Allow tap-to-navigate
// - Animate dot transitions
```

### 4. Integration with Existing Navigation

```typescript
// Update ModuleContent.tsx to use SwipeableLessonContainer
// - Detect mobile/touch devices
// - Conditionally render swipeable version
// - Sync with URL/router state
// - Maintain keyboard navigation
```

### Task List
1. Create SwipeableLessonContainer component with Framer Motion
2. Enhance useSwipeGesture with velocity detection
3. Build LessonProgressDots indicator
4. Add preloading logic for adjacent lessons
5. Implement haptic feedback
6. Add keyboard shortcuts (arrow keys)
7. Create loading states during swipe
8. Add analytics tracking for swipe events
9. Write comprehensive tests
10. Test on real devices

## Validation Loop

### Level 1: TypeScript & Linting
```bash
npm run type-check
npm run lint
```

### Level 2: Component Tests
```bash
npm test components/learning/SwipeableLessonContainer.test.tsx
npm test hooks/useSwipeGesture.test.ts
```

### Level 3: E2E Mobile Tests
```bash
npm run test:mobile -- --grep "swipe navigation"
```

### Level 4: Manual Device Testing
- [ ] Test on iOS Safari
- [ ] Test on Android Chrome
- [ ] Test on tablet in both orientations
- [ ] Test with screen reader enabled
- [ ] Test offline behavior

### Level 5: Performance Validation
```bash
npm run lighthouse:mobile
# Ensure no regression in performance scores
# Target: 60fps during swipe animations
```

## Self-Validation Checklist
- [ ] Swipe gestures feel natural and responsive
- [ ] No conflicts with vertical scrolling
- [ ] Progress saves correctly after swipe
- [ ] Works with browser back/forward buttons
- [ ] Accessible via keyboard
- [ ] No memory leaks from event listeners
- [ ] Analytics events fire correctly
- [ ] Edge lessons handle gracefully