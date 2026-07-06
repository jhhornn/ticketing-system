# Reservation Timer UX Enhancements

## Overview

Enhanced reservation timer experience with **tone-based dynamic messaging**, **progress narratives**, and **educational tooltips**—without changing expiry rules or backend logic.

---

## 🎯 Design Philosophy

**Core Principles:**
1. **Calm → Focused → Urgent**: Messaging tone adapts to time remaining
2. **Transparency**: Users understand why time limits exist
3. **Trust**: No panic-inducing language, even at <1 min
4. **Guidance**: Clear next steps at every phase

---

## 📊 Timer Phases

### Phase 1: Calm (>5 minutes)

**Tone:** Reassuring, relaxed

**Messaging:**
- Heading: "✓ Seats secured"
- Message: "Take your time reviewing your order"
- Progress Narrative: "Seats held for you"

**UI Behavior:**
- Timer color: Blue (#3b82f6)
- Icon: Check mark (✓)
- No pulsing/animation
- Full progress bar

**Purpose:** Reduce anxiety, let users browse confidently

**Example Display:**
```
┌─────────────────────────────────────────────┐
│ ✓ Seats secured                         ? │
│ Take your time reviewing your order         │
│                                             │
│ 08:24 remaining                             │
│ ████████████████████████░░░░░░░░░░░░  83% │
│                                             │
│ Seats held for you                          │
└─────────────────────────────────────────────┘
```

---

### Phase 2: Focused (5–1 minutes)

**Tone:** Instructional, clear

**Messaging:**
- Heading: "⏱️ Complete your purchase"
- Message: "3:42 remaining to checkout"
- Progress Narrative: "Checkout in progress"

**UI Behavior:**
- Timer color: Orange (#f59e0b)
- Icon: Clock (⏱️)
- Gentle pulse (every 2s)
- Progress bar 20-100%

**Purpose:** Shift attention to checkout without alarm

**Example Display:**
```
┌─────────────────────────────────────────────┐
│ ⏱️ Complete your purchase               ? │
│ 3:42 remaining to checkout                 │
│                                             │
│ 03:42 remaining                             │
│ ████████████░░░░░░░░░░░░░░░░░░░░░░░░  37% │
│                                             │
│ Checkout in progress                        │
└─────────────────────────────────────────────┘
```

---

### Phase 3: Urgent (<1 minute)

**Tone:** Urgent but not alarming

**Messaging:**
- Heading: "⏰ Almost out of time"
- Message: "0:47 left — finish checkout now"
- Progress Narrative: "Finalizing purchase"

**UI Behavior:**
- Timer color: Red (#ef4444)
- Icon: Alarm clock (⏰)
- Faster pulse (every 1s)
- Progress bar <20%

**Purpose:** Motivate action without causing panic

**Example Display:**
```
┌─────────────────────────────────────────────┐
│ ⏰ Almost out of time                    ? │
│ 0:47 left — finish checkout now            │
│                                             │
│ 00:47 remaining                             │
│ ███░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  08% │
│                                             │
│ Finalizing purchase                         │
└─────────────────────────────────────────────┘
```

---

### Phase 4: Expired (0 seconds)

**Tone:** Neutral, clear

**Messaging:**
- Heading: "⏱️ Time expired"
- Message: "Your reservation has ended"
- Progress Narrative: "Session ended"

**UI Behavior:**
- Timer color: Gray (#6b7280)
- Icon: Clock (⏱️)
- No animation
- Progress bar at 0%

**Purpose:** Inform without blame, redirect to event page

**Example Display:**
```
┌─────────────────────────────────────────────┐
│ ⏱️ Time expired                          × │
│ Your reservation has ended                  │
│                                             │
│ 00:00 remaining                             │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  00% │
│                                             │
│ Session ended                               │
│                                             │
│ [Return to Event Page]                      │
└─────────────────────────────────────────────┘
```

---

## 💡 Extension Tooltip ("?")

### Purpose
- Educates users about time limits
- Explains why extension isn't allowed (fairness)
- Future-proofs for when extension feature is enabled

### Behavior (Extension NOT Allowed)

**Trigger:** Click "?" icon

**Content:**
```
┌────────────────────────────────────────┐
│ Can I extend my time?              × │
├────────────────────────────────────────┤
│ Reservation time is fixed to ensure    │
│ fairness. If your time runs out,       │
│ seats return to the pool for other     │
│ customers.                              │
│                                         │
│ 💡 This prevents seats from being      │
│    held indefinitely while others      │
│    are waiting.                         │
└────────────────────────────────────────┘
```

### Behavior (Extension Allowed - Future Feature)

**Content:**
```
┌────────────────────────────────────────┐
│ Can I extend my time?              × │
├────────────────────────────────────────┤
│ Click to add 5 more minutes             │
│ (one-time extension)                    │
│                                         │
│ [Extend Time]                           │
└────────────────────────────────────────┘
```

---

## 🛠️ Implementation

### 1. Copy Changes (uiCopy.ts)

```typescript
timer: {
  phases: {
    calm: {
      heading: 'Seats secured',
      message: 'Take your time reviewing your order',
      icon: '✓',
      progressNarrative: 'Seats held for you',
    },
    focused: {
      heading: 'Complete your purchase',
      message: (timeLeft: string) => `${timeLeft} remaining to checkout`,
      icon: '⏱️',
      progressNarrative: 'Checkout in progress',
    },
    urgent: {
      heading: 'Almost out of time',
      message: (timeLeft: string) => `${timeLeft} left — finish checkout now`,
      icon: '⏰',
      progressNarrative: 'Finalizing purchase',
    },
    expired: {
      heading: 'Time expired',
      message: 'Your reservation has ended',
      icon: '⏱️',
      progressNarrative: 'Session ended',
    },
  },
  extension: {
    tooltipTitle: 'Can I extend my time?',
    notAllowedMessage: 'Reservation time is fixed to ensure fairness...',
    allowedMessage: 'Click to add 5 more minutes (one-time extension)',
    whyFixedTime: 'This prevents seats from being held indefinitely...',
  },
}
```

### 2. Hook Enhancements (useReservationTimer)

**New Return Values:**
```typescript
{
  // Existing
  timeRemaining: number;
  timeRemainingFormatted: string;
  isExpired: boolean;
  isWarning: boolean;
  progressPercentage: number;
  
  // NEW
  timerPhase: 'calm' | 'focused' | 'urgent' | 'expired';
  phaseConfig: { heading, message, icon, progressNarrative };
  progressNarrative: string;
}
```

**Phase Logic:**
```typescript
const timerPhase = useMemo(() => {
  if (isExpired) return 'expired';
  if (timeRemaining < 60) return 'urgent';   // <1 min
  if (timeRemaining < 300) return 'focused'; // 1-5 min
  return 'calm';                              // >5 min
}, [timeRemaining, isExpired]);
```

### 3. Component Usage

**EnhancedSeatMap.tsx Example:**
```tsx
import { useReservationTimer } from '../../hooks/useReservationTimer';
import { TimerInfoTooltip } from '../TimerInfoTooltip';

const {
  timeRemainingFormatted,
  progressPercentage,
  timerPhase,
  phaseConfig,
  progressNarrative,
} = useReservationTimer({
  expiresAt: reservationData?.expiresAt,
  onExpire: () => {
    showToast('error', SeatSelectionCopy.timer.reservationExpired);
    setState('IDLE');
  },
});

return (
  <div className={`reservation-timer ${timerPhase}`}>
    <div className="timer-header">
      <span className="timer-icon">{phaseConfig.icon}</span>
      <span className="timer-heading">{phaseConfig.heading}</span>
      <TimerInfoTooltip extensionAllowed={false} />
    </div>
    
    <div className="timer-message">
      {typeof phaseConfig.message === 'function' 
        ? phaseConfig.message(timeRemainingFormatted)
        : phaseConfig.message
      }
    </div>

    <div className="timer-countdown">
      {timeRemainingFormatted}
    </div>

    <div className="timer-progress">
      <div 
        className="timer-progress-bar" 
        style={{ width: `${progressPercentage}%` }}
      />
    </div>

    <div className="timer-narrative">
      {progressNarrative}
    </div>
  </div>
);
```

---

## 🎨 CSS Styling

### Phase-Based Colors

```css
/* Calm Phase (>5 min) */
.reservation-timer.calm {
  background: #dbeafe;
  border-color: #3b82f6;
}

.reservation-timer.calm .timer-heading {
  color: #1e40af;
}

.reservation-timer.calm .timer-progress-bar {
  background: #3b82f6;
}

/* Focused Phase (5-1 min) */
.reservation-timer.focused {
  background: #fef3c7;
  border-color: #f59e0b;
  animation: gentlePulse 2s ease-in-out infinite;
}

.reservation-timer.focused .timer-heading {
  color: #92400e;
}

.reservation-timer.focused .timer-progress-bar {
  background: #f59e0b;
}

/* Urgent Phase (<1 min) */
.reservation-timer.urgent {
  background: #fee2e2;
  border-color: #ef4444;
  animation: urgentPulse 1s ease-in-out infinite;
}

.reservation-timer.urgent .timer-heading {
  color: #991b1b;
}

.reservation-timer.urgent .timer-progress-bar {
  background: #ef4444;
}

/* Expired Phase */
.reservation-timer.expired {
  background: #f1f5f9;
  border-color: #6b7280;
}

.reservation-timer.expired .timer-heading {
  color: #374151;
}

@keyframes gentlePulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.2); }
  50% { box-shadow: 0 0 0 8px rgba(245, 158, 11, 0); }
}

@keyframes urgentPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.3); }
  50% { box-shadow: 0 0 0 12px rgba(239, 68, 68, 0); }
}
```

### Progress Narrative

```css
.timer-narrative {
  font-size: 12px;
  color: #64748b;
  text-align: center;
  margin-top: 8px;
  font-style: italic;
}
```

---

## 📱 Responsive Behavior

### Desktop (≥768px)
- Full messaging visible
- Tooltip opens as popover
- Progress bar full width

### Mobile (<768px)
- Compact layout
- Tooltip opens as modal (centered)
- Tap backdrop to close

---

## ♿ Accessibility

### ARIA Attributes

```tsx
<div 
  className="reservation-timer" 
  role="timer"
  aria-live="polite"
  aria-atomic="true"
>
  <span id="timer-label" className="sr-only">
    Reservation time remaining
  </span>
  <div aria-labelledby="timer-label">
    {phaseConfig.heading}
  </div>
</div>

<button
  className="timer-info-icon"
  aria-label="Learn about reservation time limits"
  aria-expanded={isOpen}
>
  ?
</button>
```

### Screen Reader Announcements

- Phase transitions announced automatically (aria-live="polite")
- Time updates every 60s (not every second to avoid spam)
- Expired state triggers assertive announcement

---

## 🧪 Testing Scenarios

### Test Case 1: Full Journey
1. Reserve seats (starts at 10:00)
2. Wait until 6:00 → verify "calm" phase
3. Wait until 4:00 → verify "focused" phase transition
4. Wait until 0:45 → verify "urgent" phase + faster pulse
5. Wait until 0:00 → verify "expired" + redirect

### Test Case 2: Tooltip Behavior
1. Click "?" icon → tooltip opens
2. Click backdrop → tooltip closes
3. Verify message explains "no extension"

### Test Case 3: Progress Narrative
1. Calm phase → "Seats held for you"
2. Focused phase → "Checkout in progress"
3. Urgent phase → "Finalizing purchase"
4. Expired phase → "Session ended"

### Test Case 4: Mobile Responsiveness
1. Open on mobile device
2. Verify tooltip centers on screen
3. Verify tap-to-close works
4. Verify compact timer layout

---

## 🎓 User Psychology

### Why This Works

**Calm Phase:**
- Reduces booking abandonment
- Users feel they have control
- More likely to explore event details

**Focused Phase:**
- Gentle nudge toward checkout
- Not alarming, just informative
- Maintains conversion momentum

**Urgent Phase:**
- Creates FOMO without panic
- Clear call to action
- Still respects user agency

**Expired Phase:**
- No blame language
- Explains what happened
- Clear next steps (return to event)

### What We Avoid

❌ **Don't:**
- "HURRY! TIME RUNNING OUT!"
- Red timers before <1 min
- Flashing/strobing animations
- Alarming sound effects
- "Last chance!" language

✅ **Do:**
- Calm, factual messaging
- Gradual color transitions
- Subtle animations
- Educational tooltips
- Clear next steps

---

## 🔮 Future Enhancements (Out of Scope)

1. **One-Time Extension:**
   - Add backend support for +5min extension
   - Update tooltip to show "Extend Time" button
   - Track extension usage per user

2. **Smart Expiry:**
   - Pause timer during payment processing
   - Add 30s buffer during checkout submission

3. **Notification Preferences:**
   - Let users opt-in to sound alerts
   - Browser notification at 1min mark

4. **A/B Testing:**
   - Test different phase thresholds (4min vs 5min)
   - Measure conversion rates by messaging tone

---

## 📊 Success Metrics

### Key Performance Indicators

**Primary:**
- Checkout completion rate
- Time-to-purchase (avg seconds)
- Timer expiration rate

**Secondary:**
- Tooltip engagement (% who click "?")
- Phase distribution (% in calm/focused/urgent at purchase)
- Re-selection rate (% who re-reserve after expiry)

**Target Improvements:**
- ↓ 15% reduction in abandonment during focused phase
- ↓ 20% reduction in panic-driven errors
- ↑ 10% increase in checkout completion

---

## 📁 Files Created/Modified

```
apps/frontend/src/
├── utils/
│   └── uiCopy.ts                       (MODIFIED: Added timer.phases)
├── hooks/
│   └── useReservationTimer.ts          (MODIFIED: Added timerPhase, phaseConfig)
└── components/
    └── TimerInfoTooltip/
        ├── TimerInfoTooltip.tsx        (NEW: Tooltip component)
        ├── TimerInfoTooltip.css        (NEW: Tooltip styles)
        └── index.ts                    (NEW: Exports)

docs/features/
└── reservation-timer-ux-enhancements.md (THIS FILE)
```

---

## ✅ Summary

**Delivered:**
- ✅ Dynamic messaging with 3 tone phases (calm/focused/urgent)
- ✅ Progress narratives ("Seats held for you" → "Checkout in progress")
- ✅ Educational tooltip explaining time limits
- ✅ Phase-based visual styling (colors, animations)
- ✅ Enhanced hook with timerPhase and phaseConfig
- ✅ Mobile-responsive tooltip design
- ✅ Accessibility support (ARIA, screen readers)

**No Changes To:**
- ❌ Expiry rules (still 10 minutes)
- ❌ Backend logic
- ❌ Reservation endpoint
- ❌ Cron job cleanup

**Ready For:**
- Integration into EnhancedSeatMap.tsx
- Integration into CheckoutPage.tsx
- User testing and feedback
- Future extension feature
