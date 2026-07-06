# Partial Reservation Modal - UX Decision Architecture

**Feature:** Improved decision-making for partial reservation scenarios  
**Date:** January 30, 2026  
**Status:** ✅ Implemented

---

## 🎯 Problem Statement

When some (but not all) seat selections succeed, users face a difficult decision with insufficient information:
- ❌ **Old behavior:** Simple toast: "Reserved 2 of 3 seats. 1 unavailable."
- ❌ **Issues:** No context, unclear trade-offs, no guidance

**User confusion:**
1. "Why did this happen?"
2. "Should I proceed with fewer seats or try again?"
3. "What are the trade-offs?"
4. "Will similar seats be available if I retry?"

---

## ✨ Solution: Decision-Oriented Modal

### Core UX Principles

1. **Explain Context First**
   - Why partial success happened
   - Not user's fault — timing issue
   - Build understanding before decision

2. **Show Trade-offs Explicitly**
   - Success rate (% seats secured)
   - Total price vs lost value
   - Group seating impact

3. **Provide Clear Recommendations**
   - Data-driven guidance
   - Action-oriented language
   - Adapt to scenario

4. **Respect User Autonomy**
   - Recommendations, not mandates
   - All options equally accessible
   - Clear consequences for each choice

---

## 🧠 Decision Heuristics

### Success Rate Thresholds

```typescript
// High success (≥67%) → Recommend "Proceed"
if (successRate >= 0.67) {
  recommendation = 'proceed';
  rationale = 'Most seats secured, unlikely to find better';
}

// Medium success (33-66%) → Neutral
else if (successRate >= 0.33) {
  recommendation = 'neutral';
  rationale = 'Depends on group needs';
}

// Low success (<33%) → Recommend "Try again"
else {
  recommendation = 'try_again';
  rationale = 'Too many failures, better options likely exist';
}
```

### Contextual Factors

**Failure Reason Analysis:**
```typescript
// Categorize by reason
staleVersions   → "just taken" (timing collision)
alreadyReserved → "temporarily held" (may free up)
alreadyBooked   → "sold out" (permanent)
locked          → "processing conflict" (retry immediately)
```

**Explanation Priority:**
1. Stale versions → Most common, least user fault
2. Already booked → Permanent, no retry value
3. Already reserved → Temporary, may retry later
4. Locked → Technical, immediate retry viable

---

## 📊 Modal Layout

### 1. Header (Amber Gradient)
```
┌─────────────────────────────────────────────┐
│ ⚠️ Partial Reservation Success              │
│ We reserved 2 of 3 seats you selected       │
└─────────────────────────────────────────────┘
```

**Color:** Amber/Orange (warning, not error)  
**Tone:** Informative, non-alarming

---

### 2. Context Explanation (Blue Alert)
```
┌─────────────────────────────────────────────┐
│ ℹ️ Why did this happen?                     │
│                                             │
│ These 1 seats were reserved by other       │
│ customers just moments ago.                 │
│                                             │
│ Popular events fill up quickly. Seats are  │
│ only held once you click "Reserve."        │
└─────────────────────────────────────────────┘
```

**Purpose:** Answer "why" before "what now"  
**Tone:** Educational, reassuring

---

### 3. Trade-offs Dashboard (3 Cards)

```
┌─────────────┬─────────────┬─────────────┐
│ Success Rate│ Total Price │ Group Impact│
│             │             │             │
│    67%      │  $100.00    │   1 seat    │
│ 2 of 3 seats│ $50.00 lost │ May be split│
└─────────────┴─────────────┴─────────────┘
```

**Metrics:**
1. **Success Rate:** Visual % + fraction
2. **Total Price:** Actual cost + lost value
3. **Group Impact:** Seating split consequence

**Why these 3?**
- Success rate → Objective quality measure
- Total price → Financial impact
- Group impact → Social/practical consequence

---

### 4. Reserved Seats (Green Section)
```
┌─────────────────────────────────────────────┐
│ ✓ Reserved (2 seats)                        │
│ ┌────┐ ┌────┐                              │
│ │ A1 │ │ A2 │                              │
│ └────┘ └────┘                              │
│                                             │
│ Subtotal: $100.00                           │
└─────────────────────────────────────────────┘
```

**Visual:** Green theme (success)  
**Details:** Seat numbers + subtotal

---

### 5. Failed Seats (Red Section)
```
┌─────────────────────────────────────────────┐
│ ✗ Unavailable (1 seat)                      │
│                                             │
│ A3 ············· Seat is reserved           │
└─────────────────────────────────────────────┘
```

**Visual:** Red theme (failure)  
**Details:** Seat numbers + specific reasons

---

### 6. Recommendation (Gradient Card)

#### High Success (Proceed)
```
┌─────────────────────────────────────────────┐
│ 💡 Our Recommendation                       │
│                                             │
│ Proceed with 2 seats. You got 67% of what  │
│ you wanted. The missing seat was likely    │
│ taken moments ago.                          │
│                                             │
│ ✓ You've secured 2 confirmed seats         │
│ ✓ Seats are held for 10 minutes            │
│ ⚠️ 1 person may need alternative seating    │
└─────────────────────────────────────────────┘
```

**Color:** Green gradient  
**Primary action:** Proceed

#### Low Success (Try Again)
```
┌─────────────────────────────────────────────┐
│ 💡 Our Recommendation                       │
│                                             │
│ Try selecting more seats together. You only│
│ got 33% of what you wanted. Better to find │
│ 3 seats together.                           │
│                                             │
│ ↻ Different seats may be available now     │
│ ↻ Consider alternative sections            │
│ ⚠️ Current reservation will be released     │
└─────────────────────────────────────────────┘
```

**Color:** Blue gradient  
**Primary action:** Try again

#### Medium Success (Neutral)
```
┌─────────────────────────────────────────────┐
│ 💡 Our Recommendation                       │
│                                             │
│ Your choice. You got 50% of what you       │
│ wanted. Consider if 2 seats work for your  │
│ group, or if you need all 3 together.      │
│                                             │
│ → Proceed if fewer seats acceptable        │
│ → Try again if need everyone together      │
│ ⚠️ No guarantee similar seats available     │
└─────────────────────────────────────────────┘
```

**Color:** Neutral gray gradient  
**Primary action:** Equal prominence

---

### 7. Action Buttons

#### High Success Scenario
```
┌──────────────────────────────────────────────┐
│ [Proceed with 2 Seats ($100)] [Try Again]   │
│                           [Cancel All]       │
└──────────────────────────────────────────────┘
```

**Layout:** Primary (green) + secondary + tertiary

#### Low Success Scenario
```
┌──────────────────────────────────────────────┐
│ [Select 3 Seats Together] [Proceed Anyway]  │
│                           [Cancel All]       │
└──────────────────────────────────────────────┘
```

**Layout:** Primary (blue) + secondary + tertiary

---

## 🎨 Copy Variants

### Explanations by Failure Reason

#### Stale Versions (Most Common)
```
Single seat:
"This seat was reserved by another customer just moments ago 
while you were selecting."

Multiple seats:
"These 2 seats were reserved by other customers just moments ago."
```

**Tone:** Neutral, timing-based (not user's fault)

#### Already Booked (Permanent)
```
Single:
"This seat was just purchased and is no longer available."

Multiple:
"These 2 seats were just purchased and are no longer available."
```

**Tone:** Definitive, no retry suggestion

#### Already Reserved (Temporary)
```
Single:
"This seat is temporarily reserved by another customer (may 
become available if not purchased)."

Multiple:
"These 2 seats are temporarily reserved by other customers."
```

**Tone:** Hope for future availability

#### Locked (Technical)
```
"These seats were being processed by another request at the 
same time. They may be available now."
```

**Tone:** Technical explanation + immediate retry viable

---

### Recommendation Copy

#### Proceed (≥67% success)
```
Heading: "Proceed with available seats"

Message:
"You got 67% of what you wanted. The missing seat was likely 
taken moments ago, and similar seats may not be available."

Benefits:
• ✓ You've secured 2 confirmed seats
• ✓ Seats are held for 10 minutes

Trade-off:
• ⚠️ 1 person may need alternative seating
```

#### Try Again (<33% success)
```
Heading: "Try selecting more seats together"

Message:
"You only got 33% of what you wanted. It may be better to 
cancel and find 3 seats together."

Benefits:
• ↻ Different seats may be available now
• ↻ Consider alternative sections or rows

Trade-off:
• ⚠️ Your current reservation will be released
```

#### Neutral (33-66% success)
```
Heading: "Your choice"

Message:
"You got 50% of what you wanted. Consider whether 2 seats 
work for your group, or if you need all 3 together."

Options:
• → Proceed if fewer seats are acceptable
• → Try again if you need everyone together
• ⚠️ No guarantee similar seats available
```

---

## 📐 Decision Matrix

| Success Rate | Seats | Recommendation | Primary Button | Button Color |
|--------------|-------|----------------|----------------|--------------|
| 80-100% | 4/5 | Proceed strongly | "Proceed with 4 Seats" | Green |
| 67-79% | 2/3 | Proceed moderately | "Proceed with 2 Seats" | Green |
| 50-66% | 3/6 | Neutral | Both equal | Gray |
| 33-49% | 1/3 | Try again moderately | "Select 3 Seats Together" | Blue |
| 0-32% | 1/5 | Try again strongly | "Select 5 Seats Together" | Blue |

---

## 🔧 Implementation Details

### Component Props
```typescript
interface PartialReservationModalProps {
  reservedCount: number;           // Successfully reserved
  failedSeats: FailedSeat[];       // Failed with reasons
  pricePerSeat: number;            // For calculations
  originalCount: number;           // User's intent
  reservedSeatNumbers: string[];   // For display
  failedSeatNumbers: string[];     // For display
  onProceed: () => void;           // Checkout action
  onSelectMore: () => void;        // Retry action
  onCancel: () => void;            // Cancel action
  isOpen: boolean;                 // Modal state
}
```

### Calculation Logic
```typescript
// Core metrics
const successRate = reservedCount / originalCount;
const totalReservedPrice = reservedCount * pricePerSeat;
const lostValue = failedSeats.length * pricePerSeat;

// Categorize failures
const staleVersions = failedSeats.filter(f => 
  f.reason.includes('stale version')
);
const alreadyBooked = failedSeats.filter(f => 
  f.reason.includes('booked')
);
const alreadyReserved = failedSeats.filter(f => 
  f.reason.includes('reserved')
);
const locked = failedSeats.filter(f => 
  f.reason.includes('locked')
);

// Determine primary reason (priority order)
if (staleVersions.length > 0) {
  primaryReason = 'just_taken';
} else if (alreadyBooked.length > 0) {
  primaryReason = 'sold_out';
} else if (alreadyReserved.length > 0) {
  primaryReason = 'reserved';
} else if (locked.length > 0) {
  primaryReason = 'timing';
}

// Generate recommendation
if (successRate >= 0.67) {
  recommendation = 'proceed';
} else if (successRate >= 0.33) {
  recommendation = 'neutral';
} else {
  recommendation = 'try_again';
}
```

---

## 📱 Responsive Design

### Desktop (>768px)
- 3-column trade-off cards
- Side-by-side action buttons
- Full modal width: 640px

### Mobile (<768px)
- Stacked trade-off cards
- Stacked action buttons
- Full viewport width with padding
- Scrollable content

---

## ♿ Accessibility

### ARIA Labels
```html
<div role="dialog" aria-modal="true" 
     aria-labelledby="partial-reservation-title">
  <h2 id="partial-reservation-title">
    Partial Reservation Success
  </h2>
  ...
</div>
```

### Keyboard Navigation
- **Escape:** Close modal (via onCancel)
- **Tab:** Navigate between buttons
- **Enter/Space:** Activate focused button

### Screen Reader
- Announces modal title first
- Reads explanation section
- Announces trade-offs
- Reads recommendation with priority
- Lists all button options

### Color Contrast
- All text meets WCAG AA standards
- Success green: 7.2:1 contrast
- Warning amber: 6.8:1 contrast
- Error red: 7.5:1 contrast

---

## 🧪 Testing Scenarios

### Scenario 1: High Success (4/5 seats)
```
Input: 5 seats attempted, 4 reserved
Output:
- Success rate: 80%
- Recommendation: "Proceed" (green)
- Primary button: "Proceed with 4 Seats ($200.00)"
- Explanation: "These 1 seats were just purchased..."
```

### Scenario 2: Low Success (1/5 seats)
```
Input: 5 seats attempted, 1 reserved
Output:
- Success rate: 20%
- Recommendation: "Try again" (blue)
- Primary button: "Select 5 Seats Together"
- Explanation: "These 4 seats were reserved by other customers..."
```

### Scenario 3: Neutral (3/6 seats)
```
Input: 6 seats attempted, 3 reserved
Output:
- Success rate: 50%
- Recommendation: "Your choice" (neutral)
- Both buttons equal prominence
- Explanation: Context-dependent
```

### Scenario 4: All Stale Versions
```
Input: Failed due to timing collision
Output:
- Explanation: "just taken" variant
- Trade-off: Immediate retry viable
- Note: Seats may still be available
```

---

## 📈 Success Metrics

### User Behavior Metrics
1. **Decision time:** Average time to choose action
2. **Proceed rate:** % who proceed with partial
3. **Retry rate:** % who try selecting again
4. **Cancel rate:** % who abandon entirely

### Outcome Metrics
1. **Conversion improvement:** vs old toast-only approach
2. **User satisfaction:** Post-booking survey
3. **Support tickets:** Reduction in confusion-related tickets

### A/B Testing
- **Control:** Old toast notification
- **Treatment:** New decision modal
- **Hypothesis:** 20% improvement in conversion

---

## 🚀 Future Enhancements

### Phase 2
1. **Smart retry suggestions**
   - Analyze failed seats
   - Suggest alternative sections
   - "Section B has 3 seats available together"

2. **Historical data**
   - "85% of users in this scenario chose to proceed"
   - Social proof to guide decisions

3. **Real-time availability**
   - Show current seat map in modal
   - Highlight alternative seats
   - "Select alternatives now"

### Phase 3
1. **Predictive recommendations**
   - ML model based on user behavior
   - Personalized suggestions
   - "Based on your preferences..."

2. **Group coordination**
   - "Share this with your group"
   - Real-time group voting
   - Collaborative decision-making

---

## 📚 Related Documentation

- [Seat Selection UX Enhancements](./seat-selection-ux-enhancements.md)
- [Reservation Timer UX](./reservation-timer-ux-enhancements.md)
- [Payment Protection UX](./payment-protection-ux.md)
- [Architecture - Partial Success](../architecture.md#partial-reservation-success)

---

**Last Updated:** January 30, 2026  
**Component:** `apps/frontend/src/components/PartialReservationModal/`  
**Copy:** `apps/frontend/src/utils/uiCopy.ts` (SeatSelectionCopy.partialSuccess.modal)
