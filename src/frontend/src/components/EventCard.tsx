import React from 'react';
import { format } from 'date-fns';
import { Calendar, MapPin, Users, Ticket, Tag, Edit, LayoutList, Percent, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

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
        mainImageUrl?: string;
        hasActiveDiscounts?: boolean;
        isPopular?: boolean;
    };
    onManageSections?: () => void;
    onManageDiscounts?: () => void;
    onEditEvent?: () => void;
    onViewDetails?: () => void;
    showBookButton?: boolean;
    showActions?: boolean; // New prop to control visibility of management actions
}

export const EventCard: React.FC<EventCardProps> = ({ 
    event, 
    onManageSections, 
    onManageDiscounts, 
    onEditEvent, 
    onViewDetails,
    showBookButton = true, 
    showActions = false // Default to false
}) => {
    const eventDate = new Date(event.eventDate);
    const venue = event.venueName || event.customVenue || 'TBA';
    const now = new Date();
    const isPastEvent = eventDate < now;

    const availabilityPercent = event.totalSeats > 0 ? (event.availableSeats / event.totalSeats) * 100 : 0;
    const isLowAvailability = availabilityPercent > 0 && availabilityPercent < 20;

    const getEventCategory = () => {
        if (isPastEvent) return { label: 'Past', color: 'bg-muted text-muted-foreground' };
        if (event.status === 'SOLD_OUT') return { label: 'Sold Out', color: 'bg-destructive text-destructive-foreground' };
        return { label: format(eventDate, 'MMM d'), color: 'bg-primary text-primary-foreground' };
    };

    const category = getEventCategory();

    return (
        <div className="group bg-card rounded-xl border shadow-soft transition-all duration-300 hover:shadow-medium hover:-translate-y-1 flex flex-col h-full overflow-hidden">
            <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold font-poppins pr-4 line-clamp-2">{event.eventName}</h3>
                    <div className={`flex-shrink-0 ${category.color} px-3 py-1.5 rounded-md text-xs font-bold`}>
                        {category.label}
                    </div>
                </div>

                <div className="space-y-3 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span>{format(eventDate, 'EEEE, h:mm a')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="line-clamp-1">{venue}</span>
                    </div>
                </div>

                <div className="mt-auto">
                    <div className="flex items-center justify-between text-sm mb-4">
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-primary" />
                            <span>{event.availableSeats} / {event.totalSeats} seats</span>
                        </div>
                        {event.isFree && (
                            <div className="flex items-center gap-1 text-green-500 font-semibold">
                                <Tag className="w-4 h-4" />
                                <span>Free</span>
                            </div>
                        )}
                    </div>

                    {isLowAvailability && !isPastEvent && event.status !== 'SOLD_OUT' && (
                        <div className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 px-3 py-1.5 rounded-md text-xs font-bold mb-4 text-center">
                            Only {event.availableSeats} tickets left!
                        </div>
                    )}
                    
                    {showActions ? (
                        <div className="grid grid-cols-2 gap-2 mt-4">
                            {onEditEvent && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onEditEvent(); }}
                                    className="inline-flex items-center justify-center gap-2 px-3 py-2 border rounded-lg text-sm font-semibold hover:bg-secondary transition-colors"
                                >
                                    <Edit className="w-4 h-4" /> Edit
                                </button>
                            )}
                            {onManageSections && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onManageSections(); }}
                                    disabled={isPastEvent || event.status === 'COMPLETED' || event.status === 'CANCELLED'}
                                    className="inline-flex items-center justify-center gap-2 px-3 py-2 border rounded-lg text-sm font-semibold hover:bg-secondary transition-colors disabled:opacity-50"
                                >
                                    <LayoutList className="w-4 h-4" /> Sections
                                </button>
                            )}
                            {onManageDiscounts && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onManageDiscounts(); }}
                                    disabled={isPastEvent || event.status === 'COMPLETED' || event.status === 'CANCELLED'}
                                    className="inline-flex items-center justify-center gap-2 px-3 py-2 border rounded-lg text-sm font-semibold hover:bg-secondary transition-colors disabled:opacity-50"
                                >
                                    <Percent className="w-4 h-4" /> Discounts
                                </button>
                            )}
                            {onViewDetails && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onViewDetails(); }}
                                    className="inline-flex items-center justify-center gap-2 px-3 py-2 border rounded-lg text-sm font-semibold hover:bg-secondary transition-colors"
                                >
                                    <Info className="w-4 h-4" /> Details
                                </button>
                            )}
                        </div>
                    ) : (
                        showBookButton && (
                            isPastEvent ? (
                                <button
                                    disabled
                                    className="w-full inline-flex items-center justify-center gap-2 bg-muted text-muted-foreground px-4 py-2.5 rounded-lg font-semibold cursor-not-allowed"
                                >
                                    Event Ended
                                </button>
                            ) : (
                                <Link
                                    to={`/events/${event.id}`}
                                    className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                                >
                                    <Ticket className="w-4 h-4" />
                                    Book Now
                                </Link>
                            )
                        )
                    )}
                </div>
            </div>
        </div>
    );
};
