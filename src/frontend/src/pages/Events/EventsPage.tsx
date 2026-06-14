import React, { useState, useEffect } from 'react';
import { EventsService, type Event } from '../../services/events';
import { EventCard } from '../../components/EventCard';
import { Search } from 'lucide-react';

type EventCategory = 'all' | 'on-sale' | 'upcoming' | 'past' | 'free';
type SortOption = 'date-asc' | 'date-desc' | 'name';

const categorizeEvent = (event: Event): 'past' | 'on-sale' | 'upcoming' => {
    const now = new Date();
    const eventDate = new Date(event.eventDate);
    const saleStartTime = event.saleStartTime ? new Date(event.saleStartTime) : null;

    if (eventDate < now) return 'past';
    if (saleStartTime && saleStartTime <= now && eventDate >= now) return 'on-sale';
    return 'upcoming';
};

export const EventsPage: React.FC = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<EventCategory>('all');
    const [sortBy, setSortBy] = useState<SortOption>('date-asc');

    const loadEvents = async () => {
        try {
            setLoading(true);
            const data = await EventsService.getAll();
            setEvents(data.map(event => ({ ...event, isPopular: (event.totalSeats - event.availableSeats) / event.totalSeats > 0.5 })));
        } catch (error) {
            console.error("Failed to load events", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEvents();
    }, []);

    const filteredAndSortedEvents = React.useMemo(() => {
        return events
            .filter(event => {
                const matchesSearch = !searchQuery ||
                    event.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (event.venueName && event.venueName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                    (event.customVenue && event.customVenue.toLowerCase().includes(searchQuery.toLowerCase()));

                if (!matchesSearch) return false;

                if (selectedCategory === 'free') return event.isFree;
                if (selectedCategory !== 'all' && categorizeEvent(event) !== selectedCategory) return false;

                return true;
            })
            .sort((a, b) => {
                if (selectedCategory === 'all') {
                    const priority = { 'on-sale': 0, 'upcoming': 1, 'past': 2 };
                    const diff = priority[categorizeEvent(a)] - priority[categorizeEvent(b)];
                    if (diff !== 0) return diff;
                }
                switch (sortBy) {
                    case 'date-desc': return new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime();
                    case 'name': return a.eventName.localeCompare(b.eventName);
                    default: return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
                }
            });
    }, [events, searchQuery, selectedCategory, sortBy]);

    const eventCounts = React.useMemo(() => ({
        all: events.length,
        'on-sale': events.filter(e => categorizeEvent(e) === 'on-sale').length,
        upcoming: events.filter(e => categorizeEvent(e) === 'upcoming').length,
        past: events.filter(e => categorizeEvent(e) === 'past').length,
        free: events.filter(e => e.isFree).length,
    }), [events]);

    return (
        <div className="animate-fade-in">
            <div className="bg-card border-b mb-10">
                <div className="container mx-auto py-12 text-center">
                    <h1 className="text-5xl font-bold font-poppins mb-4">Find Your Next Experience</h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
                        From concerts to sports, discover and book tickets for the best events.
                    </p>
                    <div className="w-full max-w-xl mx-auto relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by event, artist, or venue..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-input rounded-lg border focus:ring-primary focus:border-primary transition-all"
                        />
                    </div>
                </div>
            </div>

            <div className="container mx-auto space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex flex-wrap items-center gap-2">
                        {['all', 'on-sale', 'upcoming', 'free'].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat as EventCategory)}
                                className={`px-4 py-2 rounded-md font-semibold text-sm transition-colors ${selectedCategory === cat
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                    }`}
                            >
                                {cat.replace('-', ' ')}
                                <span className="ml-2 opacity-70">{eventCounts[cat as keyof typeof eventCounts]}</span>
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold text-muted-foreground">Sort by:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="bg-input border-border rounded-md px-3 py-1.5 font-semibold focus:ring-primary focus:border-primary"
                        >
                            <option value="date-asc">Date (Soonest)</option>
                            <option value="date-desc">Date (Latest)</option>
                            <option value="name">Name (A-Z)</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => <div key={i} className="h-96 rounded-xl bg-muted animate-pulse" />)}
                    </div>
                ) : filteredAndSortedEvents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredAndSortedEvents.map((event) => <EventCard key={event.id} event={event} />)}
                    </div>
                ) : (
                    <div className="text-center py-20 border-2 border-dashed rounded-lg">
                        <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-bold font-poppins mb-2">No Events Found</h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            Try adjusting your filters or search query.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
