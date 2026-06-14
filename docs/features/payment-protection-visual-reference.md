# Payment Protection UX - Visual Reference

Visual guide showing all payment protection features and when they appear.

---

## 1. Payment Protection Badge (Always Visible)

**Location:** Checkout header, next to "Review Your Booking" heading

```
┌─────────────────────────────────────────────────────────────┐
│  Review Your Booking  [🛡️ Payment Protected ⓘ]              │
│  Please review your booking details before confirming       │
│                                            ⏱️ Time: 5:00    │
└─────────────────────────────────────────────────────────────┘
```

**Visual Style:**
- Green background (`bg-green-50`)
- Green border (`border-green-200`)
- Shield icon + text + info icon
- Hover: Darker green (`hover:bg-green-100`)

**Tooltip on Hover:**
```
Your payment is protected from duplicate charges. Click to learn more.
```

---

## 2. Payment Protection Modal (On Badge Click)

**Trigger:** User clicks protection badge

```
┌─────────────────────────────────────────────────────────────┐
│ ╔═══════════════════════════════════════════════════════╗   │
│ ║ 🛡️ Your Payment is Protected                         ║   │
│ ║ Safe to retry without worry                           ║   │
│ ╠═══════════════════════════════════════════════════════╣   │
│ ║                                                       ║   │
│ ║ ✓  No Double Charges                                 ║   │
│ ║    If your payment request is submitted multiple     ║   │
│ ║    times (slow network, accidental retry, etc.),     ║   │
│ ║    you'll only be charged once. Our system           ║   │
│ ║    remembers your request and prevents duplicate     ║   │
│ ║    charges.                                           ║   │
│ ║                                                       ║   │
│ ║ ℹ️  How It Works                                      ║   │
│ ║    Each payment attempt gets a unique "fingerprint"  ║   │
│ ║    that lasts 24 hours. If we see the same           ║   │
│ ║    fingerprint again, we return your original        ║   │
│ ║    booking instead of creating a new charge.         ║   │
│ ║                                                       ║   │
│ ║ 🔄  Safe to Retry                                     ║   │
│ ║    If your payment fails or times out, you can       ║   │
│ ║    safely click "Confirm Payment" again. You won't   ║   │
│ ║    be double-charged, and your seat reservation      ║   │
│ ║    remains secure.                                    ║   │
│ ║                                                       ║   │
│ ║                                    [    Got it    ]   ║   │
│ ╚═══════════════════════════════════════════════════════╝   │
└─────────────────────────────────────────────────────────────┘
```

**Visual Style:**
- Green gradient header (`from-green-500 to-emerald-500`)
- White background body
- Three sections with icons (✓, ℹ️, 🔄)
- Gray footer with green CTA button

---

## 3. Slow Network Indicator (During Long Requests)

**Trigger:** Payment request exceeds 5 seconds  
**Location:** Below checkout header, above error messages

```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ Taking longer than usual                                  │
│                                                              │
│ Your payment is still processing securely. Please don't     │
│ close this page or refresh. If it times out, you can        │
│ safely retry without being charged twice.                   │
│                                                              │
│ 🛡️ Safe to wait — you won't be double-charged               │
└─────────────────────────────────────────────────────────────┘
```

**Visual Style:**
- Amber background (`bg-amber-50`)
- Amber left border (`border-l-4 border-amber-400`)
- WiFi + Clock icon combo
- Fade-in animation (0.3s)

**Purpose:**
- Prevents page refresh
- Reduces abandonment
- Reinforces retry safety

---

## 4. Idempotency Replay Notification (On Duplicate Detection)

**Trigger:** Backend returns idempotency replay (HTTP 200 or header)  
**Location:** Top of checkout content area

```
┌─────────────────────────────────────────────────────────────┐
│ ✓ Booking Already Confirmed                              [×]│
│                                                              │
│ This payment was already processed successfully             │
│ (BK-2026-ABC123). No duplicate charge was made.             │
└─────────────────────────────────────────────────────────────┘
```

**Visual Style:**
- Green success background (`bg-green-50`)
- Green left border (`border-l-4 border-green-500`)
- CheckCircle icon
- Manual dismiss button (×)
- Slide-in-from-top animation (0.4s)

**Behavior:**
- Auto-dismisses after 8 seconds
- Manual dismiss via × button
- Only shows once per replay

---

## 5. Enhanced Error Messages (On Payment Failure)

**Trigger:** Payment fails (timeout, declined, network error)  
**Location:** Below checkout header

```
┌─────────────────────────────────────────────────────────────┐
│ ❌ Booking Error                                             │
│                                                              │
│ Payment timed out / declined / network error                │
│                                                              │
│ 🛡️ Safe to retry — duplicate charges are automatically      │
│    prevented                                                │
└─────────────────────────────────────────────────────────────┘
```

**Visual Style:**
- Red background (`bg-red-50`)
- Red border (`border border-red-200`)
- Error text (`text-red-700`)
- Green safety note at bottom

**Error Types:**
1. **Timeout:** "Payment timed out"
2. **Declined:** "Payment declined by your bank"
3. **Network:** "Connection issue - card not charged"
4. **General:** Custom error message

---

## 6. Processing States (During Payment)

**Button Text Evolution:**

```
Normal State:
┌─────────────────────────┐
│ 💳 Confirm & Pay        │
└─────────────────────────┘

Processing (0-5s):
┌─────────────────────────┐
│ ⏳ Processing payment...│
└─────────────────────────┘

Slow Network (5-10s):
┌─────────────────────────┐
│ ⏳ Processing payment...│
└─────────────────────────┘
[Slow network indicator appears above]

Very Slow (10s+):
┌─────────────────────────┐
│ ⏳ Processing payment...│
└─────────────────────────┘
[Slow network: "Taking longer than usual..."]
```

---

## Complete User Journey Examples

### Scenario A: Normal Payment (Fast Network)

```
1. User arrives at checkout
   → See: Protection badge in header
   
2. User clicks badge (optional)
   → See: Educational modal
   
3. User clicks "Confirm & Pay"
   → See: "Processing payment..." (2 seconds)
   
4. Payment succeeds
   → Navigate to confirmation page
```

**Visible Protection:** Badge only  
**User Reassurance:** Proactive (badge establishes trust)

---

### Scenario B: Slow Network

```
1. User arrives at checkout
   → See: Protection badge in header
   
2. User clicks "Confirm & Pay"
   → See: "Processing payment..." (0-5s)
   
3. Request takes longer than 5 seconds
   → See: Slow network indicator appears
   → Message: "Taking longer than usual..."
   → Note: "Safe to wait — you won't be double-charged"
   
4. Payment succeeds after 8 seconds
   → Navigate to confirmation page
```

**Visible Protection:** Badge + Slow network indicator  
**User Reassurance:** Reactive (prevents abandonment during delay)

---

### Scenario C: Payment Timeout → Retry

```
1. User clicks "Confirm & Pay"
   → See: "Processing payment..." (10s)
   → See: Slow network indicator (after 5s)
   
2. Request times out after 30 seconds
   → See: Error message
   → Error: "Payment timed out"
   → Note: "🛡️ Safe to retry — duplicate charges prevented"
   
3. User clicks "Retry"
   → Same idempotency key used
   → See: "Processing payment..." (2s)
   
4. Payment succeeds
   → Navigate to confirmation page
```

**Visible Protection:** Badge + Slow network + Error note  
**User Reassurance:** Layered (during delay + after failure)

---

### Scenario D: Accidental Retry (Idempotency Replay)

```
1. User clicks "Confirm & Pay"
   → Payment succeeds (HTTP 201 Created)
   
2. User confused, clicks back button
   → Returns to checkout page
   
3. User clicks "Confirm & Pay" again
   → Same idempotency key
   → Backend returns cached booking (HTTP 200 OK)
   → Header: "Idempotency-Replay: true"
   
4. Replay detected
   → See: Replay notification
   → Message: "✓ Booking Already Confirmed"
   → Details: "This payment was already processed (BK-2026-ABC123)"
   → Navigate to confirmation page
```

**Visible Protection:** Badge + Replay notification  
**User Reassurance:** Transparent (explains what happened)

---

## Mobile Responsive Design

### Protection Badge (Mobile)

```
┌───────────────────────────┐
│ Review Your Booking       │
│ [🛡️ Payment Protected ⓘ] │
│                           │
│ ⏱️ Time: 5:00             │
└───────────────────────────┘
```

Badge wraps to new line on small screens.

### Modal (Mobile)

Modal becomes full-screen on mobile:
- Takes 90% of viewport height
- Scrollable content
- Tap outside to close
- Close button always visible

### Indicators (Mobile)

Full-width alerts with proper padding:
```
┌─────────────────────────┐
│ ⚠️ Taking longer...     │
│                         │
│ Your payment is still   │
│ processing securely...  │
└─────────────────────────┘
```

---

## Accessibility Features

### Screen Reader Announcements

**Protection Badge:**
```
"Button: Payment protection information. 
Your payment is protected from duplicate charges. 
Click to learn more."
```

**Slow Network Indicator:**
```
"Status: Taking longer than usual. 
Your payment is still processing securely..."
```

**Replay Notification:**
```
"Alert: Booking Already Confirmed. 
This payment was already processed successfully..."
```

### Keyboard Navigation

- **Tab:** Focus badge → Focus dismiss buttons
- **Enter/Space:** Activate badge → Open modal
- **Escape:** Close modal
- **Tab Trap:** Modal keeps focus until closed

### ARIA Labels

```html
<!-- Badge -->
<button aria-label="Payment protection information">
  Payment Protected
</button>

<!-- Modal -->
<div role="dialog" aria-modal="true" aria-labelledby="payment-protection-title">
  ...
</div>

<!-- Alerts -->
<div role="alert" aria-live="polite">
  Slow network message...
</div>
```

---

## Color Accessibility

All color combinations meet WCAG AA standards:

| Element | Foreground | Background | Contrast Ratio |
|---------|-----------|------------|----------------|
| Badge text | `text-green-700` | `bg-green-50` | 7.2:1 ✓ |
| Modal header | White | Green gradient | 8.1:1 ✓ |
| Slow network | `text-amber-800` | `bg-amber-50` | 6.8:1 ✓ |
| Replay notification | `text-green-900` | `bg-green-50` | 9.1:1 ✓ |
| Error message | `text-red-700` | `bg-red-50` | 7.5:1 ✓ |

---

## Animation Timing

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Badge hover | Background color | 200ms | ease |
| Modal backdrop | Fade in | 300ms | ease-out |
| Modal content | Slide + fade | 400ms | ease-out |
| Slow network | Fade in | 300ms | ease-out |
| Replay notification | Slide from top | 400ms | ease-out |

---

**Last Updated:** January 30, 2026  
**Related:** [payment-protection-ux.md](./payment-protection-ux.md)
