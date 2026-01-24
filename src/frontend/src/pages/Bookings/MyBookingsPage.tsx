import React, { useEffect, useState } from 'react';
import { BookingsService, type Booking } from '../../services/bookings';
import { format } from 'date-fns';
import { Eye, Calendar, Ticket, CreditCard } from 'lucide-react';
import { BookingDetailsModal } from '../../components/BookingDetailsModal';
import { Button } from '../../components/ui/Button';

export const MyBookingsPage: React.FC = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

    useEffect(() => {
        console.log('MyBookingsPage: Loading bookings...');
        BookingsService.getMyBookings()
            .then((data) => {
                console.log('MyBookingsPage: Bookings loaded:', data);
                setBookings(data || []);
            })
            .catch((err) => {
                console.error('MyBookingsPage: Failed to load bookings:', err);
                setError(err.response?.data?.message || err.message || 'Failed to load bookings');
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CONFIRMED':
                return 'bg-green-100 text-green-700';
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-700';
            case 'CANCELLED':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-slate-100 text-slate-700';
        }
    };

    if (loading) return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-3">Loading your bookings...</span>
            </div>
        </div>
    );
    
    if (error) return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
            </div>
        </div>
    );

    return (
        <>
            <div className="max-w-6xl mx-auto p-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">My Bookings</h1>
                    <p className="text-slate-600 mt-2">View and manage your event bookings</p>
                </div>

                {bookings.length === 0 ? (
                    <div className="bg-white p-12 rounded-lg border border-slate-200 text-center">
                        <Ticket className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                        <h3 className="text-xl font-semibold mb-2">No bookings yet</h3>
                        <p className="text-slate-500 mb-6">Browse events to make your first booking!</p>
                        <Button onClick={() => window.location.href = '/events'}>
                            Browse Events
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {bookings.map((booking) => (
                            <div 
                                key={booking.bookingId} 
                                className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer group"
                                onClick={() => setSelectedBooking(booking)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <h3 className="font-bold text-xl">Booking #{booking.bookingReference}</h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                                                {booking.status}
                                            </span>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Calendar className="w-4 h-4" />
                                                <div>
                                                    <p className="text-xs text-slate-500">Booked on</p>
                                                    <p className="font-medium text-slate-700">
                                                        {format(new Date(booking.createdAt), 'MMM d, yyyy')}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Ticket className="w-4 h-4" />
                                                <div>
                                                    <p className="text-xs text-slate-500">Seats</p>
                                                    <p className="font-medium text-slate-700">
                                                        {booking.seatNumbers?.length || 0} seat(s)
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <CreditCard className="w-4 h-4" />
                                                <div>
                                                    <p className="text-xs text-slate-500">Total Amount</p>
                                                    <p className="font-bold text-primary">
                                                        ${booking.totalAmount.toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {booking.seatNumbers && booking.seatNumbers.length > 0 && (
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {booking.seatNumbers.slice(0, 5).map((seat, index) => (
                                                    <span 
                                                        key={index}
                                                        className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-mono"
                                                    >
                                                        {seat}
                                                    </span>
                                                ))}
                                                {booking.seatNumbers.length > 5 && (
                                                    <span className="px-2 py-1 text-slate-500 text-xs">
                                                        +{booking.seatNumbers.length - 5} more
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="ml-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedBooking(booking);
                                        }}
                                    >
                                        <Eye className="w-4 h-4" />
                                        View Details
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Booking Details Modal */}
            {selectedBooking && (
                <BookingDetailsModal
                    booking={selectedBooking}
                    onClose={() => setSelectedBooking(null)}
                />
            )}
        </>
    );
};
