# Error Translation Mapping

This document outlines how the application translates technical errors (HTTP Status Codes, Backend Error Reasons) into user-friendly messages and recovery actions.

## HTTP Status Mappings

| HTTP Status | Title | Message | Strategy |
|:--- |:--- |:--- |:--- |
| **0** (Network) | Connection Lost | Unable to reach the server. Please check your internet connection and try again. | `retry` |
| **400** Bad Request | Invalid Request | The information provided is not valid. Please review and try again. | `manual` |
| **401** Unauthorized | Session Expired | Your session has expired. Please sign in again to continue. | `restart` |
| **403** Forbidden | Access Denied | You don't have permission to perform this action. | `contact_support` |
| **404** Not Found | Not Found | The requested resource could not be found. It may have been removed or is no longer available. | `restart` |
| **409** Conflict | Conflict Detected | The information has changed. Please refresh and try again. | `retry_modified` |
| **422** Unprocessable | Cannot Process Request | The request cannot be processed due to validation errors. Please check your information. | `manual` |
| **429** Too Many Requests| Too Many Requests | You've made too many requests. Please wait a moment and try again. | `wait` |
| **500** Internal Server | Server Error | Something went wrong on our end. Our team has been notified. Please try again in a few moments. | `retry` |
| **502** Bad Gateway | Service Temporarily Unavailable | We're experiencing temporary connectivity issues. Please try again shortly. | `retry` |
| **503** Service Unavailable | Service Maintenance | We're currently performing maintenance. Service will resume shortly. | `wait` |
| **504** Gateway Timeout | Request Timeout | The request took too long to complete. Please try again. | `retry` |

## Backend Reason Mappings

### Reservation / Seats

| Code | Title | Message | Strategy |
|:--- |:--- |:--- |:--- |
| `seat_already_reserved` | Seat Already Reserved | This seat was just reserved by another customer. Please select a different seat. | `retry_modified` |
| `seat_already_booked` | Seat No Longer Available | This seat has been booked and is no longer available. Please choose another seat. | `retry_modified` |
| `seat_not_available` | Seat Unavailable | This seat is not available for booking. Please select a different seat. | `retry_modified` |
| `seat_locked` | Seat Temporarily Locked | This seat is being processed by another customer. It may become available in a moment. | `wait` |
| `stale_version` | Information Out of Date | Seat availability has changed. Refreshing the latest information... | `retry` |
| `reservation_expired` | Reservation Expired | Your 10-minute reservation window has expired. Please select your seats again. | `restart` |
| `reservation_not_found` | Reservation Not Found | We couldn't find your reservation. It may have expired. Please start over. | `restart` |

### Payment

| Code | Title | Message | Strategy |
|:--- |:--- |:--- |:--- |
| `payment_failed` | Payment Failed | We couldn't process your payment. Please check your payment details and try again. | `retry` |
| `payment_declined` | Payment Declined | Your payment was declined by your bank. Please use a different payment method or contact your bank. | `retry_modified` |
| `payment_timeout` | Payment Timeout | The payment request timed out. Your card has not been charged. Please try again. | `retry` |
| `insufficient_funds` | Insufficient Funds | Your payment method has insufficient funds. Please use a different payment method. | `retry_modified` |
| `invalid_card` | Invalid Card | The card information provided is invalid. Please check and try again. | `manual` |
| `payment_duplicate` | Duplicate Payment Detected | This payment has already been processed. Please check your booking confirmation. | `restart` |

### Events

| Code | Title | Message | Strategy |
|:--- |:--- |:--- |:--- |
| `event_not_found` | Event Not Found | This event could not be found. It may have been cancelled or removed. | `restart` |
| `event_sold_out` | Event Sold Out | All tickets for this event have been sold. Check back for returns or cancellations. | `restart` |
| `event_not_started` | Sales Not Started | Ticket sales for this event haven't started yet. Please check back later. | `wait` |
| `event_ended` | Event Ended | This event has already ended. Tickets are no longer available. | `restart` |

## Recovery Strategies

- **Retry**: Automatically retry the request (with exponential backoff where configured).
- **Retry Modified**: Prompt user to change their input (e.g., pick different seats) and try again.
- **Restart**: Critical failure requiring the user to start the flow from the beginning.
- **Manual**: Validation error requiring manual user correction.
- **Wait**: Temporary system or business logic state requiring a pause.
- **Contact Support**: Unrecoverable error needing human intervention.
