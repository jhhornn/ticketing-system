import React, { useState, useEffect } from 'react';
import { EventsService, type Event } from '../../services/events';
import { EventCard } from '../../components/EventCard';
import { EventSectionsModal } from '../../components/EventSectionsModal';
import { CreateEventModal } from '../../components/CreateEventModal';
import { Search, Calendar, Plus } from 'lucide-react';

export const MyEventsPage: React.FC = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [sectionsModalState, setSectionsModalState] = useState<{
        isOpen: boolean;
        eventId: number | null;
        eventName: string;
    }>({ isOpen: false, eventId: null, eventName: '' });

    const loadMyEvents = async () => {
        try {
            setLoading(true);
            const data = await EventsService.getAll(true); // Only owned events
            setEvents(data);
        } catch (error) {
            console.error("Failed to load my events", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMyEvents();
    }, []);

    const filteredEvents = events.filter(event =>
        event.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.venueName && event.venueName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (event.customVenue && event.customVenue.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="container mx-auto py-8 space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-2">
                        My Events
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Manage your events and ticket sections
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                    <Plus className="w-5 h-5" />
                    Create Event
                </button>
            </div>

            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-xl border shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search my events..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-secondary/50 border-transparent focus:border-primary focus:ring-2 focus:ring-ring rounded-lg outline-none transition-all placeholder:text-muted-foreground font-medium"
                    />
                </div>
            </div>

            {/* Events Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((n) => (
                        <div key={n} className="h-96 rounded-xl bg-muted animate-pulse" />
                    ))}
                </div>
            ) : filteredEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredEvents.map((event) => (
                        <EventCard
                            key={event.id}
                            event={event}
                            showBookButton={false}
                            onManageSections={() => {
                                setSectionsModalState({
                                    isOpen: true,
                                    eventId: event.id,
                                    eventName: event.eventName,
                                });
                            }}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                        <Calendar className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">No events yet</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        You haven't created any events yet. Create your first event to get started!
                    </p>
                </div>
            )}

            {sectionsModalState.isOpen && sectionsModalState.eventId && (
                <EventSectionsModal
                    isOpen={sectionsModalState.isOpen}
                    eventId={sectionsModalState.eventId}
                    eventName={sectionsModalState.eventName}
                    onClose={() => {
                        setSectionsModalState({ isOpen: false, eventId: null, eventName: '' });
                    }}
                />
            )}

            <CreateEventModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    setIsCreateModalOpen(false);
                    loadMyEvents();
                }}
            />
        </div>
    );
};
