import React, { useState, useEffect } from 'react';
import { EventsService } from '../../services/events';
import { EventCard } from '../../components/EventCard';
import { User, Calendar, Plus, Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CreateEventModal } from '../../components/CreateEventModal';

interface TabButtonProps {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
    icon: React.ElementType;
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, children, icon: Icon }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-6 py-3 rounded-t-lg font-medium transition-all duration-200 border-b-2 ${active
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
    >
        <Icon className="w-4 h-4" />
        {children}
    </button>
);

export const ProfilePage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'created' | 'bookings'>('created');
    const [createdEvents, setCreatedEvents] = useState<any[]>([]);
    const [bookedEvents, setBookedEvents] = useState<any[]>([]); // Placeholder for booked
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    // const { user } = useAuth(); // Assuming auth context exists
    const navigate = useNavigate();

    const user = { firstName: 'User', lastName: 'Name' }; // Fallback

    const loadData = async () => {
        setLoading(true);
        try {
            // 1. Fetch created events
            const myEvents = await EventsService.getAll(true); // Assuming API supports filter "onlyOwned=true" or similar, passing true to mapped service function
            setCreatedEvents(myEvents);

            // 2. Fetch bookings (Placeholder - needs BookingService)
            // const bookings = await BookingService.getMyBookings(); 
            setBookedEvents([]);
        } catch (e) {
            console.error("Failed to load profile data", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [activeTab]);

    return (
        <div className="container mx-auto py-8 animate-in fade-in duration-500 space-y-8">
            {/* Profile Header */}
            <div className="bg-card w-full rounded-2xl border shadow-sm p-8 flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden">
                {/* Background Decorative Gradient */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center border-4 border-background shadow-xl z-10">
                    <User className="w-10 h-10 text-muted-foreground" />
                </div>

                <div className="flex-1 text-center md:text-left z-10">
                    <h1 className="text-3xl font-bold tracking-tight mb-1">{user.firstName} {user.lastName}</h1>
                    <p className="text-muted-foreground">Manage your events and bookings</p>

                    <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-4">
                        <div className="bg-secondary/50 px-4 py-2 rounded-lg text-sm">
                            <span className="font-bold text-foreground">{createdEvents.length}</span> Created Events
                        </div>
                        <div className="bg-secondary/50 px-4 py-2 rounded-lg text-sm">
                            <span className="font-bold text-foreground">{bookedEvents.length}</span> Bookings
                        </div>
                    </div>
                </div>

                <div className="z-10">
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Create New Event
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div>
                <div className="flex border-b border-border/50 mb-6">
                    <TabButton
                        active={activeTab === 'created'}
                        onClick={() => setActiveTab('created')}
                        icon={Calendar}
                    >
                        Created Events
                    </TabButton>
                    <TabButton
                        active={activeTab === 'bookings'}
                        onClick={() => setActiveTab('bookings')}
                        icon={Ticket}
                    >
                        My Bookings
                    </TabButton>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3].map((n) => (
                            <div key={n} className="h-80 rounded-xl bg-muted animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="animate-in slide-in-from-bottom-4 duration-300">
                        {activeTab === 'created' && (
                            createdEvents.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {createdEvents.map(event => (
                                        <EventCard key={event.id} event={event} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 bg-muted/20 rounded-2xl border border-dashed border-border">
                                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                                    <h3 className="text-lg font-semibold">No events created yet</h3>
                                    <p className="text-muted-foreground mb-6">Start by organizing your first event!</p>
                                    <button
                                        onClick={() => setIsCreateModalOpen(true)}
                                        className="text-primary hover:underline font-medium"
                                    >
                                        Create an event now
                                    </button>
                                </div>
                            )
                        )}

                        {activeTab === 'bookings' && (
                            bookedEvents.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {/* Map booked events here */}
                                    <div className="p-4 bg-muted rounded">Bookings implementation pending backend support</div>
                                </div>
                            ) : (
                                <div className="text-center py-16 bg-muted/20 rounded-2xl border border-dashed border-border">
                                    <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                                    <h3 className="text-lg font-semibold">No active bookings</h3>
                                    <p className="text-muted-foreground mb-6">Explore events and book your first ticket.</p>
                                    <button
                                        onClick={() => navigate('/events')}
                                        className="text-primary hover:underline font-medium"
                                    >
                                        Browse Events
                                    </button>
                                </div>
                            )
                        )}
                    </div>
                )}
            </div>

            <CreateEventModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={loadData}
            />
        </div>
    );
};
