# Timer UX - Visual Reference Guide

Quick visual guide for designers and developers implementing the enhanced reservation timer.

---

## Timer Phases Overview

### Phase 1: Calm (>5 minutes)

```
┌────────────────────────────────────────────────────┐
│ ✓ Seats secured                                 ?  │ ← Blue header
│ Take your time reviewing your order                │
│                                                     │
│                    08:24                            │ ← Large blue countdown
│                                                     │
│ ████████████████████████░░░░░░░░░░░░░░░░░░  84%  │ ← Blue progress bar
│                                                     │
│ Seats held for you                                 │ ← Italic narrative
└────────────────────────────────────────────────────┘

Colors:
- Background: #dbeafe (light blue)
- Border: #3b82f6 (blue)
- Text: #1e40af (dark blue)
- Progress bar: #3b82f6 (blue)

Animation: None
```

---

### Phase 2: Focused (5-1 minutes)

```
┌────────────────────────────────────────────────────┐
│ ⏱️ Complete your purchase                       ?  │ ← Orange header
│ 3:42 remaining to checkout                         │
│                                                     │
│                    03:42                            │ ← Large orange countdown
│                                                     │
│ ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  37%  │ ← Orange progress bar
│                                                     │
│ Checkout in progress                               │ ← Italic narrative
└────────────────────────────────────────────────────┘
      ↑ Gentle pulsing glow

Colors:
- Background: #fef3c7 (light orange/yellow)
- Border: #f59e0b (orange)
- Text: #92400e (dark orange)
- Progress bar: #f59e0b (orange)

Animation: Gentle pulse (2s cycle)
```

---

### Phase 3: Urgent (<1 minute)

```
┌────────────────────────────────────────────────────┐
│ ⏰ Almost out of time                            ?  │ ← Red header
│ 0:47 left — finish checkout now                    │
│                                                     │
│                    00:47                            │ ← Large red countdown
│                                                     │
│ ███░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  08%  │ ← Red progress bar
│                                                     │
│ Finalizing purchase                                │ ← Italic narrative
└────────────────────────────────────────────────────┘
      ↑ Faster pulsing glow

Colors:
- Background: #fee2e2 (light red)
- Border: #ef4444 (red)
- Text: #991b1b (dark red)
- Progress bar: #ef4444 (red)

Animation: Fast pulse (1s cycle)
```

---

### Phase 4: Expired (0 seconds)

```
┌────────────────────────────────────────────────────┐
│ ⏱️ Time expired                                  ×  │ ← Gray header
│ Your reservation has ended                          │
│                                                     │
│                    00:00                            │ ← Large gray countdown
│                                                     │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  00%  │ ← Empty progress bar
│                                                     │
│ Session ended                                      │ ← Italic narrative
│                                                     │
│           [Return to Event Page]                   │ ← Action button
└────────────────────────────────────────────────────┘

Colors:
- Background: #f1f5f9 (light gray)
- Border: #6b7280 (gray)
- Text: #374151 (dark gray)
- Progress bar: #6b7280 (gray)

Animation: None
```

---

## Info Tooltip ("?")

### Closed State

```
┌────────────────────────────────┐
│ ⏱️ Complete your purchase  (?) │ ← Small blue circle with "?"
└────────────────────────────────┘
```

**Styles:**
- Width: 18px
- Height: 18px
- Border: 1.5px solid #3b82f6
- Background: rgba(59, 130, 246, 0.1)
- Hover: Solid blue background, white text

---

### Open State (Extension NOT Allowed)

```
┌────────────────────────────────────────────┐
│ Can I extend my time?                  ×   │ ← Gray header with close
├────────────────────────────────────────────┤
│                                            │
│ Reservation time is fixed to ensure       │
│ fairness. If your time runs out, seats    │
│ return to the pool for other customers.   │
│                                            │
│ ┌──────────────────────────────────────┐ │
│ │ 💡 This prevents seats from being    │ │ ← Info box
│ │    held indefinitely while others    │ │
│ │    are waiting.                       │ │
│ └──────────────────────────────────────┘ │
│                                            │
└────────────────────────────────────────────┘
```

**Dimensions:**
- Width: 280px (desktop), 90vw (mobile)
- Max-width: 400px
- Border-radius: 8px
- Box-shadow: 0 10px 25px rgba(0,0,0,0.15)

**Colors:**
- Background: white (#ffffff)
- Border: #e2e8f0 (light gray)
- Header background: #f8fafc
- Info box background: #f1f5f9
- Text: #475569

---

### Open State (Extension Allowed - Future)

```
┌────────────────────────────────────────────┐
│ Can I extend my time?                  ×   │
├────────────────────────────────────────────┤
│                                            │
│ Click to add 5 more minutes                │
│ (one-time extension)                       │
│                                            │
│ ┌──────────────────────────────────────┐ │
│ │         [Extend Time]                 │ │ ← Blue button
│ └──────────────────────────────────────┘ │
│                                            │
└────────────────────────────────────────────┘
```

**Button Styles:**
- Width: 100%
- Padding: 10px 16px
- Background: #3b82f6
- Hover background: #2563eb
- Color: white
- Border-radius: 6px

---

## Mobile Layouts

### Compact Timer (≤640px)

```
┌─────────────────────────┐
│ ⏱️ Complete purchase  ? │
│ 3:42 left               │
│                         │
│        03:42            │ ← Smaller countdown (24px)
│                         │
│ ████████░░░░░░░  37%   │
│                         │
│ Checkout in progress    │
└─────────────────────────┘
```

**Changes:**
- Countdown: 24px (down from 32px)
- Padding: 12px (down from 16px)
- Message: 13px (down from 14px)
- Icon size: 18px (down from 20px)

---

### Tooltip on Mobile

```
┌─────────────────────────────────────┐
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Can I extend?             ×   │ │
│  ├───────────────────────────────┤ │
│  │                               │ │
│  │ Reservation time is fixed...  │ │
│  │                               │ │
│  │ ┌─────────────────────────┐  │ │
│  │ │ 💡 This prevents...     │  │ │
│  │ └─────────────────────────┘  │ │
│  │                               │ │
│  └───────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
      ↑ Centered modal, tap outside to close
```

**Position:**
- Fixed position
- Centered vertically and horizontally
- Margin: 16px on all sides
- Backdrop: Tap to close

---

## Checkout Page Layout

### Desktop Sticky Timer

```
┌──────────────────────────────────────────────────────┐
│ ⏱️ Complete purchase             03:42            ?  │ ← Sticky at top
│ ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  37%    │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│                                                       │
│  Order Summary                                        │
│  ├ 4 seats @ $75.00 each                             │
│  ├ Service fee: $12.00                               │
│  └ Total: $312.00                                    │
│                                                       │
│  Payment Information                                  │
│  [Card number input]                                 │
│  [Expiry] [CVV]                                      │
│                                                       │
│  [Confirm Booking]                                   │
│                                                       │
└──────────────────────────────────────────────────────┘
```

**Sticky Timer Styles:**
- Position: sticky or fixed
- Top: 0
- Z-index: 100
- Height: 60px
- Padding: 12px 24px
- Box-shadow: 0 2px 8px rgba(0,0,0,0.1)

---

## Animation Keyframes

### Gentle Pulse (Focused Phase)

```
@keyframes gentlePulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.2);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(245, 158, 11, 0);
  }
}

Duration: 2s
Timing: ease-in-out
Iteration: infinite
```

**Visual Effect:** Subtle glow expands outward, fades away

---

### Urgent Pulse (Urgent Phase)

```
@keyframes urgentPulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.3);
  }
  50% {
    box-shadow: 0 0 0 12px rgba(239, 68, 68, 0);
  }
}

Duration: 1s
Timing: ease-in-out
Iteration: infinite
```

**Visual Effect:** More prominent glow, faster cycle, larger expansion

---

## Typography

### Timer Countdown
```
Font size: 32px (desktop), 24px (mobile)
Font weight: 700 (bold)
Font variant: tabular-nums
Letter spacing: -0.02em
Line height: 1
```

### Timer Heading
```
Font size: 16px
Font weight: 600 (semibold)
Line height: 1.5
```

### Timer Message
```
Font size: 14px (desktop), 13px (mobile)
Font weight: 400 (normal)
Line height: 1.5
Opacity: 0.9
```

### Progress Narrative
```
Font size: 12px
Font weight: 400 (normal)
Font style: italic
Opacity: 0.7
Line height: 1.4
```

---

## Spacing & Sizing

### Timer Container
```
Padding: 16px (desktop), 12px (mobile)
Border: 2px solid
Border-radius: 8px
Margin-bottom: 20px
```

### Progress Bar
```
Height: 6px
Border-radius: 3px
Margin: 12px 0
Transition: width 1s linear
```

### Icon Sizes
```
Timer icon: 20px (desktop), 18px (mobile)
Info tooltip icon: 18px
Close icon: 24px
```

---

## Interaction States

### Info Tooltip Button

**Default:**
```
Background: rgba(59, 130, 246, 0.1)
Border: 1.5px solid #3b82f6
Color: #3b82f6
```

**Hover:**
```
Background: #3b82f6
Color: white
Transform: scale(1.1)
```

**Focus:**
```
Outline: 2px solid #3b82f6
Outline-offset: 2px
```

---

## Accessibility Features

### ARIA Labels
```html
<div 
  role="timer"
  aria-live="polite"
  aria-atomic="true"
>
  <span id="timer-label" class="sr-only">
    Reservation time remaining
  </span>
</div>

<button
  aria-label="Learn about reservation time limits"
  aria-expanded="false"
>
  ?
</button>
```

### Screen Reader Text
```
Calm: "Seats secured. Take your time. 8 minutes remaining."
Focused: "Complete your purchase. 3 minutes 42 seconds remaining."
Urgent: "Almost out of time. 47 seconds left."
Expired: "Time expired. Your reservation has ended."
```

---

## Design Tokens

```css
/* Colors */
--timer-calm-bg: #dbeafe;
--timer-calm-border: #3b82f6;
--timer-calm-text: #1e40af;

--timer-focused-bg: #fef3c7;
--timer-focused-border: #f59e0b;
--timer-focused-text: #92400e;

--timer-urgent-bg: #fee2e2;
--timer-urgent-border: #ef4444;
--timer-urgent-text: #991b1b;

--timer-expired-bg: #f1f5f9;
--timer-expired-border: #6b7280;
--timer-expired-text: #374151;

/* Spacing */
--timer-padding: 16px;
--timer-padding-mobile: 12px;
--timer-gap: 8px;
--timer-margin-bottom: 20px;

/* Typography */
--timer-countdown-size: 32px;
--timer-countdown-size-mobile: 24px;
--timer-heading-size: 16px;
--timer-message-size: 14px;
--timer-narrative-size: 12px;

/* Timing */
--pulse-gentle-duration: 2s;
--pulse-urgent-duration: 1s;
--progress-transition: 1s linear;
```

---

## Quick Reference Table

| Phase | Time Range | Color | Icon | Animation | Tone |
|-------|-----------|-------|------|-----------|------|
| Calm | >5 min | Blue | ✓ | None | Reassuring |
| Focused | 5-1 min | Orange | ⏱️ | Gentle (2s) | Instructional |
| Urgent | <1 min | Red | ⏰ | Fast (1s) | Urgent |
| Expired | 0s | Gray | ⏱️ | None | Neutral |

---

## Figma/Design Handoff Notes

**Font Family:** System font stack (San Francisco on macOS, Segoe UI on Windows)

**Icons:** Use emoji or replace with SVG icons:
- ✓ → Check circle SVG
- ⏱️ → Clock SVG  
- ⏰ → Alarm clock SVG
- ? → Question mark in circle
- 💡 → Light bulb SVG

**Color Contrast:** All text meets WCAG AA standards (4.5:1 minimum)

**Animation Performance:** Use `will-change: box-shadow` for pulse animations

**Export Assets:**
- Icons as SVG (24x24px)
- Tooltip backdrop as semi-transparent overlay
- Progress bar as CSS gradient (not image)

---

## Print Reference

Use this document as a quick visual guide when:
- Implementing the timer UI
- Reviewing designs
- Testing phase transitions
- Debugging visual issues
- Communicating with designers

Refer to `timer-integration-guide.md` for code examples.
