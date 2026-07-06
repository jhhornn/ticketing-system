import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CreditCard, CheckCircle, Loader2, ArrowLeft, Calendar, MapPin, Clock, Ticket } from 'lucide-react';
import { BookingsService, PaymentMethod as PaymentMethodEnum } from '../../services/bookings';
import { EventsService } from '../../services/events';
import { ReservationsService } from '../../services/reservations';
import { useAuth } from '../../hooks/useAuth';
import { PaymentProtectionBadge, SlowNetworkIndicator, IdempotencyReplayNotification } from '../../components/PaymentProtection';
import { usePaymentProtection } from '../../hooks/usePaymentProtection';
import { PaymentProtectionCopy } from '../../utils/uiCopy';
import { usePaymentErrorHandler } from '../../hooks/useErrorHandler';
import { ErrorDisplay } from '../../components/ErrorDisplay';
import { ErrorModal } from '../../components/ErrorModal';

interface LocationState {
    reservationId: number;
    eventId: number;
    eventName: string;
    discountCode?: string;
    seatNumbers?: string[];
    sectionName?: string;
    quantity?: number;
    pricePerSeat?: number;
    totalPrice?: number;
}

interface EventDetails {
    id: number;
    eventName: string;
    eventDate: string;
    venue?: {
        name: string;
        address: string;
        city: string;
    };
}

export const CheckoutPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const state = location.state as LocationState;

    const [loading, setLoading] = useState(true);
    const [confirming, setConfirming] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [bookingReference, setBookingReference] = useState<string | null>(null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodEnum>(
        PaymentMethodEnum.PAYSTACK
    );

    const [event, setEvent] = useState<EventDetails | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<number>(0);

    const {
        isSlowNetwork,
        isReplay,
        replayBookingReference,
        startPaymentTracking,
        endPaymentTracking,
        trackEvent,
    } = usePaymentProtection();

    useEffect(() => {
        if (!state?.reservationId) {
            navigate('/events');
            return;
        }

        loadCheckoutDetails();
    }, [state?.reservationId]);

    useEffect(() => {
        if (timeRemaining === 0) return;

        const timer = setInterval(() => {
            setTimeRemaining(prev => {
                const newTime = Math.max(0, prev - 1);

                if (newTime === 0) {
                    setError('Your reservation has expired. Redirecting you back to the event...');
                    setTimeout(() => {
                        navigate(`/events/${state.eventId}`, {
                            state: { message: 'Your reservation expired. Please select your seats again.' }
                        });
                    }, 3000);
                }

                return newTime;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeRemaining, state.eventId, navigate]);

    const loadCheckoutDetails = async () => {
        try {
            setLoading(true);

            const allEvents = await EventsService.getAll();
            const eventData = allEvents.find(e => e.id === state.eventId);

            if (eventData) {
                setEvent(eventData);
            }

            if (user?.id) {
                try {
                    const reservations = await ReservationsService.getUserReservations(user.id, state.eventId);
                    const currentReservation = reservations.find(r => r.id === state.reservationId);

                    if (currentReservation) {
                        const now = new Date().getTime();
                        const expires = new Date(currentReservation.expiresAt).getTime();
                        const remaining = Math.max(0, Math.floor((expires - now) / 1000));

                        if (remaining === 0) {
                            setError('Your reservation has expired. Redirecting you back to the event...');
                            setTimeout(() => navigate(`/events/${state.eventId}`), 3000);
                        } else {
                            setTimeRemaining(remaining);
                        }
                    } else {
                        setError('Reservation not found. It may have expired or been cancelled.');
                        setTimeout(() => navigate(`/events/${state.eventId}`), 3000);
                    }
                } catch (err) {
                    console.error('Failed to fetch reservation:', err);
                    setTimeRemaining(600);
                }
            }

        } catch (err) {
            console.error('Failed to load checkout details:', err);
            const error = err as { response?: { data?: { message?: string } }; message?: string };
            setError(error.response?.data?.message || error.message || 'Failed to load checkout details');
        } finally {
            setLoading(false);
        }
    };

    const { error: paymentError, handleError: handlePaymentError, clearError: clearPaymentError } = usePaymentErrorHandler(() => {
        navigate(`/events/${state.eventId}`);
    });

    const confirmBooking = async () => {
        if (!state?.reservationId || !user?.id) {
            setError('Missing reservation or user information');
            return;
        }

        clearPaymentError();
        setError(null);

        try {
            setConfirming(true);
            startPaymentTracking();

            const idempotencyKey = `booking-${state.reservationId}-${Date.now()}`;

            const response = await BookingsService.confirmBooking({
                reservationId: String(state.reservationId),
                userId: user.id,
                paymentMethod: selectedPaymentMethod,
                idempotencyKey,
                discountCode: state.discountCode,
                metadata: {
                    eventName: state.eventName,
                    source: 'checkout_page',
                    email: user.email,
                }
            });

            if (
                selectedPaymentMethod === PaymentMethodEnum.PAYSTACK &&
                response.paymentStatus === 'PENDING'
            ) {
                const authorizationUrl =
                    typeof response.paymentMetadata?.authorizationUrl === 'string'
                        ? response.paymentMetadata.authorizationUrl
                        : undefined;

                if (!authorizationUrl) {
                    throw new Error('Paystack checkout URL was not returned by the server');
                }

                window.location.assign(authorizationUrl);
                return;
            }

            const wasReplay = false;

            endPaymentTracking(wasReplay, response.bookingReference);

            trackEvent(PaymentProtectionCopy.analyticsEvents.retryAttempted, {
                success: true,
                wasReplay,
                bookingReference: response.bookingReference,
            });

            setBookingReference(response.bookingReference);
            setConfirmed(true);
        } catch (err: unknown) {
            console.error('Failed to confirm booking:', err);

            handlePaymentError(err, {
                context: {
                    affectedResource: `Reservation #${state.reservationId}`
                }
            });

            const error = err as { response?: { data?: { message?: string } }; message?: string };
            setError(error.response?.data?.message || error.message || 'Failed to confirm booking');

            endPaymentTracking(false);

            trackEvent(PaymentProtectionCopy.analyticsEvents.retryAttempted, {
                success: false,
                error: error.response?.data?.message || error.message,
            });
        } finally {
            setConfirming(false);
        }
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!state?.reservationId) {
        return null;
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-3 text-lg text-muted-foreground">Loading checkout details...</span>
            </div>
        );
    }

    if (confirmed) {
        return (
            <div className="max-w-2xl mx-auto animate-fade-in">
                <div className="bg-card rounded-xl shadow-soft border overflow-hidden">
                    <div className="bg-primary/10 p-6 border-b border-primary/20">
                        <h1 className="text-3xl font-bold text-success">Booking Confirmed!</h1>
                    </div>

                    <div className="p-8 text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/10 text-success mb-4">
                            <CheckCircle className="w-12 h-12" />
                        </div>
                        <h2 className="text-2xl font-bold font-poppins mb-2">Payment Successful</h2>
                        <p className="text-muted-foreground mb-4">
                            Your booking has been successfully confirmed.
                        </p>
                        {bookingReference && (
                            <div className="bg-muted p-4 rounded-lg mb-6">
                                <p className="text-sm text-muted-foreground mb-1">Booking Reference</p>
                                <p className="text-2xl font-bold font-mono text-primary">{bookingReference}</p>
                            </div>
                        )}

                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={() => navigate('/bookings')}
                                className="px-6 py-3 border rounded-lg font-semibold hover:bg-secondary transition-colors"
                            >
                                View My Bookings
                            </button>
                            <button
                                onClick={() => navigate('/events')}
                                className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                            >
                                Browse More Events
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="bg-card rounded-xl shadow-soft border overflow-hidden">
                <div className="p-6 border-b flex items-center justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold font-poppins">Review Your Booking</h1>
                            <PaymentProtectionBadge
                                onBadgeClick={() => trackEvent(PaymentProtectionCopy.analyticsEvents.badgeClicked)}
                            />
                        </div>
                        <p className="text-muted-foreground">
                            Please review your booking details before confirming.
                        </p>
                    </div>
                    {timeRemaining > 0 && (
                        <div className={`bg-muted px-4 py-2 rounded-lg border ${timeRemaining <= 60 ? 'border-destructive animate-pulse' :
                                timeRemaining <= 180 ? 'border-warning' :
                                    'border-border'
                            }`}>
                            <div className="flex items-center gap-2">
                                <Clock className={`w-5 h-5 ${timeRemaining <= 60 ? 'text-destructive' :
                                        timeRemaining <= 180 ? 'text-warning' :
                                            'text-primary'
                                    }`} />
                                <div>
                                    <p className="text-xs text-muted-foreground">Time Remaining</p>
                                    <p className={`text-xl font-bold ${timeRemaining <= 60 ? 'text-destructive' :
                                            timeRemaining <= 180 ? 'text-warning' :
                                                'text-foreground'
                                        }`}>{formatTime(timeRemaining)}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6">
                    {paymentError && (
                        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                            <div className="bg-card rounded-xl border shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
                                <ErrorDisplay
                                    error={paymentError}
                                    onPrimaryAction={() => {
                                        if (paymentError.primaryAction.action === 'retry') {
                                            confirmBooking();
                                        } else if (paymentError.primaryAction.action === 'retry_modified') {
                                            clearPaymentError();
                                        } else if (paymentError.primaryAction.action === 'restart') {
                                            navigate(`/events/${state.eventId}`);
                                        } else if (paymentError.primaryAction.action === 'contact_support') {
                                            window.location.href = 'mailto:support@ticketing.com';
                                        }
                                    }}
                                    onSecondaryAction={
                                        paymentError.secondaryAction ? () => {
                                            if (paymentError.secondaryAction?.action === 'restart') {
                                                navigate(`/events/${state.eventId}`);
                                            } else if (paymentError.secondaryAction?.action === 'contact_support') {
                                                window.location.href = 'mailto:support@ticketing.com';
                                            }
                                        } : undefined
                                    }
                                    onDismiss={clearPaymentError}
                                />
                            </div>
                        </div>
                    )}
                    {isReplay && (
                        <div className="mb-4">
                            <IdempotencyReplayNotification
                                isReplay={isReplay}
                                bookingReference={replayBookingReference}
                                onDisplay={() => trackEvent(PaymentProtectionCopy.analyticsEvents.replayEventSurfaced)}
                            />
                        </div>
                    )}

                    {confirming && isSlowNetwork && (
                        <div className="mb-4">
                            <SlowNetworkIndicator
                                isSlowNetwork={isSlowNetwork}
                                onDisplay={() => trackEvent(PaymentProtectionCopy.analyticsEvents.slowNetworkDetected)}
                            />
                        </div>
                    )}

                    {error && (
                        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-6">
                            <p className="font-semibold">Booking Error</p>
                            <p className="text-sm">{error}</p>
                            {!confirming && (
                                <p className="text-xs mt-2">
                                    {PaymentProtectionCopy.retry.safeRetryNote}
                                </p>
                            )}
                        </div>
                    )}

                    {event && (
                        <div className="mb-6">
                            <h2 className="text-xl font-bold mb-4 font-poppins">Event Details</h2>
                            <div className="bg-muted/30 rounded-lg p-4 space-y-3 border">
                                <div className="flex items-start gap-3">
                                    <Ticket className="w-5 h-5 text-primary mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-foreground">{event.eventName}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Calendar className="w-5 h-5 text-primary mt-0.5" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(event.eventDate).toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>
                                {event.venue && (
                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-5 h-5 text-primary mt-0.5" />
                                        <div>
                                            <p className="font-medium text-foreground">{event.venue.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {event.venue.address}, {event.venue.city}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="mb-6">
                        <h2 className="text-xl font-bold mb-4 font-poppins">Booking Summary</h2>
                        <div className="bg-muted/30 rounded-lg p-4 space-y-3 border">
                            {state.sectionName && (
                                <div className="flex justify-between items-center pb-3 border-b border-border">
                                    <span className="text-muted-foreground">Section</span>
                                    <span className="font-semibold text-foreground">{state.sectionName}</span>
                                </div>
                            )}

                            {state.seatNumbers && state.seatNumbers.length > 0 && (
                                <div className="pb-3 border-b border-border">
                                    <p className="text-muted-foreground mb-2">Your Seats</p>
                                    <div className="flex flex-wrap gap-2">
                                        {state.seatNumbers.map((seat, index) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1 bg-card border rounded text-sm font-mono font-semibold"
                                            >
                                                {seat}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {state.quantity && (
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Number of Tickets</span>
                                    <span className="font-semibold text-foreground">{state.quantity}</span>
                                </div>
                            )}

                            {state.pricePerSeat !== undefined && (
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Price per Ticket</span>
                                    <span className="font-semibold text-foreground">${state.pricePerSeat.toFixed(2)}</span>
                                </div>
                            )}

                            {state.discountCode && (
                                <div className="flex justify-between items-center text-success">
                                    <span>Discount Applied ({state.discountCode})</span>
                                    <span className="font-semibold">✓</span>
                                </div>
                            )}

                            {state.totalPrice !== undefined && (
                                <div className="flex justify-between items-center pt-3 border-t border-border">
                                    <span className="text-lg font-semibold text-foreground">Total Amount</span>
                                    <span className="text-2xl font-bold text-primary">${state.totalPrice.toFixed(2)}</span>
                                </div>
                            )}

                            <div className="text-xs text-muted-foreground pt-2">
                                Reservation ID: {state.reservationId}
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h2 className="text-xl font-bold mb-4 font-poppins">Payment Method</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setSelectedPaymentMethod(PaymentMethodEnum.PAYSTACK)}
                                className={`text-left rounded-lg p-4 border transition-colors ${
                                    selectedPaymentMethod === PaymentMethodEnum.PAYSTACK
                                        ? 'border-primary bg-primary/10'
                                        : 'border-border bg-muted/30 hover:bg-muted/50'
                                }`}
                            >
                                <p className="font-semibold text-foreground">Paystack</p>
                                <p className="text-sm text-muted-foreground">
                                    Secure hosted checkout (card, bank transfer, and local methods).
                                </p>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSelectedPaymentMethod(PaymentMethodEnum.MOCK)}
                                className={`text-left rounded-lg p-4 border transition-colors ${
                                    selectedPaymentMethod === PaymentMethodEnum.MOCK
                                        ? 'border-primary bg-primary/10'
                                        : 'border-border bg-muted/30 hover:bg-muted/50'
                                }`}
                            >
                                <p className="font-semibold text-foreground">Mock (Test Mode)</p>
                                <p className="text-sm text-muted-foreground">No real charge. Useful for local testing.</p>
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-border">
                        <button
                            onClick={() => navigate(-1)}
                            disabled={confirming}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 border rounded-lg font-semibold hover:bg-secondary transition-colors disabled:opacity-50"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Event
                        </button>
                        <button
                            onClick={confirmBooking}
                            disabled={confirming || timeRemaining === 0}
                            className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold shadow-soft hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {confirming ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    {selectedPaymentMethod === PaymentMethodEnum.PAYSTACK
                                        ? 'Connecting to Paystack...'
                                        : 'Processing Payment...'}
                                </>
                            ) : (
                                <>
                                    <CreditCard className="w-5 h-5" />
                                    {selectedPaymentMethod === PaymentMethodEnum.PAYSTACK
                                        ? 'Continue to Paystack'
                                        : 'Confirm & Pay'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {paymentError && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-card rounded-xl border shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
                        <ErrorDisplay
                            error={paymentError}
                            onPrimaryAction={() => {
                                if (paymentError.primaryAction.action === 'retry') {
                                    confirmBooking();
                                } else if (paymentError.primaryAction.action === 'retry_modified') {
                                    clearPaymentError();
                                } else if (paymentError.primaryAction.action === 'restart') {
                                    navigate(`/events/${state.eventId}`);
                                } else if (paymentError.primaryAction.action === 'contact_support') {
                                    window.location.href = 'mailto:support@ticketing.com';
                                }
                            }}
                            onSecondaryAction={
                                paymentError.secondaryAction ? () => {
                                    if (paymentError.secondaryAction?.action === 'restart') {
                                        navigate(`/events/${state.eventId}`);
                                    } else if (paymentError.secondaryAction?.action === 'contact_support') {
                                        window.location.href = 'mailto:support@ticketing.com';
                                    }
                                } : undefined
                            }
                            onDismiss={clearPaymentError}
                        />
                    </div>
                </div>
            )}

            <ErrorModal
                isOpen={!!error && !paymentError}
                onClose={() => setError(null)}
                message={error || ''}
                title="Booking Failed"
            />
        </div>
    );
};