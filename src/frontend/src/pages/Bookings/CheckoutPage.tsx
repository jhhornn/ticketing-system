import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CreditCard, CheckCircle, Loader2 } from 'lucide-react';
import { BookingsService } from '../../services/bookings';
import { useAuth } from '../../context/AuthContext';

interface LocationState {
    reservationId: number;
    eventId: number;
    eventName: string;
}

export const CheckoutPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const state = location.state as LocationState;

    const [confirming, setConfirming] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [bookingReference, setBookingReference] = useState<string | null>(null);

    useEffect(() => {
        // If no reservation data, redirect back to events
        if (!state?.reservationId) {
            navigate('/events');
            return;
        }

        // Auto-confirm with mock payment
        confirmBookingWithMockPayment();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount

    const confirmBookingWithMockPayment = async () => {
        if (!state?.reservationId || !user?.id) {
            setError('Missing reservation or user information');
            return;
        }

        try {
            setConfirming(true);

            // Generate idempotency key based on reservation
            const idempotencyKey = `booking-${state.reservationId}-${Date.now()}`;

            const booking = await BookingsService.confirmBooking({
                reservationId: String(state.reservationId),
                userId: user.id,
                paymentMethod: 'mock',
                idempotencyKey,
                metadata: {
                    eventName: state.eventName,
                    autoConfirmed: true
                }
            });

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

    if (!state?.reservationId) {
        return null; // Will redirect in useEffect
    }

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b">
                    <h1 className="text-3xl font-bold mb-2">Checkout</h1>
                    <p className="text-slate-600">
                        {state.eventName}
                    </p>
                </div>

                {/* Content */}
                <div className="p-8 text-center">
                    {confirming ? (
                        <>
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 mb-4">
                                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Confirming your booking...</h2>
                            <p className="text-slate-600">
                                Please wait while we process your reservation
                            </p>
                        </>
                    ) : error ? (
                        <>
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-4">
                                <CreditCard className="w-12 h-12 text-red-600" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2 text-red-600">Booking Failed</h2>
                            <p className="text-slate-600 mb-6">{error}</p>
                            <button
                                onClick={() => navigate('/events')}
                                className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors"
                            >
                                Back to Events
                            </button>
                        </>
                    ) : confirmed ? (
                        <>
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
                                <CheckCircle className="w-12 h-12 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
                            <p className="text-slate-600 mb-4">
                                Your booking has been successfully confirmed.
                            </p>
                            {bookingReference && (
                                <div className="bg-slate-50 p-4 rounded-lg mb-6">
                                    <p className="text-sm text-slate-500 mb-1">Booking Reference</p>
                                    <p className="text-2xl font-bold font-mono">{bookingReference}</p>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={() => navigate('/bookings')}
                                    className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
                                >
                                    View My Bookings
                                </button>
                                <button
                                    onClick={() => navigate('/events')}
                                    className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors"
                                >
                                    Browse More Events
                                </button>
                            </div>
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );
};
