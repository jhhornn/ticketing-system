# Recommended Seats Feature - Integration Guide

## Overview

This feature provides intelligent seat recommendations based on contiguity, price, proximity, and availability. It suggests optimal seating arrangements without auto-selecting seats.

## Components Created

### 1. `seatRecommendations.ts` - Algorithm Engine

**Location:** `apps/frontend/src/utils/seatRecommendations.ts`

**Core Functions:**

```typescript
// Get top N recommended seat groups
getRecommendedSeats(
  seatMap: SeatMapData,
  options: RecommendationOptions,
  topN?: number
): SeatGroup[]

// Check if a seat is recommended
isSeatRecommended(
  seatId: number,
  recommendations: SeatGroup[]
): boolean

// Get recommendation rank (1 = best, 2 = second, etc.)
getSeatRecommendationRank(
  seatId: number,
  recommendations: SeatGroup[]
): number | null

// Format recommendation for display
formatRecommendationInfo(group: SeatGroup): string
```

**Scoring Algorithm:**

- **Contiguity (40% weight):** Prefers seats together in the same row
- **Price (25% weight):** Balances affordability with quality (sweet spot: 20-50% of price range)
- **Proximity (20% weight):** Prefers lower row numbers/letters (closer to stage)
- **Availability (15% weight):** Avoids nearly-expired reserved seats

**Example Usage:**

```typescript
import { getRecommendedSeats } from './utils/seatRecommendations';

// Get recommendations for 4 seats
const recommendations = getRecommendedSeats(seatMap, {
  desiredSeatCount: 4,
  maxPricePer: 100,
  preferredSections: ['Orchestra', 'Mezzanine']
}, 3); // Get top 3 options

// recommendations[0] is the best recommendation
// recommendations[0].score ranges from 0-1 (1 = perfect)
// recommendations[0].isContiguous = true if all seats are together
```

---

### 2. `RecommendedSeatsBanner` - UI Component

**Location:** `apps/frontend/src/components/RecommendedSeatsBanner/`

**Features:**
- Lightweight, collapsible banner
- Shows top recommendation in collapsed view
- Expandable to see all recommendations
- Dismissible
- Quality badges (Excellent/Good/Fair/Available)
- Contiguity indicators

**Props:**

```typescript
interface RecommendedSeatsBannerProps {
  recommendations: SeatGroup[];
  desiredSeatCount: number;
  onSelectRecommendation?: (group: SeatGroup) => void;
  onDismiss?: () => void;
}
```

**Example Usage:**

```tsx
import { RecommendedSeatsBanner } from './components/RecommendedSeatsBanner';

<RecommendedSeatsBanner
  recommendations={recommendations}
  desiredSeatCount={4}
  onSelectRecommendation={(group) => {
    // Scroll to recommended seats or highlight them
    console.log('View seats:', group.seats);
  }}
  onDismiss={() => setShowRecommendations(false)}
/>
```

---

### 3. Visual Highlighting - CSS Enhancements

**Location:** `apps/frontend/src/components/EnhancedSeatMap/EnhancedSeatMap.css`

**Recommended Seat Styles:**

- Green gradient background with pulse animation
- Glowing border effect
- Star badge (⭐) in top-right corner
- Hover effects for interactivity

**CSS Classes:**
- `.seat-recommended` - Apply to recommended seats
- `.seat-recommended.seat-selected` - Recommended seat that's been selected

---

## Integration Steps for EnhancedSeatMap

### Step 1: Add State and Imports

```typescript
import { useState, useEffect, useMemo } from 'react';
import { 
  getRecommendedSeats, 
  isSeatRecommended,
  getSeatRecommendationRank,
  type SeatGroup 
} from '../../utils/seatRecommendations';
import { RecommendedSeatsBanner } from '../RecommendedSeatsBanner';

// Add to component state
const [desiredSeatCount, setDesiredSeatCount] = useState(2);
const [showRecommendations, setShowRecommendations] = useState(true);
const [recommendations, setRecommendations] = useState<SeatGroup[]>([]);
```

### Step 2: Calculate Recommendations

```typescript
// Add after seatMap is loaded
useEffect(() => {
  if (!seatMap || !showRecommendations) return;
  
  const recs = getRecommendedSeats(
    seatMap,
    {
      desiredSeatCount,
      maxPricePer: 150, // Optional: set based on user preferences
      preferredSections: [], // Optional: user can select preferred sections
    },
    3 // Get top 3 recommendations
  );
  
  setRecommendations(recs);
}, [seatMap, desiredSeatCount, showRecommendations]);
```

### Step 3: Add Seat Count Selector

```tsx
// Add above the seat map
<div className="seat-count-selector">
  <label htmlFor="seat-count">How many seats do you need?</label>
  <select
    id="seat-count"
    value={desiredSeatCount}
    onChange={(e) => setDesiredSeatCount(parseInt(e.target.value))}
  >
    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
      <option key={num} value={num}>{num}</option>
    ))}
  </select>
</div>
```

### Step 4: Display Banner

```tsx
// Add after the seat map header
{showRecommendations && recommendations.length > 0 && (
  <RecommendedSeatsBanner
    recommendations={recommendations}
    desiredSeatCount={desiredSeatCount}
    onSelectRecommendation={(group) => {
      // Optional: Scroll to section containing recommended seats
      const sectionElement = document.querySelector(
        `[data-section="${group.section}"]`
      );
      sectionElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }}
    onDismiss={() => setShowRecommendations(false)}
  />
)}
```

### Step 5: Update Seat Rendering

```typescript
// Modify renderSeat function
const renderSeat = (seat: Seat, sectionName: string) => {
  const selected = isSeatSelected(seat.id);
  const recommended = isSeatRecommended(seat.id, recommendations);
  const disabled = seat.status !== 'AVAILABLE' || state !== 'IDLE';

  let className = 'seat';
  if (selected) className += ' seat-selected';
  if (recommended) className += ' seat-recommended'; // Add this line
  if (seat.status === 'RESERVED') className += ' seat-reserved';
  if (seat.status === 'BOOKED') className += ' seat-booked';
  if (seat.status === 'BLOCKED') className += ' seat-blocked';
  if (disabled && !selected) className += ' seat-disabled';

  // Update tooltip to show recommendation info
  let tooltipText = `${seat.seatNumber} - $${seat.price}`;
  if (recommended) {
    const rank = getSeatRecommendationRank(seat.id, recommendations);
    tooltipText += `\\n⭐ Recommended #${rank}`;
  }

  return (
    <button
      key={seat.id}
      className={className}
      onClick={() => handleSeatClick(seat, sectionName)}
      disabled={disabled}
      title={tooltipText}
    >
      {seat.seatNumber}
    </button>
  );
};
```

### Step 6: Update Legend

```tsx
// Add recommended seats to legend
<div className="seat-legend">
  <div className="legend-item">
    <span className="legend-icon seat-available"></span>
    Available
  </div>
  <div className="legend-item">
    <span className="legend-icon seat-recommended"></span>
    Recommended
  </div>
  <div className="legend-item">
    <span className="legend-icon seat-selected"></span>
    Selected
  </div>
  {/* ... other legend items ... */}
</div>
```

---

## Complete Integration Example

```tsx
import React, { useEffect, useState, useCallback } from 'react';
import { SeatsService } from '../../services/seats';
import { useSeatSelection, type SeatMapData, type Seat } from '../../hooks/useSeatSelection';
import { 
  getRecommendedSeats, 
  isSeatRecommended,
  getSeatRecommendationRank,
  type SeatGroup 
} from '../../utils/seatRecommendations';
import { RecommendedSeatsBanner } from '../RecommendedSeatsBanner';
import './EnhancedSeatMap.css';

export const EnhancedSeatMap: React.FC<EnhancedSeatMapProps> = ({
  eventId,
}) => {
  const [seatMap, setSeatMap] = useState<SeatMapData | null>(null);
  const [desiredSeatCount, setDesiredSeatCount] = useState(2);
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [recommendations, setRecommendations] = useState<SeatGroup[]>([]);

  const { toggleSeat, isSeatSelected } = useSeatSelection();

  // Load seat map
  const loadSeatMap = useCallback(async () => {
    const data = await SeatsService.getSeatMapForEvent(eventId);
    setSeatMap(data);
  }, [eventId]);

  useEffect(() => {
    loadSeatMap();
  }, [loadSeatMap]);

  // Calculate recommendations
  useEffect(() => {
    if (!seatMap || !showRecommendations) return;
    
    const recs = getRecommendedSeats(seatMap, {
      desiredSeatCount,
    }, 3);
    
    setRecommendations(recs);
  }, [seatMap, desiredSeatCount, showRecommendations]);

  const renderSeat = (seat: Seat, sectionName: string) => {
    const selected = isSeatSelected(seat.id);
    const recommended = isSeatRecommended(seat.id, recommendations);
    
    let className = 'seat';
    if (selected) className += ' seat-selected';
    if (recommended) className += ' seat-recommended';
    if (seat.status !== 'AVAILABLE') className += ' seat-disabled';

    return (
      <button
        key={seat.id}
        className={className}
        onClick={() => toggleSeat(seat, sectionName)}
        title={`${seat.seatNumber} - $${seat.price}${recommended ? ' ⭐ Recommended' : ''}`}
      >
        {seat.seatNumber}
      </button>
    );
  };

  return (
    <div className="enhanced-seat-map">
      {/* Seat Count Selector */}
      <div className="seat-count-selector">
        <label>How many seats? </label>
        <select 
          value={desiredSeatCount} 
          onChange={(e) => setDesiredSeatCount(Number(e.target.value))}
        >
          {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
            <option key={num} value={num}>{num}</option>
          ))}
        </select>
      </div>

      {/* Recommendations Banner */}
      {showRecommendations && recommendations.length > 0 && (
        <RecommendedSeatsBanner
          recommendations={recommendations}
          desiredSeatCount={desiredSeatCount}
          onDismiss={() => setShowRecommendations(false)}
        />
      )}

      {/* Legend */}
      <div className="seat-legend">
        <div className="legend-item">
          <span className="legend-icon seat-available"></span>
          Available
        </div>
        <div className="legend-item">
          <span className="legend-icon seat-recommended"></span>
          Recommended
        </div>
        <div className="legend-item">
          <span className="legend-icon seat-selected"></span>
          Selected
        </div>
      </div>

      {/* Seat Map */}
      {seatMap?.sections.map(section => (
        <div key={section.name} className="section" data-section={section.name}>
          <div className="section-header">
            <h3>{section.name}</h3>
          </div>
          <div className="seats-grid">
            {section.seats.map(seat => renderSeat(seat, section.name))}
          </div>
        </div>
      ))}
    </div>
  );
};
```

---

## Scoring Logic Details

### Contiguity Scoring (40%)

- **1.0:** All seats are contiguous (side-by-side in same row)
- **0.9:** 80%+ of seats are contiguous
- **0.6:** 50%+ of seats are contiguous
- **0.3:** Scattered seats

### Price Scoring (25%)

- **1.0:** Price is in "sweet spot" (20-50% of venue price range)
- **0.7-0.9:** Very cheap seats (may be far from stage)
- **0.5-1.0:** Expensive seats (diminishing returns)

### Proximity Scoring (20%)

Row-based scoring:
- **1.0:** Rows A-E or 1-5
- **0.9:** Rows F-J or 6-10
- **0.7:** Rows K-O or 11-15
- **0.5:** Rows P-T or 16-20
- **0.3:** Rows U+ or 21+

### Availability Scoring (15%)

- **1.0:** Seat is AVAILABLE
- **0.9:** Reserved but expiring soon (<10s)
- **0.5:** Reserved, expires 10-30s
- **0.1:** Reserved, expires >30s
- **0:** BOOKED or BLOCKED

---

## Performance Considerations

1. **Combination Limits:**
   - For ≤6 seats: Calculates all combinations (max 100)
   - For >6 seats: Uses heuristic approach (contiguous blocks only)

2. **Recalculation Triggers:**
   - Seat map updates
   - Desired seat count changes
   - User dismisses/re-enables recommendations

3. **Memoization:**
   - Use `useMemo` for expensive calculations
   - Cache recommendations until dependencies change

---

## User Experience Flow

1. User enters venue page
2. System calculates recommendations based on default count (2 seats)
3. Banner appears showing best available option
4. Recommended seats glow green with star badges
5. User can:
   - Change desired seat count → new recommendations
   - Expand banner to see all options
   - Click "View These Seats" to scroll to section
   - Dismiss banner if not interested
   - Select any seats (recommended or not)

---

## Customization Options

### Price Filters

```typescript
const recommendations = getRecommendedSeats(seatMap, {
  desiredSeatCount: 4,
  maxPricePer: 100,  // Don't recommend seats >$100
  minPricePer: 50,   // Don't recommend seats <$50
});
```

### Preferred Sections

```typescript
const recommendations = getRecommendedSeats(seatMap, {
  desiredSeatCount: 4,
  preferredSections: ['Orchestra', 'Front Mezzanine'], // +10% score boost
});
```

### Number of Recommendations

```typescript
// Get top 5 instead of default 3
const recommendations = getRecommendedSeats(seatMap, options, 5);
```

---

## Testing Scenarios

### Scenario 1: Perfect Contiguous Seats
- **Input:** 4 available seats in a row (A1, A2, A3, A4)
- **Expected:** Score ~0.95-1.0, marked as contiguous

### Scenario 2: Mixed Pricing
- **Input:** Seats ranging $50-$200
- **Expected:** Recommends mid-tier ($80-$120) over cheapest or most expensive

### Scenario 3: Expiring Reservations
- **Input:** Some seats reserved with <30s remaining
- **Expected:** Avoids nearly-expired seats, prefers fully available

### Scenario 4: Scattered Availability
- **Input:** No contiguous blocks for requested count
- **Expected:** Returns best partial groups, lower contiguity score

### Scenario 5: Large Groups
- **Input:** 10+ seats requested
- **Expected:** Uses heuristic approach, finds largest contiguous blocks

---

## Future Enhancements (Out of Scope)

1. **User Preferences Storage:** Remember preferred sections/price ranges
2. **A/B Testing:** Track recommendation acceptance rates
3. **Dynamic Weights:** Adjust scoring weights based on event type
4. **Social Proof:** "X other users viewed these seats"
5. **Price Alerts:** Notify when recommended seats' price drops
6. **Accessibility Options:** Prefer ADA-compliant seats when requested

---

## Summary

The Recommended Seats feature provides intelligent, non-intrusive seat suggestions using frontend-only logic. It balances multiple factors (contiguity, price, proximity, availability) to help users quickly find optimal seating arrangements without forcing selections.

**Key Benefits:**
- ✅ Improves user experience and booking speed
- ✅ No backend changes required
- ✅ Fully customizable and extensible
- ✅ Performance-optimized for large venues
- ✅ Mobile-responsive design
