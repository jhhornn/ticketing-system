# Frontend Optimization Guide

Comprehensive guide for optimizing React frontend performance.

## Table of Contents
- [Code Splitting & Lazy Loading](#code-splitting--lazy-loading)
- [Component Optimization](#component-optimization)
- [State Management](#state-management)
- [API Call Optimization](#api-call-optimization)
- [Bundle Size Optimization](#bundle-size-optimization)
- [Performance Monitoring](#performance-monitoring)
- [Best Practices](#best-practices)

---

## Code Splitting & Lazy Loading

### 1. Route-Based Code Splitting

**Implement lazy loading for pages:**

```typescript
// App.tsx - BEFORE
import EventsPage from './pages/Events/EventsPage';
import BookingsPage from './pages/Bookings/BookingsPage';
import CheckoutPage from './pages/Bookings/CheckoutPage';

// App.tsx - AFTER (Optimized)
import { lazy, Suspense } from 'react';

const EventsPage = lazy(() => import('./pages/Events/EventsPage'));
const BookingsPage = lazy(() => import('./pages/Bookings/BookingsPage'));
const CheckoutPage = lazy(() => import('./pages/Bookings/CheckoutPage'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/events" element={<EventsPage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
      </Routes>
    </Suspense>
  );
}
```

**Create a reusable loading component:**

```typescript
// components/LoadingSpinner.tsx
export const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
  </div>
);
```

### 2. Component-Level Code Splitting

**Lazy load heavy modals:**

```typescript
// EventDetailsPage.tsx - BEFORE
import EventSectionsModal from '@/components/EventSectionsModal';

// AFTER (Optimized)
const EventSectionsModal = lazy(() => import('@/components/EventSectionsModal'));

function EventDetailsPage() {
  const [showModal, setShowModal] = useState(false);
  
  return (
    <>
      <button onClick={() => setShowModal(true)}>Edit Sections</button>
      
      {showModal && (
        <Suspense fallback={<div>Loading...</div>}>
          <EventSectionsModal onClose={() => setShowModal(false)} />
        </Suspense>
      )}
    </>
  );
}
```

### 3. Dynamic Imports

**Load libraries only when needed:**

```typescript
// Import heavy date library only when needed
async function handleDateExport() {
  const { format } = await import('date-fns');
  const formatted = format(new Date(), 'yyyy-MM-dd');
  return formatted;
}

// Import chart library only on analytics page
const loadChartLibrary = async () => {
  const Chart = await import('chart.js/auto');
  return Chart.default;
};
```

---

## Component Optimization

### 1. Memoization with React.memo

**Prevent unnecessary re-renders:**

```typescript
// EventCard.tsx - BEFORE
export const EventCard = ({ event, onClick }: Props) => {
  return <div onClick={onClick}>...</div>;
};

// AFTER (Optimized)
export const EventCard = React.memo(({ event, onClick }: Props) => {
  return <div onClick={onClick}>...</div>;
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if event data changes
  return (
    prevProps.event.id === nextProps.event.id &&
    prevProps.event.eventName === nextProps.event.eventName &&
    prevProps.event.availableSeats === nextProps.event.availableSeats
  );
});
```

### 2. useMemo for Expensive Calculations

```typescript
// MyBookingsPage.tsx - BEFORE
function MyBookingsPage() {
  const totalSpent = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const upcomingEvents = bookings.filter(b => new Date(b.event.eventDate) > new Date());
  
  return <div>Total: ${totalSpent}</div>;
}

// AFTER (Optimized)
function MyBookingsPage() {
  const totalSpent = useMemo(
    () => bookings.reduce((sum, b) => sum + b.totalAmount, 0),
    [bookings]
  );
  
  const upcomingEvents = useMemo(
    () => bookings.filter(b => new Date(b.event.eventDate) > new Date()),
    [bookings]
  );
  
  return <div>Total: ${totalSpent}</div>;
}
```

### 3. useCallback for Event Handlers

```typescript
// EventDetailsPage.tsx - BEFORE
function EventDetailsPage() {
  const handleSeatSelect = (seatId: number) => {
    setSelectedSeats([...selectedSeats, seatId]);
  };
  
  return <SeatMap onSeatClick={handleSeatSelect} />;
}

// AFTER (Optimized)
function EventDetailsPage() {
  const handleSeatSelect = useCallback((seatId: number) => {
    setSelectedSeats(prev => [...prev, seatId]);
  }, []); // Stable reference
  
  return <SeatMap onSeatClick={handleSeatSelect} />;
}
```

### 4. Virtualization for Long Lists

**Use react-window for large lists:**

```typescript
import { FixedSizeList } from 'react-window';

function BookingsList({ bookings }: { bookings: Booking[] }) {
  const Row = ({ index, style }: any) => (
    <div style={style}>
      <BookingCard booking={bookings[index]} />
    </div>
  );
  
  return (
    <FixedSizeList
      height={600}
      itemCount={bookings.length}
      itemSize={150}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

---

## State Management

### 1. Optimize Context Usage

**Split large contexts into smaller ones:**

```typescript
// BEFORE - Single large context
const AppContext = createContext({
  user: null,
  events: [],
  bookings: [],
  settings: {},
  // Everything in one context = everything re-renders
});

// AFTER (Optimized) - Separate contexts
const UserContext = createContext(null);
const EventsContext = createContext([]);
const BookingsContext = createContext([]);

// Only components using UserContext re-render when user changes
```

### 2. Use Reducers for Complex State

```typescript
// CheckoutPage.tsx - BEFORE
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [reservation, setReservation] = useState(null);
const [timeRemaining, setTimeRemaining] = useState(600);

// AFTER (Optimized)
type State = {
  loading: boolean;
  error: string | null;
  reservation: Reservation | null;
  timeRemaining: number;
};

type Action =
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'SET_RESERVATION'; reservation: Reservation }
  | { type: 'TICK'; seconds: number };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    case 'SET_ERROR':
      return { ...state, error: action.error, loading: false };
    case 'SET_RESERVATION':
      return { ...state, reservation: action.reservation, loading: false };
    case 'TICK':
      return { ...state, timeRemaining: action.seconds };
    default:
      return state;
  }
};

function CheckoutPage() {
  const [state, dispatch] = useReducer(reducer, initialState);
}
```

### 3. Local State Over Global State

**Keep state as local as possible:**

```typescript
// BEFORE - Unnecessary global state
const GlobalContext = createContext({
  modalOpen: false,
  setModalOpen: () => {},
});

// AFTER (Optimized) - Local state
function EventDetailsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  // Modal state only needed in this component
}
```

---

## API Call Optimization

### 1. Implement Request Caching

```typescript
// services/cache.ts
class APICache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl = 5 * 60 * 1000; // 5 minutes
  
  get(key: string) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const isExpired = Date.now() - cached.timestamp > this.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }
  
  set(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
}

// EventsService.ts - AFTER (with caching)
const cache = new APICache();

export const EventsService = {
  getAll: async () => {
    const cacheKey = 'events:all';
    const cached = cache.get(cacheKey);
    if (cached) return cached;
    
    const response = await api.get<{ data: Event[] }>('/events');
    cache.set(cacheKey, response.data);
    return response.data;
  },
};
```

### 2. Debounce Search Requests

```typescript
// hooks/useDebounce.ts
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
}

// EventsPage.tsx - Usage
function EventsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  useEffect(() => {
    if (debouncedSearch) {
      searchEvents(debouncedSearch);
    }
  }, [debouncedSearch]);
}
```

### 3. Parallel API Calls

```typescript
// CheckoutPage.tsx - BEFORE (Sequential)
async function loadCheckoutData() {
  const reservation = await ReservationsService.get(id);
  const event = await EventsService.getById(reservation.eventId);
  const sections = await SectionsService.getByEvent(reservation.eventId);
}

// AFTER (Parallel - Optimized)
async function loadCheckoutData() {
  const [reservation, event, sections] = await Promise.all([
    ReservationsService.get(id),
    EventsService.getById(eventId),
    SectionsService.getByEvent(eventId),
  ]);
}
```

### 4. Abort Previous Requests

```typescript
// EventsPage.tsx - Cancel previous search requests
function EventsPage() {
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const searchEvents = async (term: string) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await api.get(`/events?search=${term}`, {
        signal: abortControllerRef.current.signal,
      });
      setEvents(response.data);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request cancelled');
      }
    }
  };
  
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      abortControllerRef.current?.abort();
    };
  }, []);
}
```

---

## Bundle Size Optimization

### 1. Analyze Bundle Size

```bash
# Build and analyze
pnpm build
npx vite-bundle-visualizer

# Or add to package.json
{
  "scripts": {
    "analyze": "vite-bundle-visualizer"
  }
}
```

### 2. Tree Shaking

**Import only what you need:**

```typescript
// BEFORE - Imports entire library
import _ from 'lodash';
const sorted = _.sortBy(array, 'name');

// AFTER (Optimized) - Import specific function
import sortBy from 'lodash/sortBy';
const sorted = sortBy(array, 'name');

// EVEN BETTER - Use native methods
const sorted = array.sort((a, b) => a.name.localeCompare(b.name));
```

### 3. Replace Heavy Libraries

```typescript
// BEFORE - moment.js (huge bundle size)
import moment from 'moment';
const formatted = moment(date).format('YYYY-MM-DD');

// AFTER (Optimized) - date-fns (tree-shakeable)
import { format } from 'date-fns';
const formatted = format(date, 'yyyy-MM-dd');

// EVEN BETTER - Native Intl API
const formatted = new Intl.DateTimeFormat('en-US').format(date);
```

### 4. Vite Configuration Optimization

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for React libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // UI components
          'ui-vendor': ['@headlessui/react', '@heroicons/react'],
          // Forms and validation
          'form-vendor': ['react-hook-form', 'zod'],
        },
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 500,
  },
  // Enable compression
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
      },
    },
  },
});
```

---

## Performance Monitoring

### 1. React DevTools Profiler

```typescript
// Wrap component to profile
import { Profiler } from 'react';

function onRenderCallback(
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number,
) {
  console.log(`${id} (${phase}) took ${actualDuration}ms`);
}

<Profiler id="EventsList" onRender={onRenderCallback}>
  <EventsList events={events} />
</Profiler>
```

### 2. Web Vitals Monitoring

```typescript
// src/main.tsx
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric: any) {
  console.log(metric);
  // Send to your analytics service
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### 3. Lighthouse Audits

```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run audit
lighthouse http://localhost:5173 --view

# Or use Chrome DevTools:
# 1. Open DevTools (F12)
# 2. Go to "Lighthouse" tab
# 3. Click "Generate report"
```

---

## Best Practices

### 1. Image Optimization

```typescript
// BEFORE - Unoptimized images
<img src="/poster.jpg" alt="Event poster" />

// AFTER (Optimized)
<img
  src="/poster-small.webp"
  srcSet="/poster-small.webp 400w, /poster-medium.webp 800w, /poster-large.webp 1200w"
  sizes="(max-width: 640px) 400px, (max-width: 1024px) 800px, 1200px"
  loading="lazy"
  alt="Event poster"
/>
```

### 2. CSS Optimization

**Use Tailwind CSS purge:**

```typescript
// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // PurgeCSS removes unused styles in production
};
```

### 3. Avoid Inline Functions

```typescript
// BEFORE - Creates new function on every render
<button onClick={() => handleClick(item.id)}>Click</button>

// AFTER (Optimized) - Stable reference
const handleClickItem = useCallback((id: number) => {
  handleClick(id);
}, [handleClick]);

<button onClick={() => handleClickItem(item.id)}>Click</button>

// EVEN BETTER - Use data attributes
<button onClick={handleClick} data-id={item.id}>Click</button>

function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
  const id = e.currentTarget.dataset.id;
  // Process id
}
```

### 4. Error Boundaries

```typescript
// components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    // Send to error tracking service (Sentry)
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    
    return this.props.children;
  }
}

// Usage
<ErrorBoundary>
  <EventDetailsPage />
</ErrorBoundary>
```

---

## Performance Checklist

### Code
- [ ] Lazy load all routes
- [ ] Memoize expensive calculations with useMemo
- [ ] Memoize callback functions with useCallback
- [ ] Wrap pure components with React.memo
- [ ] Virtualize long lists
- [ ] Avoid inline functions in JSX

### API
- [ ] Implement request caching
- [ ] Debounce search inputs
- [ ] Make parallel API calls
- [ ] Cancel previous requests when appropriate
- [ ] Handle loading and error states

### Bundle
- [ ] Analyze bundle size regularly
- [ ] Use tree-shakeable imports
- [ ] Replace heavy libraries with lighter alternatives
- [ ] Configure code splitting
- [ ] Remove unused dependencies

### Images
- [ ] Use WebP format
- [ ] Implement lazy loading
- [ ] Provide responsive images (srcset)
- [ ] Compress images before uploading

### Monitoring
- [ ] Profile components with React DevTools
- [ ] Track Web Vitals
- [ ] Run Lighthouse audits
- [ ] Monitor bundle size in CI/CD

---

## Before & After Metrics

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| Initial Bundle Size | 1.2 MB | 450 KB | < 500 KB |
| First Contentful Paint | 2.1s | 0.8s | < 1.0s |
| Largest Contentful Paint | 3.5s | 1.2s | < 2.5s |
| Time to Interactive | 4.2s | 1.5s | < 3.0s |
| Lighthouse Score | 65 | 92 | > 90 |

---

## Additional Resources

- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Web Vitals](https://web.dev/vitals/)
- [Vite Performance](https://vitejs.dev/guide/performance.html)
- [Bundle Size Analysis](https://bundlephobia.com/)
