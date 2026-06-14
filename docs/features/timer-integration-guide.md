# Reservation Timer Integration Example

## Quick Start

Here's how to integrate the enhanced timer into your components:

### Basic Integration (EnhancedSeatMap.tsx)

```tsx
import { useReservationTimer } from '../../hooks/useReservationTimer';
import { TimerInfoTooltip } from '../../components/TimerInfoTooltip';
import { SeatSelectionCopy } from '../../utils/uiCopy';

function EnhancedSeatMap({ eventId }: Props) {
  const [reservationData, setReservationData] = useState(null);
  
  // Use the enhanced timer hook
  const {
    timeRemainingFormatted,
    progressPercentage,
    timerPhase,          // 'calm' | 'focused' | 'urgent' | 'expired'
    phaseConfig,         // { heading, message, icon, progressNarrative }
    progressNarrative,   // "Seats held for you" / "Checkout in progress"
  } = useReservationTimer({
    expiresAt: reservationData?.expiresAt,
    onExpire: () => {
      showToast('error', SeatSelectionCopy.timer.reservationExpired);
      setState('IDLE');
    },
  });

  return (
    <div className="enhanced-seat-map">
      {/* Reservation Timer */}
      {state === 'RESERVED' && (
        <div className={`reservation-timer ${timerPhase}`}>
          
          {/* Header with dynamic icon and heading */}
          <div className="timer-header">
            <span className="timer-icon">{phaseConfig.icon}</span>
            <span className="timer-heading">{phaseConfig.heading}</span>
            <TimerInfoTooltip extensionAllowed={false} />
          </div>

          {/* Dynamic message based on phase */}
          <div className="timer-message">
            {typeof phaseConfig.message === 'function'
              ? phaseConfig.message(timeRemainingFormatted)
              : phaseConfig.message
            }
          </div>

          {/* Countdown display */}
          <div className="timer-countdown">
            {timeRemainingFormatted}
          </div>

          {/* Progress bar */}
          <div className="timer-progress">
            <div
              className="timer-progress-bar"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Progress narrative */}
          <div className="timer-narrative">
            {progressNarrative}
          </div>
        </div>
      )}

      {/* ... rest of seat map ... */}
    </div>
  );
}
```

---

## CSS Styling

Add these styles to your component's CSS file:

```css
/* Base Timer Styles */
.reservation-timer {
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  border: 2px solid;
  transition: all 0.3s ease;
}

.timer-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.timer-icon {
  font-size: 20px;
}

.timer-heading {
  font-size: 16px;
  font-weight: 600;
  flex: 1;
}

.timer-message {
  font-size: 14px;
  margin-bottom: 12px;
  opacity: 0.9;
}

.timer-countdown {
  font-size: 32px;
  font-weight: 700;
  text-align: center;
  margin: 12px 0;
  font-variant-numeric: tabular-nums;
}

.timer-progress {
  height: 6px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 12px;
}

.timer-progress-bar {
  height: 100%;
  transition: width 1s linear, background 0.3s ease;
}

.timer-narrative {
  font-size: 12px;
  text-align: center;
  font-style: italic;
  opacity: 0.7;
}

/* Phase-Specific Styling */

/* Calm Phase (>5 min) */
.reservation-timer.calm {
  background: #dbeafe;
  border-color: #3b82f6;
}

.reservation-timer.calm .timer-heading,
.reservation-timer.calm .timer-message {
  color: #1e40af;
}

.reservation-timer.calm .timer-countdown {
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

.reservation-timer.focused .timer-heading,
.reservation-timer.focused .timer-message {
  color: #92400e;
}

.reservation-timer.focused .timer-countdown {
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

.reservation-timer.urgent .timer-heading,
.reservation-timer.urgent .timer-message {
  color: #991b1b;
}

.reservation-timer.urgent .timer-countdown {
  color: #991b1b;
}

.reservation-timer.urgent .timer-progress-bar {
  background: #ef4444;
}

/* Expired Phase */
.reservation-timer.expired {
  background: #f1f5f9;
  border-color: #6b7280;
  animation: none;
}

.reservation-timer.expired .timer-heading,
.reservation-timer.expired .timer-message,
.reservation-timer.expired .timer-countdown {
  color: #374151;
}

.reservation-timer.expired .timer-progress-bar {
  background: #6b7280;
}

/* Animations */
@keyframes gentlePulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.2);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(245, 158, 11, 0);
  }
}

@keyframes urgentPulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.3);
  }
  50% {
    box-shadow: 0 0 0 12px rgba(239, 68, 68, 0);
  }
}

/* Mobile Responsive */
@media (max-width: 640px) {
  .timer-countdown {
    font-size: 24px;
  }

  .timer-header {
    flex-wrap: wrap;
  }

  .timer-message {
    font-size: 13px;
  }
}
```

---

## Minimal Integration (Just Want the Phases?)

If you already have a timer UI and just want dynamic messaging:

```tsx
import { useReservationTimer } from '../../hooks/useReservationTimer';

const {
  timerPhase,          // 'calm' | 'focused' | 'urgent' | 'expired'
  phaseConfig,         // Copy object with heading, message, icon
  progressNarrative,   // Status message
} = useReservationTimer({
  expiresAt: reservation.expiresAt,
});

// Use phase for styling
<div className={`timer ${timerPhase}`}>
  {phaseConfig.icon} {phaseConfig.heading}
</div>
```

---

## CheckoutPage Integration

```tsx
import { useReservationTimer } from '../../hooks/useReservationTimer';
import { TimerInfoTooltip } from '../../components/TimerInfoTooltip';

function CheckoutPage() {
  const { state } = useLocation();
  
  const {
    timeRemainingFormatted,
    progressPercentage,
    timerPhase,
    phaseConfig,
    progressNarrative,
  } = useReservationTimer({
    expiresAt: state?.expiresAt,
    onExpire: () => {
      setError('Your reservation has expired');
      setTimeout(() => navigate(`/events/${state.eventId}`), 3000);
    },
  });

  return (
    <div className="checkout-page">
      {/* Sticky Timer at Top */}
      <div className={`checkout-timer-sticky ${timerPhase}`}>
        <div className="timer-left">
          <span className="timer-icon">{phaseConfig.icon}</span>
          <div>
            <div className="timer-title">{phaseConfig.heading}</div>
            <div className="timer-subtitle">{progressNarrative}</div>
          </div>
        </div>
        
        <div className="timer-right">
          <div className="timer-time">{timeRemainingFormatted}</div>
          <TimerInfoTooltip extensionAllowed={false} position="left" />
        </div>

        <div className="timer-progress-bar" style={{ width: `${progressPercentage}%` }} />
      </div>

      {/* Payment form, etc. */}
    </div>
  );
}
```

---

## Hook Return Values Reference

```typescript
const {
  // Existing (backward compatible)
  timeRemaining: number;           // 124 (seconds)
  timeRemainingFormatted: string;  // "02:04"
  isExpired: boolean;              // false
  isWarning: boolean;              // true if <60s
  progressPercentage: number;      // 21 (0-100)
  reset: (newDate: Date) => void;
  clear: () => void;

  // NEW UX enhancements
  timerPhase: 'calm' | 'focused' | 'urgent' | 'expired';
  
  phaseConfig: {
    heading: string;               // "Complete your purchase"
    message: string | Function;    // Dynamic message
    icon: string;                  // "⏱️"
    progressNarrative: string;     // "Checkout in progress"
  };
  
  progressNarrative: string;       // Direct access to narrative
} = useReservationTimer({ ... });
```

---

## Tooltip Usage

### Basic (No Extension Allowed)

```tsx
<TimerInfoTooltip extensionAllowed={false} />
```

Shows: "Reservation time is fixed to ensure fairness..."

### Future: With Extension

```tsx
<TimerInfoTooltip
  extensionAllowed={true}
  onExtendTime={() => {
    // Call API to extend reservation
    extendReservation(reservationId);
  }}
/>
```

Shows: "Extend Time" button

### Custom Positioning

```tsx
<TimerInfoTooltip
  extensionAllowed={false}
  position="top"    // 'top' | 'bottom' | 'left' | 'right'
/>
```

---

## Copy Customization

Edit `src/frontend/src/utils/uiCopy.ts`:

```typescript
timer: {
  phases: {
    calm: {
      heading: 'Your seats are secure',        // Custom heading
      message: 'Complete checkout at your pace',
      icon: '✓',
      progressNarrative: 'Reserved for you',
    },
    // ... other phases
  },
}
```

---

## Testing the Timer

### 1. Test Phase Transitions

```tsx
// Mock different times
const mockTimer = (seconds: number) => {
  return useReservationTimer({
    expiresAt: new Date(Date.now() + seconds * 1000),
  });
};

// 10 minutes → calm
mockTimer(600);

// 3 minutes → focused
mockTimer(180);

// 45 seconds → urgent
mockTimer(45);

// 0 seconds → expired
mockTimer(0);
```

### 2. Visual Testing Checklist

- [ ] >5 min: Blue background, calm tone, no pulse
- [ ] 4:30: Orange background, gentle pulse starts
- [ ] 0:45: Red background, faster pulse
- [ ] 0:00: Gray background, "Time expired" message
- [ ] Progress bar animates smoothly
- [ ] Narrative text changes correctly
- [ ] Tooltip opens/closes properly

---

## Accessibility

The timer includes built-in accessibility:

```tsx
<div
  className="reservation-timer"
  role="timer"
  aria-live="polite"
  aria-atomic="true"
>
  {/* Screen reader announces phase changes */}
</div>
```

**Screen readers hear:**
- "Seats secured. Take your time reviewing your order. 8 minutes 24 seconds remaining"
- Phase changes announced automatically
- Time updates every 60 seconds (not spammy)

---

## Common Patterns

### Pattern 1: Hide Timer in Certain Phases

```tsx
{state === 'RESERVED' && timerPhase !== 'expired' && (
  <ReservationTimer />
)}
```

### Pattern 2: Different UI for Mobile

```tsx
{isMobile ? (
  <CompactTimer phase={timerPhase} time={timeRemainingFormatted} />
) : (
  <FullTimer {...timerProps} />
)}
```

### Pattern 3: Custom Phase Thresholds

```tsx
// Want warning at 2 min instead of 5 min?
const { isWarning } = useReservationTimer({
  expiresAt: reservation.expiresAt,
  warningThresholdSeconds: 120,  // 2 minutes
});
```

---

## Backward Compatibility

All existing timer code still works:

```tsx
// Old code (still works)
const { timeRemainingFormatted, isWarning } = useReservationTimer({
  expiresAt: reservation.expiresAt,
});

return (
  <div className={`timer ${isWarning ? 'warning' : ''}`}>
    Time Remaining: {timeRemainingFormatted}
  </div>
);
```

New features are additive, not breaking!

---

## Files Reference

```
src/frontend/src/
├── utils/
│   └── uiCopy.ts                    (Copy with timer.phases)
├── hooks/
│   └── useReservationTimer.ts       (Enhanced hook)
└── components/
    └── TimerInfoTooltip/            (Optional tooltip)
        ├── TimerInfoTooltip.tsx
        ├── TimerInfoTooltip.css
        └── index.ts
```

---

## Next Steps

1. **Integrate into EnhancedSeatMap.tsx**
   - Replace existing timer JSX with new phased version
   - Add TimerInfoTooltip to header

2. **Integrate into CheckoutPage.tsx**
   - Add sticky timer at top
   - Use compact layout for mobile

3. **Test with Real Users**
   - A/B test messaging variations
   - Measure conversion rates by phase

4. **Future: Add Extension Feature**
   - Backend: Add `extendReservation()` endpoint
   - Frontend: Enable `extensionAllowed={true}`
   - Track usage and impact

---

## Summary

✅ **Dynamic tone-based messaging** (calm → focused → urgent)  
✅ **Progress narratives** for context  
✅ **Educational tooltip** explaining time limits  
✅ **Backward compatible** with existing code  
✅ **Fully styled** with CSS phases  
✅ **Mobile responsive**  
✅ **Accessible** with ARIA support  
✅ **TypeScript** type-safe  

Ready to use!
