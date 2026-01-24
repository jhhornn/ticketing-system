import React from 'react';
import { X, Calendar, Ticket, CreditCard, CheckCircle, Clock, Download, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import type { Booking } from '../services/bookings';
import { Button } from './ui/Button';

interface BookingDetailsModalProps {
    booking: Booking;
    onClose: () => void;
}

export const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({ booking, onClose }) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CONFIRMED':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'CANCELLED':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    const getPaymentStatusColor = (status: string) => {
        switch (status) {
            case 'SUCCESS':
                return 'text-green-600';
            case 'PENDING':
                return 'text-yellow-600';
            case 'FAILED':
                return 'text-red-600';
            default:
                return 'text-slate-600';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">Booking Details</h2>
                        <p className="text-sm text-slate-600 mt-1">Reference: {booking.bookingReference}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Status Badge */}
                    <div className="flex items-center gap-3">
                        <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(booking.status)}`}>
                            {booking.status}
                        </span>
                        {booking.status === 'CONFIRMED' && (
                            <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-sm font-medium">Confirmed</span>
                            </div>
                        )}
                    </div>

                    {/* Event Information */}
                    <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                        <h3 className="font-semibold text-lg mb-3">Event Information</h3>
                        
                        <div className="flex items-start gap-3">
                            <Ticket className="w-5 h-5 text-slate-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-semibold">Event #{booking.eventId}</p>
                                <p className="text-sm text-slate-600">Event details will be displayed here</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-slate-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm text-slate-600">Booked on</p>
                                <p className="font-medium">
                                    {format(new Date(booking.createdAt), 'EEEE, MMMM d, yyyy')}
                                </p>
                                <p className="text-sm text-slate-500">
                                    {format(new Date(booking.createdAt), 'h:mm a')}
                                </p>
                            </div>
                        </div>

                        {booking.confirmedAt && (
                            <div className="flex items-start gap-3">
                                <Clock className="w-5 h-5 text-slate-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm text-slate-600">Confirmed on</p>
                                    <p className="font-medium">
                                        {format(new Date(booking.confirmedAt), 'EEEE, MMMM d, yyyy')}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        {format(new Date(booking.confirmedAt), 'h:mm a')}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Seat Information */}
                    <div className="bg-slate-50 rounded-lg p-4">
                        <h3 className="font-semibold mb-3">Your Seats</h3>
                        <div className="flex flex-wrap gap-2">
                            {booking.seatNumbers && booking.seatNumbers.length > 0 ? (
                                booking.seatNumbers.map((seat, index) => (
                                    <div
                                        key={index}
                                        className="px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono text-sm font-semibold"
                                    >
                                        {seat}
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-600">No seat information available</p>
                            )}
                        </div>
                    </div>

                    {/* Payment Information */}
                    <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                        <h3 className="font-semibold mb-3">Payment Details</h3>
                        
                        <div className="flex items-center justify-between">
                            <span className="text-slate-600">Total Amount</span>
                            <span className="text-2xl font-bold text-primary">
                                ${booking.totalAmount.toFixed(2)}
                            </span>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t">
                            <span className="text-slate-600">Payment Status</span>
                            <span className={`font-semibold ${getPaymentStatusColor(booking.paymentStatus)}`}>
                                {booking.paymentStatus}
                            </span>
                        </div>

                        {(booking as any).paymentId && (
                            <div className="flex items-center justify-between">
                                <span className="text-slate-600">Payment ID</span>
                                <span className="font-mono text-sm text-slate-700">{(booking as any).paymentId}</span>
                            </div>
                        )}

                        <div className="flex items-center gap-2 pt-3 border-t text-sm text-slate-600">
                            <CreditCard className="w-4 h-4" />
                            <span>Mock Payment (Test Mode)</span>
                        </div>
                    </div>

                    {/* Booking Reference */}
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                        <p className="text-sm text-slate-600 mb-2">Booking Reference</p>
                        <div className="flex items-center justify-between">
                            <p className="text-2xl font-bold font-mono text-primary">{booking.bookingReference}</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    navigator.clipboard.writeText(booking.bookingReference);
                                }}
                            >
                                Copy
                            </Button>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            Show this reference number at the venue entrance
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t">
                        <Button variant="outline" className="flex-1 flex items-center justify-center gap-2">
                            <Download className="w-4 h-4" />
                            Download Ticket
                        </Button>
                        <Button variant="outline" className="flex-1 flex items-center justify-center gap-2">
                            <Share2 className="w-4 h-4" />
                            Share
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
