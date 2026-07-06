import React, { useState, useEffect, useMemo } from 'react';
import { EventsService, type Event } from '../../services/events';
import { EventCard } from '../../components/EventCard';
import { EventListItem } from '../../components/EventListItem';
import { EventSectionsModal } from '../../components/EventSectionsModal';
import { DiscountManagementModal } from '../../components/DiscountManagementModal';
import { CreateEventModal } from '../../components/CreateEventModal';
import { EditEventModal } from '../../components/EditEventModal';
import { EventDetailsModal } from '../../components/EventDetailsModal';
import { Search, Calendar, Plus, Archive, Grid3x3, List } from 'lucide-react';

export const MyEventsPage: React.FC = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
        return (localStorage.getItem('eventsViewMode') as 'grid' | 'list') || 'grid';
    });
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editModalEvent, setEditModalEvent] = useState<Event | null>(null);
    const [sectionsModalState, setSectionsModalState] = useState<{
        isOpen: boolean;
        eventId: number | null;
        eventName: string;
    }>({ isOpen: false, eventId: null, eventName: '' });
    const [discountsModalState, setDiscountsModalState] = useState<{
        isOpen: boolean;
        eventId: number | null;
        eventName: string;
    }>({ isOpen: false, eventId: null, eventName: '' });
    const [detailsModalEvent, setDetailsModalEvent] = useState<Event | null>(null);

    const loadMyEvents = async () => {
        try {
            setLoading(true);
            const data = await EventsService.getAll(true);
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

    const { currentEvents, pastEvents } = useMemo(() => {
        const now = new Date();
        const current: Event[] = [];
        const past: Event[] = [];

        filteredEvents.forEach(event => {
            const eventDate = new Date(event.eventDate);
            if (eventDate >= now && event.status !== 'COMPLETED' && event.status !== 'CANCELLED') {
                current.push(event);
            } else {
                past.push(event);
            }
        });

        return { currentEvents: current, pastEvents: past };
    }, [filteredEvents]);

    const toggleViewMode = (mode: 'grid' | 'list') => {
        setViewMode(mode);
        localStorage.setItem('eventsViewMode', mode);
    };

    return (
        <div className="animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                <div>
                    <h1 className="text-4xl font-bold font-poppins mb-2">My Events</h1>
                    <p className="text-muted-foreground text-lg">Manage your created events and their details.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold shadow-soft hover:bg-primary/90 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Create New Event
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-xl border shadow-sm mb-8">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search my events..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-input border rounded-lg focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground"
                    />
                </div>

                <div className="flex gap-2 p-1 rounded-lg bg-muted">
                    <button
                        onClick={() => toggleViewMode('grid')}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${viewMode === 'grid'
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-muted-foreground hover:bg-background/50'
                            }`}
                    >
                        <Grid3x3 className="w-4 h-4" />
                        <span className="hidden sm:inline">Grid</span>
                    </button>
                    <button
                        onClick={() => toggleViewMode('list')}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${viewMode === 'list'
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-muted-foreground hover:bg-background/50'
                            }`}
                    >
                        <List className="w-4 h-4" />
                        <span className="hidden sm:inline">List</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(viewMode === 'grid' ? 8 : 4)].map((_, i) => (
                        <div key={i} className={`${viewMode === 'grid' ? 'h-96' : 'h-32'} rounded-xl bg-muted animate-pulse`} />
                    ))}
                </div>
            ) : filteredEvents.length > 0 ? (
                <div className="space-y-10">
                    {currentEvents.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-6">
                                <Calendar className="w-6 h-6 text-primary" />
                                <h2 className="text-2xl font-bold font-poppins">Current & Upcoming Events</h2>
                                <span className="ml-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                                    {currentEvents.length}
                                </span>
                            </div>
                            {viewMode === 'grid' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {currentEvents.map((event) => (
                                        <EventCard
                                            key={event.id}
                                            event={event}
                                            showBookButton={false}
                                            showActions={true}
                                            onEditEvent={() => setEditModalEvent(event)}
                                            onManageSections={() => setSectionsModalState({ isOpen: true, eventId: event.id, eventName: event.eventName })}
                                            onManageDiscounts={() => setDiscountsModalState({ isOpen: true, eventId: event.id, eventName: event.eventName })}
                                            onViewDetails={() => setDetailsModalEvent(event)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {currentEvents.map((event) => (
                                        <EventListItem
                                            key={event.id}
                                            event={event}
                                            onEditEvent={() => setEditModalEvent(event)}
                                            onManageSections={() => setSectionsModalState({ isOpen: true, eventId: event.id, eventName: event.eventName })}
                                            onManageDiscounts={() => setDiscountsModalState({ isOpen: true, eventId: event.id, eventName: event.eventName })}
                                            onViewDetails={() => setDetailsModalEvent(event)}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>
                    )}

                    {pastEvents.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-6 pt-8 border-t">
                                <Archive className="w-6 h-6 text-muted-foreground" />
                                <h2 className="text-2xl font-bold font-poppins text-muted-foreground">Past Events</h2>
                                <span className="ml-2 px-3 py-1 bg-muted rounded-full text-sm font-semibold">
                                    {pastEvents.length}
                                </span>
                            </div>
                            {viewMode === 'grid' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 opacity-70">
                                    {pastEvents.map((event) => (
                                        <EventCard
                                            key={event.id}
                                            event={event}
                                            showBookButton={false}
                                            showActions={true}
                                            onEditEvent={() => setEditModalEvent(event)}
                                            onManageSections={() => setSectionsModalState({ isOpen: true, eventId: event.id, eventName: event.eventName })}
                                            onManageDiscounts={() => setDiscountsModalState({ isOpen: true, eventId: event.id, eventName: event.eventName })}
                                            onViewDetails={() => setDetailsModalEvent(event)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4 opacity-70">
                                    {pastEvents.map((event) => (
                                        <EventListItem
                                            key={event.id}
                                            event={event}
                                            onEditEvent={() => setEditModalEvent(event)}
                                            onManageSections={() => setSectionsModalState({ isOpen: true, eventId: event.id, eventName: event.eventName })}
                                            onManageDiscounts={() => setDiscountsModalState({ isOpen: true, eventId: event.id, eventName: event.eventName })}
                                            onViewDetails={() => setDetailsModalEvent(event)}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>
                    )}
                </div>
            ) : (
                <div className="text-center py-20 border-2 border-dashed rounded-lg">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-bold font-poppins mb-2">No Events Created Yet</h3>
                    <p className="text-muted-foreground max-w-md mx-auto mb-4">
                        Start by creating your first event and manage all its details here.
                    </p>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-semibold hover:bg-primary/90 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        Create Event
                    </button>
                </div>
            )}

            {sectionsModalState.isOpen && sectionsModalState.eventId && (
                <EventSectionsModal
                    isOpen={sectionsModalState.isOpen}
                    eventId={sectionsModalState.eventId}
                    eventName={sectionsModalState.eventName}
                    onClose={() => {
                        setSectionsModalState({ isOpen: false, eventId: null, eventName: '' });
                        loadMyEvents();
                    }}
                />
            )}

            {discountsModalState.isOpen && discountsModalState.eventId && (
                <DiscountManagementModal
                    isOpen={discountsModalState.isOpen}
                    eventId={discountsModalState.eventId}
                    eventName={discountsModalState.eventName}
                    onClose={() => {
                        setDiscountsModalState({ isOpen: false, eventId: null, eventName: '' });
                        loadMyEvents();
                    }}
                />
            )}

            {detailsModalEvent && (
                <EventDetailsModal
                    isOpen={true}
                    event={detailsModalEvent}
                    onClose={() => setDetailsModalEvent(null)}
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

            <EditEventModal
                isOpen={!!editModalEvent}
                event={editModalEvent}
                onClose={() => setEditModalEvent(null)}
                onSuccess={() => {
                    setEditModalEvent(null);
                    loadMyEvents();
                }}
            />
        </div>
    );
};