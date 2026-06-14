import React, { useState, useEffect } from 'react';
import { X, Users, DollarSign, Calendar, TrendingUp, Download, MapPin, Clock, Ticket, Mail, User, CheckCircle, XCircle, AlertCircle, Copy, Check } from 'lucide-react';
import { BookingsService, type Booking, BookingStatus, PaymentStatus } from '../services/bookings';
import { format } from 'date-fns';
import type { Event } from '../services/events';

interface EventDetailsModalProps {
    isOpen: boolean;
    event: Event;
    onClose: () => void;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ isOpen, event, onClose }) => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'bookings'>('overview');
    const [copiedReference, setCopiedReference] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadBookings();
        }
    }, [isOpen, event.id]);

    const loadBookings = async () => {
        try {
            setLoading(true);
            const data = await BookingsService.getEventBookings(event.id);
            setBookings(data);
        } catch (error) {
            console.error('Failed to load bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string, reference: string) => {
        navigator.clipboard.writeText(text);
        setCopiedReference(reference);
        setTimeout(() => setCopiedReference(null), 2000);
    };

    if (!isOpen) return null;

    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const confirmedBookings = bookings.filter(b => b.status === BookingStatus.CONFIRMED);
    const pendingBookings = bookings.filter(b => b.status === BookingStatus.PENDING);
    const cancelledBookings = bookings.filter(b => b.status === BookingStatus.CANCELLED);
    const ticketsSold = event.totalSeats - event.availableSeats;
    const attendanceRate = event.totalSeats > 0 ? (ticketsSold / event.totalSeats) * 100 : 0;

    const getStatusBadge = (status: BookingStatus) => {
        const styles = {
            [BookingStatus.CONFIRMED]: 'bg-success/20 text-success',
            [BookingStatus.PENDING]: 'bg-warning/20 text-warning',
            [BookingStatus.CANCELLED]: 'bg-destructive/20 text-destructive',
        };
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[status]}`}>
                {status}
            </span>
        );
    };

    const getPaymentStatusBadge = (status: PaymentStatus) => {
        const styles = {
            [PaymentStatus.SUCCESS]: 'bg-green-500/20 text-green-700',
            [PaymentStatus.PENDING]: 'bg-yellow-500/20 text-yellow-700',
            [PaymentStatus.FAILED]: 'bg-red-500/20 text-red-700',
            [PaymentStatus.REFUNDED]: 'bg-blue-500/20 text-blue-700',
        };
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[status]}`}>
                {status}
            </span>
        );
    };

    const exportToCSV = () => {
        const headers = ['Booking Ref', 'Customer Name', 'Email', 'Seats', 'Amount', 'Status', 'Payment', 'Date'];
        const rows = bookings.map(b => [
            b.bookingReference,
            b.userName || 'N/A',
            b.userEmail || 'N/A',
            b.seatNumbers.join('; '),
            `$${b.totalAmount.toFixed(2)}`,
            b.status,
            b.paymentStatus,
            format(new Date(b.createdAt), 'yyyy-MM-dd HH:mm')
        ]);
        
        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${event.eventName.replace(/\s+/g, '_')}_bookings.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card w-full max-w-6xl rounded-xl border shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b">
                    <div>
                        <h2 className="text-3xl font-bold font-poppins mb-1">{event.eventName}</h2>
                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4 text-primary" />
                                {format(new Date(event.eventDate), 'MMM dd, yyyy')}
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4 text-primary" />
                                {event.eventTime}
                            </div>
                            <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4 text-primary" />
                                {event.venueName || event.customVenue}
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex border-b">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`py-3 px-6 text-sm font-semibold border-b-2 ${activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('bookings')}
                        className={`py-3 px-6 text-sm font-semibold border-b-2 ${activeTab === 'bookings' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                        Bookings ({bookings.length})
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
                        </div>
                    ) : activeTab === 'overview' ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-muted/30 p-5 rounded-xl border">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium">Total Revenue</span>
                                        <DollarSign className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
                                    <div className="text-xs text-muted-foreground mt-1">{confirmedBookings.length} confirmed</div>
                                </div>

                                <div className="bg-muted/30 p-5 rounded-xl border">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium">Tickets Sold</span>
                                        <Ticket className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="text-2xl font-bold">{ticketsSold} / {event.totalSeats}</div>
                                    <div className="text-xs text-muted-foreground mt-1">{event.availableSeats} remaining</div>
                                </div>

                                <div className="bg-muted/30 p-5 rounded-xl border">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium">Attendance Rate</span>
                                        <TrendingUp className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="text-2xl font-bold">{attendanceRate.toFixed(1)}%</div>
                                    <div className="w-full bg-border rounded-full h-2 mt-2">
                                        <div className="bg-primary h-2 rounded-full" style={{ width: `${attendanceRate}%` }}></div>
                                    </div>
                                </div>

                                <div className="bg-muted/30 p-5 rounded-xl border">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium">Total Bookings</span>
                                        <Users className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="text-2xl font-bold">{bookings.length}</div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {confirmedBookings.length} confirmed, {pendingBookings.length} pending
                                    </div>
                                </div>
                            </div>

                            <div className="bg-muted/30 rounded-xl p-5 border">
                                <h3 className="font-bold text-lg mb-4">Booking Status Breakdown</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="bg-card p-4 rounded-lg border flex flex-col items-center">
                                        <CheckCircle className="w-8 h-8 text-success mb-2" />
                                        <span className="font-semibold text-sm mb-1">Confirmed</span>
                                        <span className="text-2xl font-bold text-success">{confirmedBookings.length}</span>
                                    </div>
                                    <div className="bg-card p-4 rounded-lg border flex flex-col items-center">
                                        <AlertCircle className="w-8 h-8 text-warning mb-2" />
                                        <span className="font-semibold text-sm mb-1">Pending</span>
                                        <span className="text-2xl font-bold text-warning">{pendingBookings.length}</span>
                                    </div>
                                    <div className="bg-card p-4 rounded-lg border flex flex-col items-center">
                                        <XCircle className="w-8 h-8 text-destructive mb-2" />
                                        <span className="font-semibold text-sm mb-1">Cancelled</span>
                                        <span className="text-2xl font-bold text-destructive">{cancelledBookings.length}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-muted/30 rounded-xl p-5 border">
                                <h3 className="font-bold text-lg mb-4">Event Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Type:</span>
                                        <span className="ml-2 font-semibold">{event.isTicketed ? 'Ticketed' : 'Free'}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Status:</span>
                                        <span className="ml-2 font-semibold">{event.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Category:</span>
                                        <span className="ml-2 font-semibold">{event.eventType}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Active Discounts:</span>
                                        <span className="ml-2 font-semibold">
                                            {event.hasActiveDiscounts ? 'Yes' : 'No'}
                                        </span>
                                    </div>
                                </div>
                                {event.eventDescription && (
                                    <div className="mt-4 pt-4 border-t border-border">
                                        <span className="text-muted-foreground text-sm">Description:</span>
                                        <p className="mt-1">{event.eventDescription}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-end">
                                <button
                                    onClick={exportToCSV}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                                >
                                    <Download className="w-4 h-4" />
                                    Export to CSV
                                </button>
                            </div>

                            {bookings.length === 0 ? (
                                <div className="text-center py-12 bg-muted/30 rounded-xl border">
                                    <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                                    <h3 className="text-lg font-semibold mb-1">No Bookings Yet</h3>
                                    <p className="text-muted-foreground">Bookings will appear here once customers purchase tickets.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto border rounded-lg">
                                    <table className="w-full text-left">
                                        <thead className="bg-muted/30">
                                            <tr>
                                                <th className="p-4 text-sm font-semibold text-muted-foreground">Reference</th>
                                                <th className="p-4 text-sm font-semibold text-muted-foreground">Customer</th>
                                                <th className="p-4 text-sm font-semibold text-muted-foreground">Seats</th>
                                                <th className="p-4 text-sm font-semibold text-muted-foreground">Amount</th>
                                                <th className="p-4 text-sm font-semibold text-muted-foreground">Status</th>
                                                <th className="p-4 text-sm font-semibold text-muted-foreground">Payment</th>
                                                <th className="p-4 text-sm font-semibold text-muted-foreground">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bookings.map((booking) => (
                                                <tr key={booking.bookingId} className="border-t hover:bg-muted/10">
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            <code className="text-xs bg-muted px-2 py-1 rounded">{booking.bookingReference}</code>
                                                            <button
                                                                onClick={() => copyToClipboard(booking.bookingReference, booking.bookingReference)}
                                                                className="text-muted-foreground hover:text-foreground"
                                                                title="Copy reference"
                                                            >
                                                                {copiedReference === booking.bookingReference ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-1 text-sm font-medium">
                                                                <User className="w-3 h-3 text-muted-foreground" />
                                                                {booking.userName || 'N/A'}
                                                            </div>
                                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                <Mail className="w-3 h-3" />
                                                                {booking.userEmail || 'N/A'}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="text-sm">
                                                            {booking.seatNumbers.slice(0, 2).join(', ')}
                                                            {booking.seatNumbers.length > 2 && <span className="text-muted-foreground"> +{booking.seatNumbers.length - 2} more</span>}
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="font-semibold">${booking.totalAmount.toFixed(2)}</span>
                                                    </td>
                                                    <td className="p-4">{getStatusBadge(booking.status)}</td>
                                                    <td className="p-4">{getPaymentStatusBadge(booking.paymentStatus)}</td>
                                                    <td className="p-4">
                                                        <div className="text-sm">
                                                            {format(new Date(booking.createdAt), 'MMM dd, yyyy')}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {format(new Date(booking.createdAt), 'HH:mm')}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="border-t p-6 flex justify-end">
                    <button onClick={onClose} className="py-2.5 px-5 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/80">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
