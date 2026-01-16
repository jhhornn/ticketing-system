import React, { useState, useEffect } from 'react';
import { EventsService, type Event } from '../../services/events';
import { EventCard } from '../../components/EventCard';
import { Search, Filter, X } from 'lucide-react';

type EventCategory = 'all' | 'on-sale' | 'upcoming' | 'past' | 'free';
type SortOption = 'date-asc' | 'date-desc' | 'price-asc' | 'price-desc' | 'name';

// Utility function to categorize events
const categorizeEvent = (event: Event): 'past' | 'on-sale' | 'upcoming' => {
  const now = new Date();
  const eventDate = new Date(event.eventDate);
  const saleStartTime = event.saleStartTime ? new Date(event.saleStartTime) : null;
  
  // Past event
  if (eventDate < now) {
    return 'past';
  }
  
  // On sale (sale has started and event hasn't occurred)
  if (saleStartTime && saleStartTime <= now && eventDate >= now) {
    return 'on-sale';
  }
  
  // Upcoming (sale hasn't started yet or no sale date set but event is in future)
  return 'upcoming';
};

// Format status for display
const formatStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'ON_SALE': 'On Sale',
    'UPCOMING': 'Upcoming',
    'SOLD_OUT': 'Sold Out',
    'CANCELLED': 'Cancelled',
    'COMPLETED': 'Completed',
  };
  return statusMap[status] || status;
};

export const EventsPage: React.FC = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<EventCategory>('all');
    const [sortBy, setSortBy] = useState<SortOption>('date-asc');
    const [showFilters, setShowFilters] = useState(false);

    const loadEvents = async () => {
        try {
            setLoading(true);
            const data = await EventsService.getAll();
            setEvents(data);
        } catch (error) {
            console.error("Failed to load events", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEvents();
    }, []);

    // Filter and sort events
    const filteredAndSortedEvents = React.useMemo(() => {
        const filtered = events.filter(event => {
            // Search filter
            const matchesSearch = !searchQuery || 
                event.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (event.venueName && event.venueName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (event.customVenue && event.customVenue.toLowerCase().includes(searchQuery.toLowerCase()));
            
            if (!matchesSearch) return false;

            // Category filter
            const category = categorizeEvent(event);
            if (selectedCategory === 'free') {
                return event.isFree;
            }
            if (selectedCategory !== 'all' && category !== selectedCategory) {
                return false;
            }

            return true;
        });

        // Sort events
        filtered.sort((a, b) => {
            // Priority: On Sale > Upcoming > Past (when "all" is selected)
            if (selectedCategory === 'all') {
                const catA = categorizeEvent(a);
                const catB = categorizeEvent(b);
                const priority = { 'on-sale': 0, 'upcoming': 1, 'past': 2 };
                if (priority[catA] !== priority[catB]) {
                    return priority[catA] - priority[catB];
                }
            }

            // Then apply selected sort
            switch (sortBy) {
                case 'date-asc':
                    return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
                case 'date-desc':
                    return new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime();
                case 'name':
                    return a.eventName.localeCompare(b.eventName);
                default:
                    return 0;
            }
        });

        return filtered;
    }, [events, searchQuery, selectedCategory, sortBy]);

    // Count events by category
    const eventCounts = React.useMemo(() => {
        return {
            all: events.length,
            'on-sale': events.filter(e => categorizeEvent(e) === 'on-sale').length,
            upcoming: events.filter(e => categorizeEvent(e) === 'upcoming').length,
            past: events.filter(e => categorizeEvent(e) === 'past').length,
            free: events.filter(e => e.isFree).length,
        };
    }, [events]);

    return (
        <div className="container mx-auto py-8 space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-2">
                        Upcoming Events
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Discover and book tickets for the hottest events in town.
                    </p>
                </div>
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2">
                {[
                    { key: 'all', label: 'All Events', count: eventCounts.all },
                    { key: 'on-sale', label: 'On Sale', count: eventCounts['on-sale'] },
                    { key: 'upcoming', label: 'Upcoming', count: eventCounts.upcoming },
                    { key: 'past', label: 'Past Events', count: eventCounts.past },
                    { key: 'free', label: 'Free', count: eventCounts.free },
                ].map((category) => (
                    <button
                        key={category.key}
                        onClick={() => setSelectedCategory(category.key as EventCategory)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            selectedCategory === category.key
                                ? 'bg-primary text-primary-foreground shadow-md'
                                : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
                        }`}
                    >
                        {category.label} ({category.count})
                    </button>
                ))}
            </div>

            {/* Search and Filter Bar */}
            <div className="flex flex-col gap-4 bg-card p-4 rounded-xl border shadow-sm">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search events, venues..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-secondary/50 border-transparent focus:border-primary focus:ring-2 focus:ring-ring rounded-lg outline-none transition-all placeholder:text-muted-foreground font-medium"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="px-4 py-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg font-medium transition-colors outline-none cursor-pointer"
                        >
                            <option value="date-asc">Date (Soonest)</option>
                            <option value="date-desc">Date (Latest)</option>
                            <option value="name">Name (A-Z)</option>
                        </select>
                        <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                                showFilters 
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
                            }`}
                        >
                            <Filter className="w-5 h-5" />
                            {showFilters ? 'Hide' : 'Show'} Filters
                        </button>
                    </div>
                </div>

                {/* Active Filters Display */}
                {(searchQuery || selectedCategory !== 'all') && (
                    <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-sm text-muted-foreground">Active filters:</span>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium hover:bg-primary/20 transition-colors"
                            >
                                Search: "{searchQuery}"
                                <X className="w-3 h-3" />
                            </button>
                        )}
                        {selectedCategory !== 'all' && (
                            <button
                                onClick={() => setSelectedCategory('all')}
                                className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium hover:bg-primary/20 transition-colors"
                            >
                                Category: {selectedCategory}
                                <X className="w-3 h-3" />
                            </button>
                        )}
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setSelectedCategory('all');
                            }}
                            className="text-sm text-muted-foreground hover:text-foreground underline"
                        >
                            Clear all
                        </button>
                    </div>
                )}
            </div>

            {/* Results Count */}
            {!loading && (
                <div className="flex items-center justify-between">
                    <p className="text-muted-foreground">
                        Showing <span className="font-semibold text-foreground">{filteredAndSortedEvents.length}</span> event{filteredAndSortedEvents.length !== 1 ? 's' : ''}
                    </p>
                </div>
            )}

            {/* Events Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                        <div key={n} className="h-96 rounded-xl bg-muted animate-pulse" />
                    ))}
                </div>
            ) : filteredAndSortedEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredAndSortedEvents.map((event) => (
                        <EventCard key={event.id} event={event} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                        <Search className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">No events found</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        We couldn't find any events matching your search. Try adjusting your keywords or create a new event.
                    </p>
                </div>
            )}
        </div>
    );
};
