import React from 'react';
import { format } from 'date-fns';
import { Calendar, MapPin, Users, Settings, PercentCircle, Info, CheckCircle2, XCircle, Tag } from 'lucide-react';

interface EventListItemProps {
    event: {
        id: number;
        eventName: string;
        eventDate: string | Date;
        venueName: string | null;
        customVenue: string | null;
        availableSeats: number;
        totalSeats: number;
        isFree: boolean;
        status?: string;
        saleStartTime?: string | Date | null;
        hasActiveDiscounts?: boolean;
    };
    onManageSections?: () => void;
    onManageDiscounts?: () => void;
    onViewDetails?: () => void;
    showStats?: boolean; // Show event stats (for My Events page only)
}

export const EventListItem: React.FC<EventListItemProps> = ({ 
    event, 
    onManageSections, 
    onManageDiscounts, 
    onViewDetails,
    showStats = false
}) => {
    const eventDate = new Date(event.eventDate);
    const venue = event.venueName || event.customVenue || 'TBA';
    const now = new Date();
    const isPastEvent = eventDate < now;
    const saleStartTime = event.saleStartTime ? new Date(event.saleStartTime) : null;
    const isOnSale = saleStartTime && saleStartTime <= now && !isPastEvent;
    
    // Determine event category
    const getEventCategory = () => {
        if (isPastEvent) return { label: 'Past Event', color: 'bg-gray-500' };
        if (event.status === 'COMPLETED') return { label: 'Completed', color: 'bg-purple-500' };
        if (event.status === 'SOLD_OUT') return { label: 'Sold Out', color: 'bg-red-500' };
        if (event.status === 'CANCELLED') return { label: 'Cancelled', color: 'bg-gray-500' };
        if (isOnSale || event.status === 'ON_SALE') return { label: 'On Sale', color: 'bg-green-500' };
        return { label: 'Upcoming', color: 'bg-blue-500' };
    };
    
    const category = getEventCategory();
    const ticketsSold = event.totalSeats - event.availableSeats;
    const attendanceRate = Math.round((ticketsSold / event.totalSeats) * 100);

    return (
        <div className="group bg-card text-card-foreground rounded-lg border shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
            <div className="flex flex-col lg:flex-row">
                {/* Left Section: Event Info */}
                <div className={`flex-1 p-6 ${isPastEvent ? 'opacity-75' : ''}`}>
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <h3 className="text-xl font-bold tracking-tight truncate">
                                    {event.eventName}
                                </h3>
                                <span className={`${category.color} text-white px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm flex-shrink-0`}>
                                    {category.label}
                                </span>
                                {event.hasActiveDiscounts && (
                                    <span className="bg-yellow-500 text-white px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm flex items-center gap-1 flex-shrink-0">
                                        <Tag className="w-3 h-3" />
                                        Discounts
                                    </span>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-muted-foreground mt-3">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
                                    <span className="truncate">{format(eventDate, 'MMM d, yyyy h:mm a')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                                    <span className="truncate">{venue}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-primary flex-shrink-0" />
                                    <span>{event.availableSeats} / {event.totalSeats} available</span>
                                </div>
                            </div>

                            {/* Stats - Only show on My Events page */}
                            {showStats && (isPastEvent || event.status === 'COMPLETED') && (
                                <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-500">Tickets Sold:</span>
                                        <span className="font-semibold text-gray-700 ml-2">
                                            {ticketsSold} / {event.totalSeats}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Attendance:</span>
                                        <span className="font-semibold text-gray-700 ml-2">{attendanceRate}%</span>
                                    </div>
                                    {event.status === 'COMPLETED' && (
                                        <div className="flex items-center gap-1 text-green-600 font-medium">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Completed
                                        </div>
                                    )}
                                    {event.status === 'CANCELLED' && (
                                        <div className="flex items-center gap-1 text-red-600 font-medium">
                                            <XCircle className="w-4 h-4" />
                                            Cancelled
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Ticket Type Badge */}
                        <div className={`flex-shrink-0 ${isPastEvent ? 'opacity-75' : ''}`}>
                            <div className="text-lg font-bold px-4 py-2 bg-muted rounded-lg text-center">
                                {event.isFree ? 'Free' : 'Ticketed'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Section: Actions - Modern Design */}
                <div className="lg:w-72 p-6 bg-gradient-to-br from-muted/20 to-muted/40 lg:border-l border-t lg:border-t-0 space-y-3 flex flex-col justify-center backdrop-blur-sm">
                    {/* Management Actions - Horizontal on mobile, stacked on desktop */}
                    {(onManageSections || onManageDiscounts) && (
                        <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                            {onManageSections && (
                                <button
                                    onClick={onManageSections}
                                    disabled={isPastEvent || event.status === 'COMPLETED' || event.status === 'CANCELLED'}
                                    title="Manage sections"
                                    className={`inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 text-sm ${
                                        isPastEvent || event.status === 'COMPLETED' || event.status === 'CANCELLED'
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 hover:shadow-medium hover:-translate-y-0.5 active:translate-y-0'
                                    }`}
                                >
                                    <Settings className="w-4 h-4" />
                                    <span className="hidden lg:inline">Sections</span>
                                </button>
                            )}
                            {onManageDiscounts && (
                                <button
                                    onClick={onManageDiscounts}
                                    disabled={isPastEvent || event.status === 'COMPLETED' || event.status === 'CANCELLED'}
                                    title="Manage discounts"
                                    className={`inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 text-sm ${
                                        isPastEvent || event.status === 'COMPLETED' || event.status === 'CANCELLED'
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 hover:shadow-medium hover:-translate-y-0.5 active:translate-y-0'
                                    }`}
                                >
                                    <PercentCircle className="w-4 h-4" />
                                    <span className="hidden lg:inline">Discounts</span>
                                </button>
                            )}
                        </div>
                    )}
                    {/* Primary Action - View Details */}
                    {onViewDetails && (
                        <button
                            onClick={onViewDetails}
                            title="View analytics and bookings"
                            className="relative z-10 w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white rounded-xl font-bold hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 transition-all duration-300 text-sm shadow-soft hover:shadow-glow hover:-translate-y-1 active:translate-y-0 opacity-100"
                        >
                            <Info className="w-5 h-5" />
                            <span>View Details</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
