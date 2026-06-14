import { useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface UseToastReturn {
  toasts: Toast[];
  showToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

/**
 * useToast Hook
 * 
 * Manages toast notifications for user feedback.
 * Auto-dismisses after specified duration.
 * 
 * **UX Edge Cases Covered:**
 * 
 * 1. **Reservation Expired:**
 *    ```ts
 *    showToast('error', '⏱️ Your reservation expired. Please select seats again.');
 *    ```
 * 
 * 2. **Seat Conflict (Optimistic Lock Failure):**
 *    ```ts
 *    if (failedSeats.some(s => s.reason.includes('stale version'))) {
 *      showToast('warning', 
 *        '🔄 Some seats were just reserved by another user. Refreshing seat map...'
 *      );
 *    }
 *    ```
 * 
 * 3. **Payment Failed:**
 *    ```ts
 *    showToast('error', 
 *      '💳 Payment declined. Please check your payment details and try again.',
 *      0 // Don't auto-dismiss
 *    );
 *    ```
 * 
 * 4. **Network Error:**
 *    ```ts
 *    showToast('error', 
 *      '📡 Connection lost. Retrying in 3 seconds...',
 *      3000
 *    );
 *    ```
 * 
 * 5. **Partial Reservation Success:**
 *    ```ts
 *    showToast('warning', 
 *      `⚠️ Reserved ${reservedCount} seats. ${failedCount} seats unavailable.`
 *    );
 *    ```
 * 
 * 6. **Session About to Expire:**
 *    ```ts
 *    if (timeRemaining === 60) {
 *      showToast('warning', 
 *        '⏰ 1 minute remaining! Complete checkout to secure your seats.',
 *        0
 *      );
 *    }
 *    ```
 * 
 * 7. **Duplicate Booking Prevented (Idempotency):**
 *    ```ts
 *    if (response.status === 200 && response.headers['idempotency-replay']) {
 *      showToast('success', 
 *        '✅ Booking already confirmed (duplicate request prevented).'
 *      );
 *    }
 *    ```
 */
export const useToast = (): UseToastReturn => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (type: ToastType, message: string, duration: number = 5000) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      const newToast: Toast = { id, type, message, duration };

      setToasts((prev) => [...prev, newToast]);

      // Auto-dismiss if duration > 0
      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    showToast,
    removeToast,
    clearAll,
  };
};

/**
 * Example Toast Component (UI implementation):
 * 
 * ```tsx
 * export const ToastContainer = () => {
 *   const { toasts, removeToast } = useToast();
 * 
 *   return (
 *     <div className="toast-container">
 *       {toasts.map((toast) => (
 *         <div 
 *           key={toast.id} 
 *           className={`toast toast-${toast.type}`}
 *         >
 *           <span>{toast.message}</span>
 *           <button onClick={() => removeToast(toast.id)}>✕</button>
 *         </div>
 *       ))}
 *     </div>
 *   );
 * };
 * ```
 * 
 * **CSS Classes:**
 * - `.toast-success` → Green background, white text
 * - `.toast-error` → Red background, white text
 * - `.toast-warning` → Orange background, dark text
 * - `.toast-info` → Blue background, white text
 * 
 * **Animation:**
 * - Slide in from top-right
 * - Fade out on dismiss
 * - Stack vertically with 8px gap
 */
