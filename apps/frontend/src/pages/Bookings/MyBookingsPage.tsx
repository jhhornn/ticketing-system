import React, { useEffect, useState } from 'react';
import { BookingsService, type Booking } from '../../services/bookings';
import { format } from 'date-fns';
import { Eye, Calendar, Ticket, CreditCard } from 'lucide-react';
import { BookingDetailsModal } from '../../components/BookingDetailsModal';

export const MyBookingsPage: React.FC = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

    useEffect(() => {
        BookingsService.getMyBookings()
            .then((data) => {
                setBookings(data || []);
            })
            .catch((err) => {
                setError(err.response?.data?.message || err.message || 'Failed to load bookings');
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const getStatusClasses = (status: string) => {
        switch (status) {
            case 'CONFIRMED': return 'bg-success/20 text-success';
            case 'PENDING': return 'bg-warning/20 text-warning';
            case 'CANCELLED': return 'bg-destructive/20 text-destructive';
            default: return 'bg-muted/20 text-muted-foreground';
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">Loading your bookings...</span>
        </div>
    );
    
    if (error) return (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
            {error}
        </div>
    );

    return (
        <div className="animate-fade-in">
            <div className="mb-8">
                <h1 className="text-4xl font-bold font-poppins mb-2">My Bookings</h1>
                <p className="text-muted-foreground text-lg">View and manage your event bookings</p>
            </div>

            {bookings.length === 0 ? (
                <div className="bg-card p-12 rounded-xl border shadow-soft text-center">
                    <Ticket className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-bold font-poppins mb-2">No Bookings Yet</h3>
                    <p className="text-muted-foreground mb-6">It looks like you haven't booked any events yet. Browse our events and secure your tickets!</p>
                    <button
                        onClick={() => window.location.href = '/events'}
                        className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                    >
                        Browse Events
                    </button>
                </div>
            ) : (
                <div className="grid gap-4 max-w-4xl mx-auto">
                    {bookings.map((booking) => (
                        <div
                            key={booking.bookingId}
                            className="bg-card p-6 rounded-xl shadow-sm border hover:shadow-medium transition-all duration-300 cursor-pointer group"
                            onClick={() => setSelectedBooking(booking)}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <h3 className="font-bold text-xl font-poppins">Booking #{booking.bookingReference}</h3>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusClasses(booking.status)}`}>
                                            {booking.status}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-primary" />
                                            <div>
                                                <p className="text-xs">Booked on</p>
                                                <p className="font-medium text-foreground">
                                                    {format(new Date(booking.createdAt), 'MMM d, yyyy')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Ticket className="w-4 h-4 text-primary" />
                                            <div>
                                                <p className="text-xs">Seats</p>
                                                <p className="font-medium text-foreground">
                                                    {booking.seatNumbers?.length || 0} seat(s)
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="w-4 h-4 text-primary" />
                                            <div>
                                                <p className="text-xs">Total Amount</p>
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
                                                    className="px-2 py-1 bg-muted rounded text-xs font-mono"
                                                >
                                                    {seat}
                                                </span>
                                            ))}
                                            {booking.seatNumbers.length > 5 && (
                                                <span className="px-2 py-1 text-muted-foreground text-xs">
                                                    +{booking.seatNumbers.length - 5} more
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <button
                                    className="ml-4 flex items-center gap-2 text-primary hover:text-primary/80 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedBooking(booking);
                                    }}
                                >
                                    <Eye className="w-4 h-4" />
                                    View Details
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedBooking && (
                <BookingDetailsModal
                    booking={selectedBooking}
                    onClose={() => setSelectedBooking(null)}
                />
            )}
        </div>
    );
};