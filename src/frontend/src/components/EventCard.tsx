import React from 'react';
import { format } from 'date-fns';
import { Calendar, MapPin, Users, Ticket, Tag, CheckCircle2, XCircle, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ActionButton } from './ui';

interface EventCardProps {
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
        mainImageUrl?: string; // Future proofing
        hasActiveDiscounts?: boolean;
    };
    onManageSections?: () => void;
    onManageDiscounts?: () => void;
    onEditEvent?: () => void;
    onViewDetails?: () => void;
    showBookButton?: boolean;
    showStats?: boolean; // Show event stats (for My Events page only)
}

export const EventCard: React.FC<EventCardProps> = ({ event, onManageSections, onManageDiscounts, onEditEvent, onViewDetails, showBookButton = true, showStats = false }) => {
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

    // Use a placeholder gradient if no image (can be replaced with generate_image later or real data)
    const gradients = [
        'from-pink-500 via-red-500 to-yellow-500',
        'from-blue-400 via-indigo-500 to-purple-500',
        'from-green-400 via-teal-500 to-blue-500',
        'from-indigo-400 via-purple-500 to-pink-500'
    ];
    // Deterministic gradient based on ID
    const gradient = gradients[event.id % gradients.length];

    return (
        <div className="group relative bg-card text-card-foreground rounded-xl border shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full hover:scale-[1.02]">
            {/* Image Header / Placeholder */}
            <div className={`h-48 w-full bg-gradient-to-br ${gradient} p-6 relative overflow-hidden ${
                isPastEvent ? 'opacity-75' : ''
            }`}>
                {/* Status Badge */}
                <div className={`absolute top-4 left-4 ${category.color} text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1`}>
                    {category.label}
                </div>
                
                {/* Discount Badge */}
                {event.hasActiveDiscounts && (
                    <div className="absolute top-16 left-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1 animate-pulse">
                        <Tag className="w-3 h-3" />
                        Discounts Available
                    </div>
                )}
                
                {/* Glassmorphism Date Badge */}
                <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-sm font-semibold border border-white/30 shadow-sm">
                    {format(eventDate, 'MMM d')}
                </div>

                {/* Event Title Overlay */}
                <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white text-xl font-bold tracking-tight drop-shadow-md line-clamp-2">
                        {event.eventName}
                    </h3>
                </div>

                {/* Shine effect on hover */}
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
            </div>

            <div className={`p-5 flex-1 flex flex-col gap-4 ${
                isPastEvent ? 'opacity-75' : ''
            }`}>
                {/* Details */}
                <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span>{format(eventDate, 'EEEE, h:mm a')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="line-clamp-1">{venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        <span>{event.availableSeats} / {event.totalSeats} seats available</span>
                    </div>
                    
                    {/* Event Stats - Only show on My Events page */}
                    {showStats && (isPastEvent || event.status === 'COMPLETED') && (
                        <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">Tickets Sold:</span>
                                <span className="font-semibold text-gray-700">
                                    {event.totalSeats - event.availableSeats} / {event.totalSeats}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">Attendance Rate:</span>
                                <span className="font-semibold text-gray-700">
                                    {Math.round(((event.totalSeats - event.availableSeats) / event.totalSeats) * 100)}%
                                </span>
                            </div>
                            {event.status === 'COMPLETED' && (
                                <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Event Completed
                                </div>
                            )}
                            {event.status === 'CANCELLED' && (
                                <div className="flex items-center gap-1 text-xs text-red-600 font-medium">
                                    <XCircle className="w-3 h-3" />
                                    Event Cancelled
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Actions - Modern grouped design with full opacity */}
                <div className="mt-auto pt-4 space-y-3 relative z-10 opacity-100">
                    {/* Management Actions Group */}
                    {(onManageSections || onManageDiscounts || onEditEvent) && (
                        <div className={`grid ${onManageSections && onManageDiscounts && onEditEvent ? 'grid-cols-3' : onManageSections && onManageDiscounts ? 'grid-cols-2' : onEditEvent && (onManageSections || onManageDiscounts) ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                            {onEditEvent && (
                                <ActionButton
                                    variant="edit"
                                    onClick={onEditEvent}
                                    size="sm"
                                    title="Edit event details"
                                    showLabel={false}
                                />
                            )}
                            {onManageSections && (
                                <ActionButton
                                    variant="sections"
                                    onClick={onManageSections}
                                    size="sm"
                                    disabled={isPastEvent || event.status === 'COMPLETED' || event.status === 'CANCELLED'}
                                    title="Manage event sections and seating"
                                    showLabel={false}
                                />
                            )}
                            {onManageDiscounts && (
                                <ActionButton
                                    variant="discounts"
                                    onClick={onManageDiscounts}
                                    size="sm"
                                    disabled={isPastEvent || event.status === 'COMPLETED' || event.status === 'CANCELLED'}
                                    title="Manage event discounts and promotions"
                                    showLabel={false}
                                />
                            )}
                        </div>
                    )}
                    {/* View Details - Primary Action */}
                    {onViewDetails && (
                        <button
                            onClick={onViewDetails}
                            title="View detailed analytics and bookings"
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 active:scale-95 transition-all duration-300 text-sm shadow-soft hover:shadow-glow"
                        >
                            <Info className="w-4 h-4" />
                            <span>View Details & Bookings</span>
                        </button>
                    )}
                    <div className="flex items-center justify-between border-t border-border/50 pt-4">
                        <div className="text-lg font-bold text-foreground">
                            {event.isFree ? 'Free' : 'Ticketed'}
                        </div>

                        {showBookButton && (
                            isPastEvent ? (
                                <button
                                    disabled
                                    className="inline-flex items-center gap-2 bg-gray-400 text-white px-4 py-2 rounded-lg font-medium cursor-not-allowed opacity-60"
                                >
                                    <Ticket className="w-4 h-4" />
                                    Event Ended
                                </button>
                            ) : (
                                <Link
                                    to={`/events/${event.id}`}
                                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
                                >
                                    <Ticket className="w-4 h-4" />
                                    Book Now
                                </Link>
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
