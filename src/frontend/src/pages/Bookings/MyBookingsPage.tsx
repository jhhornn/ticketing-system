import React, { useEffect, useState } from 'react';
import { BookingsService, type Booking } from '../../services/bookings';
import { format } from 'date-fns';

export const MyBookingsPage: React.FC = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        BookingsService.getMyBookings()
            .then((data) => {
                setBookings(data || []);
            })
            .catch((err) => {
                console.error('Failed to load bookings:', err);
                setError(err.response?.data?.message || err.message || 'Failed to load bookings');
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="max-w-6xl mx-auto p-6">Loading your bookings...</div>;
    
    if (error) return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
            </div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">My Bookings</h1>

            {bookings.length === 0 ? (
                <div className="bg-white p-8 rounded-lg border border-slate-200 text-center text-slate-500">
                    No bookings yet. Browse events to make your first booking!
                </div>
            ) : (
                <div className="grid gap-4">
                    {bookings.map((booking) => (
                        <div key={booking.bookingId} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg">Booking #{booking.bookingReference}</h3>
                                    <p className="text-sm text-slate-500">
                                        Event ID: {booking.eventId} | Seats: {booking.seatNumbers.join(', ')}
                                    </p>
                                </div>
                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                    {booking.status}
                                </span>
                            </div>
                            <div className="mt-4 text-sm text-slate-600">
                                <div>Booking Reference: <span className="font-mono font-bold">{booking.bookingReference}</span></div>
                                <div>Total Amount: ${booking.totalAmount}</div>
                                <div>Payment Status: {booking.paymentStatus}</div>
                                <div>Booked on: {format(new Date(booking.createdAt), 'MMM d, yyyy')}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
