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

    // Calculate statistics
    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const confirmedBookings = bookings.filter(b => b.status === BookingStatus.CONFIRMED);
    const pendingBookings = bookings.filter(b => b.status === BookingStatus.PENDING);
    const cancelledBookings = bookings.filter(b => b.status === BookingStatus.CANCELLED);
    const ticketsSold = event.totalSeats - event.availableSeats;
    const attendanceRate = event.totalSeats > 0 ? (ticketsSold / event.totalSeats) * 100 : 0;

    const getStatusBadge = (status: BookingStatus) => {
        const styles = {
            [BookingStatus.CONFIRMED]: 'bg-green-100 text-green-700 border-green-300',
            [BookingStatus.PENDING]: 'bg-yellow-100 text-yellow-700 border-yellow-300',
            [BookingStatus.CANCELLED]: 'bg-red-100 text-red-700 border-red-300',
        };
        const icons = {
            [BookingStatus.CONFIRMED]: <CheckCircle className="w-3 h-3" />,
            [BookingStatus.PENDING]: <AlertCircle className="w-3 h-3" />,
            [BookingStatus.CANCELLED]: <XCircle className="w-3 h-3" />,
        };
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${styles[status]}`}>
                {icons[status]}
                {status}
            </span>
        );
    };

    const getPaymentStatusBadge = (status: PaymentStatus) => {
        const styles = {
            [PaymentStatus.SUCCESS]: 'bg-emerald-100 text-emerald-700',
            [PaymentStatus.PENDING]: 'bg-amber-100 text-amber-700',
            [PaymentStatus.FAILED]: 'bg-rose-100 text-rose-700',
            [PaymentStatus.REFUNDED]: 'bg-blue-100 text-blue-700',
        };
        return (
            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${styles[status]}`}>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex justify-between items-start">
                    <div className="flex-1">
                        <h2 className="text-3xl font-bold mb-2">{event.eventName}</h2>
                        <div className="flex flex-wrap gap-4 text-sm opacity-90">
                            <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {format(new Date(event.eventDate), 'MMM dd, yyyy')}
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {event.eventTime}
                            </div>
                            <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {event.venueName || event.customVenue}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="border-b bg-gray-50 px-6">
                    <div className="flex gap-1">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-6 py-3 font-semibold transition-all ${
                                activeTab === 'overview'
                                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" />
                                Overview & Analytics
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('bookings')}
                            className={`px-6 py-3 font-semibold transition-all ${
                                activeTab === 'bookings'
                                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <Ticket className="w-4 h-4" />
                                Bookings ({bookings.length})
                            </div>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : activeTab === 'overview' ? (
                        <div className="space-y-6">
                            {/* Statistics Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-blue-600 text-sm font-medium">Total Revenue</span>
                                        <DollarSign className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="text-2xl font-bold text-blue-900">${totalRevenue.toFixed(2)}</div>
                                    <div className="text-xs text-blue-600 mt-1">From {confirmedBookings.length} confirmed bookings</div>
                                </div>

                                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-green-600 text-sm font-medium">Tickets Sold</span>
                                        <Ticket className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div className="text-2xl font-bold text-green-900">{ticketsSold} / {event.totalSeats}</div>
                                    <div className="text-xs text-green-600 mt-1">{event.availableSeats} remaining</div>
                                </div>

                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-purple-600 text-sm font-medium">Attendance Rate</span>
                                        <TrendingUp className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div className="text-2xl font-bold text-purple-900">{attendanceRate.toFixed(1)}%</div>
                                    <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
                                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${attendanceRate}%` }}></div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-5 border border-amber-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-amber-600 text-sm font-medium">Total Bookings</span>
                                        <Users className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div className="text-2xl font-bold text-amber-900">{bookings.length}</div>
                                    <div className="text-xs text-amber-600 mt-1">
                                        {confirmedBookings.length} confirmed, {pendingBookings.length} pending
                                    </div>
                                </div>
                            </div>

                            {/* Booking Status Breakdown */}
                            <div className="bg-gray-50 rounded-xl p-5 border">
                                <h3 className="font-bold text-lg mb-4 text-gray-800">Booking Status Breakdown</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                            <span className="font-semibold text-gray-700">Confirmed</span>
                                        </div>
                                        <div className="text-2xl font-bold text-green-600">{confirmedBookings.length}</div>
                                    </div>
                                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <AlertCircle className="w-5 h-5 text-yellow-600" />
                                            <span className="font-semibold text-gray-700">Pending</span>
                                        </div>
                                        <div className="text-2xl font-bold text-yellow-600">{pendingBookings.length}</div>
                                    </div>
                                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <XCircle className="w-5 h-5 text-red-600" />
                                            <span className="font-semibold text-gray-700">Cancelled</span>
                                        </div>
                                        <div className="text-2xl font-bold text-red-600">{cancelledBookings.length}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Event Details */}
                            <div className="bg-gray-50 rounded-xl p-5 border">
                                <h3 className="font-bold text-lg mb-4 text-gray-800">Event Information</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-600">Event Type:</span>
                                        <span className="ml-2 font-semibold text-gray-900">{event.isTicketed ? 'Ticketed' : 'Free'}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Status:</span>
                                        <span className="ml-2 font-semibold text-gray-900">{event.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Category:</span>
                                        <span className="ml-2 font-semibold text-gray-900">{event.eventType}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Active Discounts:</span>
                                        <span className="ml-2 font-semibold text-gray-900">
                                            {event.hasActiveDiscounts ? '✓ Yes' : '✗ No'}
                                        </span>
                                    </div>
                                </div>
                                {event.eventDescription && (
                                    <div className="mt-4 pt-4 border-t">
                                        <span className="text-gray-600 text-sm">Description:</span>
                                        <p className="mt-1 text-gray-800">{event.eventDescription}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Export Button */}
                            <div className="flex justify-end">
                                <button
                                    onClick={exportToCSV}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                                >
                                    <Download className="w-4 h-4" />
                                    Export to CSV
                                </button>
                            </div>

                            {/* Bookings Table */}
                            {bookings.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 rounded-xl">
                                    <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <h3 className="text-lg font-semibold text-gray-700 mb-1">No Bookings Yet</h3>
                                    <p className="text-gray-500">Bookings will appear here once customers purchase tickets.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-gray-100 border-b-2 border-gray-300">
                                                <th className="text-left p-3 text-sm font-semibold text-gray-700">Reference</th>
                                                <th className="text-left p-3 text-sm font-semibold text-gray-700">Customer</th>
                                                <th className="text-left p-3 text-sm font-semibold text-gray-700">Seats</th>
                                                <th className="text-left p-3 text-sm font-semibold text-gray-700">Amount</th>
                                                <th className="text-left p-3 text-sm font-semibold text-gray-700">Status</th>
                                                <th className="text-left p-3 text-sm font-semibold text-gray-700">Payment</th>
                                                <th className="text-left p-3 text-sm font-semibold text-gray-700">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bookings.map((booking) => (
                                                <tr key={booking.bookingId} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-2">
                                                            <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                                                                {booking.bookingReference}
                                                            </code>
                                                            <button
                                                                onClick={() => copyToClipboard(booking.bookingReference, booking.bookingReference)}
                                                                className="text-gray-400 hover:text-gray-600"
                                                                title="Copy reference"
                                                            >
                                                                {copiedReference === booking.bookingReference ? (
                                                                    <Check className="w-4 h-4 text-green-600" />
                                                                ) : (
                                                                    <Copy className="w-4 h-4" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                                                                <User className="w-3 h-3 text-gray-400" />
                                                                {booking.userName || 'N/A'}
                                                            </div>
                                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                                <Mail className="w-3 h-3" />
                                                                {booking.userEmail || 'N/A'}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="text-sm text-gray-700">
                                                            {booking.seatNumbers.slice(0, 2).join(', ')}
                                                            {booking.seatNumbers.length > 2 && (
                                                                <span className="text-gray-500"> +{booking.seatNumbers.length - 2} more</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-3">
                                                        <span className="font-semibold text-gray-900">
                                                            ${booking.totalAmount.toFixed(2)}
                                                        </span>
                                                    </td>
                                                    <td className="p-3">{getStatusBadge(booking.status)}</td>
                                                    <td className="p-3">{getPaymentStatusBadge(booking.paymentStatus)}</td>
                                                    <td className="p-3">
                                                        <div className="text-sm text-gray-700">
                                                            {format(new Date(booking.createdAt), 'MMM dd, yyyy')}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
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

                {/* Footer */}
                <div className="border-t bg-gray-50 px-6 py-4 flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                        Last updated: {format(new Date(), 'MMM dd, yyyy HH:mm')}
                    </div>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
