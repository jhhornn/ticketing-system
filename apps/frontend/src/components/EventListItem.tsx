import React from 'react';
import { format } from 'date-fns';
import { Calendar, MapPin, Users, Info, Tag, Edit, LayoutList, Percent } from 'lucide-react';

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
    onEditEvent?: () => void;
    onViewDetails?: () => void;
    showStats?: boolean;
}

export const EventListItem: React.FC<EventListItemProps> = ({ 
    event, 
    onManageSections, 
    onManageDiscounts,
    onEditEvent, 
    onViewDetails,
}) => {
    const eventDate = new Date(event.eventDate);
    const venue = event.venueName || event.customVenue || 'TBA';
    const now = new Date();
    const isPastEvent = eventDate < now;

    const getEventCategory = () => {
        if (isPastEvent) return { label: 'Past', color: 'bg-muted text-muted-foreground' };
        if (event.status === 'SOLD_OUT') return { label: 'Sold Out', color: 'bg-destructive text-destructive-foreground' };
        if (event.status === 'ON_SALE') return { label: 'On Sale', color: 'bg-green-500 text-white' };
        return { label: 'Upcoming', color: 'bg-primary text-primary-foreground' };
    };
    
    const category = getEventCategory();

    return (
        <div className={`max-w-4xl mx-auto bg-card rounded-xl border shadow-soft transition-all duration-300 hover:shadow-medium hover:-translate-y-1 ${isPastEvent ? 'opacity-70' : ''}`}>
            <div className="p-5">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xl font-bold font-poppins pr-4 line-clamp-2">{event.eventName}</h3>
                            <div className={`flex-shrink-0 ${category.color} px-3 py-1.5 rounded-md text-xs font-bold`}>
                                {category.label}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm text-muted-foreground mb-4">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-primary" />
                                <span>{format(eventDate, 'eee, MMM d, yyyy @ h:mm a')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-primary" />
                                <span className="line-clamp-1">{venue}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-primary" />
                                <span>{event.availableSeats} / {event.totalSeats} seats</span>
                            </div>
                            {event.hasActiveDiscounts && (
                                <div className="flex items-center gap-1 text-yellow-500 font-semibold">
                                    <Tag className="w-4 h-4" />
                                    <span>Discounts</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="sm:w-48 md:w-56 flex flex-col sm:items-end justify-between gap-2 sm:border-l sm:pl-4">
                        <div className="flex sm:flex-col gap-2 w-full">
                            {onViewDetails && (
                                <button
                                    onClick={onViewDetails}
                                    className="w-full text-sm inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                                >
                                    <Info className="w-4 h-4" />
                                    View Details
                                </button>
                            )}
                             <div className="grid grid-cols-3 gap-2">
                                {onEditEvent && (
                                    <button
                                        onClick={onEditEvent}
                                        className="inline-flex items-center justify-center p-2 border rounded-lg text-sm font-semibold hover:bg-secondary transition-colors"
                                        title="Edit event"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                )}
                                {onManageSections && (
                                    <button
                                        onClick={onManageSections}
                                        disabled={isPastEvent || event.status === 'COMPLETED' || event.status === 'CANCELLED'}
                                        className="inline-flex items-center justify-center p-2 border rounded-lg text-sm font-semibold hover:bg-secondary transition-colors disabled:opacity-50"
                                        title="Manage sections"
                                    >
                                        <LayoutList className="w-4 h-4" />
                                    </button>
                                )}
                                {onManageDiscounts && (
                                    <button
                                        onClick={onManageDiscounts}
                                        disabled={isPastEvent || event.status === 'COMPLETED' || event.status === 'CANCELLED'}
                                        className="inline-flex items-center justify-center p-2 border rounded-lg text-sm font-semibold hover:bg-secondary transition-colors disabled:opacity-50"
                                        title="Manage discounts"
                                    >
                                        <Percent className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
