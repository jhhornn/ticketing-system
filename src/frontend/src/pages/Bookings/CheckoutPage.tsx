import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CreditCard, CheckCircle, Loader2, ArrowLeft, Calendar, MapPin, Clock, Ticket } from 'lucide-react';
import { BookingsService } from '../../services/bookings';
import { EventsService } from '../../services/events';
import { ReservationsService } from '../../services/reservations';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';

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
    
    const [event, setEvent] = useState<EventDetails | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<number>(0);

    useEffect(() => {
        // If no reservation data, redirect back to events
        if (!state?.reservationId) {
            navigate('/events');
            return;
        }

        loadCheckoutDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Countdown timer
    useEffect(() => {
        if (timeRemaining === 0) return;

        const timer = setInterval(() => {
            setTimeRemaining(prev => {
                const newTime = Math.max(0, prev - 1);
                
                if (newTime === 0) {
                    setError('Your reservation has expired. Redirecting you back to the event...');
                    clearInterval(timer);
                    // Redirect after 3 seconds
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
            
            // Fetch event details
            const allEvents = await EventsService.getAll();
            const eventData = allEvents.find(e => e.id === state.eventId);
            
            if (eventData) {
                setEvent(eventData);
            }

            // Fetch real reservation to get actual expiry time
            if (user?.id) {
                try {
                    const reservations = await ReservationsService.getUserReservations(user.id, state.eventId);
                    const currentReservation = reservations.find(r => r.id === state.reservationId);
                    
                    if (currentReservation) {
                        // Calculate initial time remaining
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
                    // Fallback to default timeout if we can't fetch reservation
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

    const confirmBookingWithMockPayment = async () => {
        if (!state?.reservationId || !user?.id) {
            setError('Missing reservation or user information');
            return;
        }

        try {
            setConfirming(true);
            console.log('Starting booking confirmation...', { reservationId: state.reservationId, userId: user.id });

            // Generate idempotency key based on reservation
            const idempotencyKey = `booking-${state.reservationId}-${Date.now()}`;

            const booking = await BookingsService.confirmBooking({
                reservationId: String(state.reservationId),
                userId: user.id,
                paymentMethod: 'mock',
                idempotencyKey,
                discountCode: state.discountCode,
                metadata: {
                    eventName: state.eventName,
                    source: 'checkout_page'
                }
            });

            console.log('Booking confirmed successfully:', booking);
            setBookingReference(booking.bookingReference);
            setConfirmed(true);
        } catch (err) {
            console.error('Failed to confirm booking:', err);
            const error = err as { response?: { data?: { message?: string } }; message?: string };
            setError(error.response?.data?.message || error.message || 'Failed to confirm booking');
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
        return null; // Will redirect in useEffect
    }

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="ml-3 text-lg">Loading checkout details...</span>
                </div>
            </div>
        );
    }

    // Success screen
    if (confirmed) {
        return (
            <div className="max-w-2xl mx-auto p-6">
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-6 border-b">
                        <h1 className="text-3xl font-bold text-green-700">Booking Confirmed!</h1>
                    </div>

                    <div className="p-8 text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
                            <CheckCircle className="w-12 h-12 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Payment Successful</h2>
                        <p className="text-slate-600 mb-4">
                            Your booking has been successfully confirmed.
                        </p>
                        {bookingReference && (
                            <div className="bg-slate-50 p-4 rounded-lg mb-6">
                                <p className="text-sm text-slate-500 mb-1">Booking Reference</p>
                                <p className="text-2xl font-bold font-mono text-primary">{bookingReference}</p>
                            </div>
                        )}

                        <div className="flex gap-4 justify-center">
                            <Button onClick={() => navigate('/bookings')} variant="outline">
                                View My Bookings
                            </Button>
                            <Button onClick={() => navigate('/events')}>
                                Browse More Events
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Review and confirm screen
    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">Review Your Booking</h1>
                            <p className="text-slate-600">
                                Please review your booking details before confirming
                            </p>
                        </div>
                        {timeRemaining > 0 && (
                            <div className={`bg-white px-4 py-2 rounded-lg border-2 ${
                                timeRemaining <= 60 ? 'border-red-300 animate-pulse' : 
                                timeRemaining <= 180 ? 'border-orange-300' : 
                                'border-orange-200'
                            }`}>
                                <div className="flex items-center gap-2">
                                    <Clock className={`w-5 h-5 ${
                                        timeRemaining <= 60 ? 'text-red-600' : 
                                        timeRemaining <= 180 ? 'text-orange-600' : 
                                        'text-orange-600'
                                    }`} />
                                    <div>
                                        <p className="text-xs text-slate-500">Time Remaining</p>
                                        <p className={`text-xl font-bold ${
                                            timeRemaining <= 60 ? 'text-red-600' : 
                                            timeRemaining <= 180 ? 'text-orange-600' : 
                                            'text-orange-600'
                                        }`}>{formatTime(timeRemaining)}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                            <p className="font-semibold">Booking Error</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {/* Event Details */}
                    {event && (
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold mb-4">Event Details</h2>
                            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                                <div className="flex items-start gap-3">
                                    <Ticket className="w-5 h-5 text-slate-600 mt-0.5" />
                                    <div>
                                        <p className="font-semibold">{event.eventName}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Calendar className="w-5 h-5 text-slate-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-slate-600">
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
                                        <MapPin className="w-5 h-5 text-slate-600 mt-0.5" />
                                        <div>
                                            <p className="font-medium">{event.venue.name}</p>
                                            <p className="text-sm text-slate-600">
                                                {event.venue.address}, {event.venue.city}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Booking Summary */}
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold mb-4">Booking Summary</h2>
                        <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                            {/* Section */}
                            {state.sectionName && (
                                <div className="flex justify-between items-center pb-3 border-b">
                                    <span className="text-slate-600">Section</span>
                                    <span className="font-semibold">{state.sectionName}</span>
                                </div>
                            )}

                            {/* Seats */}
                            {state.seatNumbers && state.seatNumbers.length > 0 && (
                                <div className="pb-3 border-b">
                                    <p className="text-slate-600 mb-2">Your Seats</p>
                                    <div className="flex flex-wrap gap-2">
                                        {state.seatNumbers.map((seat, index) => (
                                            <span 
                                                key={index}
                                                className="px-3 py-1 bg-white border border-slate-300 rounded text-sm font-mono font-semibold"
                                            >
                                                {seat}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Quantity */}
                            {state.quantity && (
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-600">Number of Tickets</span>
                                    <span className="font-semibold">{state.quantity}</span>
                                </div>
                            )}

                            {/* Price per seat */}
                            {state.pricePerSeat !== undefined && (
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-600">Price per Ticket</span>
                                    <span className="font-semibold">${state.pricePerSeat.toFixed(2)}</span>
                                </div>
                            )}

                            {/* Discount */}
                            {state.discountCode && (
                                <div className="flex justify-between items-center text-green-600">
                                    <span>Discount Applied ({state.discountCode})</span>
                                    <span className="font-semibold">✓</span>
                                </div>
                            )}

                            {/* Total */}
                            {state.totalPrice !== undefined && (
                                <div className="flex justify-between items-center pt-3 border-t">
                                    <span className="text-lg font-semibold">Total Amount</span>
                                    <span className="text-2xl font-bold text-primary">${state.totalPrice.toFixed(2)}</span>
                                </div>
                            )}

                            <div className="text-xs text-slate-500 pt-2">
                                Reservation ID: {state.reservationId}
                            </div>
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
                        <div className="bg-slate-50 rounded-lg p-4 flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                <CreditCard className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <p className="font-semibold">Mock Payment (Test Mode)</p>
                                <p className="text-sm text-slate-600">No actual payment will be charged</p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-4 border-t">
                        <Button
                            onClick={() => navigate(-1)}
                            variant="outline"
                            disabled={confirming}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Event
                        </Button>
                        <Button
                            onClick={confirmBookingWithMockPayment}
                            disabled={confirming || timeRemaining === 0}
                            className="flex-1 flex items-center justify-center gap-2"
                        >
                            {confirming ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Processing Payment...
                                </>
                            ) : (
                                <>
                                    <CreditCard className="w-5 h-5" />
                                    Confirm & Pay
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
