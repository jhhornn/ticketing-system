import React from 'react';
import { X, Calendar, Ticket, CreditCard, CheckCircle, Clock, Download, Share2, Copy } from 'lucide-react';
import { format } from 'date-fns';
import type { Booking } from '../services/bookings';

interface BookingDetailsModalProps {
    booking: Booking;
    onClose: () => void;
}

export const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({ booking, onClose }) => {
    const getStatusClasses = (status: string) => {
        switch (status) {
            case 'CONFIRMED': return 'bg-success/20 text-success';
            case 'PENDING': return 'bg-warning/20 text-warning';
            case 'CANCELLED': return 'bg-destructive/20 text-destructive';
            default: return 'bg-muted/20 text-muted-foreground';
        }
    };

    const getPaymentStatusClasses = (status: string) => {
        switch (status) {
            case 'SUCCESS': return 'text-success';
            case 'PENDING': return 'text-warning';
            case 'FAILED': return 'text-destructive';
            case 'REFUNDED': return 'text-primary';
            default: return 'text-muted-foreground';
        }
    };

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-xl border shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b">
                    <div>
                        <h2 className="text-2xl font-bold font-poppins">Booking Details</h2>
                        <p className="text-sm text-muted-foreground">Reference: {booking.bookingReference}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    <div className="flex items-center gap-3">
                        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusClasses(booking.status)}`}>
                            {booking.status}
                        </span>
                        {booking.status === 'CONFIRMED' && (
                            <div className="flex items-center gap-1 text-success">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-sm font-medium">Confirmed</span>
                            </div>
                        )}
                    </div>

                    <div className="bg-muted/30 rounded-lg p-4 space-y-3 border">
                        <h3 className="font-semibold text-lg mb-3">Event Information</h3>
                        
                        <div className="flex items-start gap-3">
                            <Ticket className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-foreground">Event ID: {booking.eventId}</p>
                                <p className="text-sm text-muted-foreground">Detailed event info would go here</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm text-muted-foreground">Booked on</p>
                                <p className="font-medium text-foreground">
                                    {format(new Date(booking.createdAt), 'EEEE, MMMM d, yyyy')}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {format(new Date(booking.createdAt), 'h:mm a')}
                                </p>
                            </div>
                        </div>

                        {booking.confirmedAt && (
                            <div className="flex items-start gap-3">
                                <Clock className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Confirmed on</p>
                                    <p className="font-medium text-foreground">
                                        {format(new Date(booking.confirmedAt), 'EEEE, MMMM d, yyyy')}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {format(new Date(booking.confirmedAt), 'h:mm a')}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-muted/30 rounded-lg p-4 border">
                        <h3 className="font-semibold text-lg mb-3">Your Seats</h3>
                        <div className="flex flex-wrap gap-2">
                            {booking.seatNumbers && booking.seatNumbers.length > 0 ? (
                                booking.seatNumbers.map((seat, index) => (
                                    <div
                                        key={index}
                                        className="px-3 py-2 bg-card border rounded-lg font-mono text-sm font-semibold text-foreground"
                                    >
                                        {seat}
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">No seat information available</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-muted/30 rounded-lg p-4 space-y-3 border">
                        <h3 className="font-semibold text-lg mb-3">Payment Details</h3>
                        
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Total Amount</span>
                            <span className="text-2xl font-bold text-primary">
                                ${booking.totalAmount.toFixed(2)}
                            </span>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t">
                            <span className="text-muted-foreground">Payment Status</span>
                            <span className={`font-semibold ${getPaymentStatusClasses(booking.paymentStatus)}`}>
                                {booking.paymentStatus}
                            </span>
                        </div>

                        {(booking as any).paymentId && (
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Payment ID</span>
                                <span className="font-mono text-sm text-foreground">{(booking as any).paymentId}</span>
                            </div>
                        )}

                        <div className="flex items-center gap-2 pt-3 border-t text-sm text-muted-foreground">
                            <CreditCard className="w-4 h-4 text-primary" />
                            <span>Mock Payment (Test Mode)</span>
                        </div>
                    </div>

                    <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-center">
                        <p className="text-sm text-muted-foreground mb-2">Booking Reference</p>
                        <p className="text-3xl font-bold font-mono text-primary mb-4">{booking.bookingReference}</p>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(booking.bookingReference);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                        >
                            <Copy className="w-4 h-4" />
                            Copy Reference
                        </button>
                        <p className="text-xs text-muted-foreground mt-4">
                            Show this reference number at the venue entrance.
                        </p>
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                        <button className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 border rounded-lg font-semibold hover:bg-secondary transition-colors">
                            <Download className="w-4 h-4" />
                            Download Ticket
                        </button>
                        <button className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 border rounded-lg font-semibold hover:bg-secondary transition-colors">
                            <Share2 className="w-4 h-4" />
                            Share
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
