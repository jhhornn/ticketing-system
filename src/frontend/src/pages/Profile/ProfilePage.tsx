import React, { useState, useEffect } from 'react';
import { EventsService } from '../../services/events';
import { EventCard } from '../../components/EventCard';
import { Calendar, Plus, Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CreateEventModal } from '../../components/CreateEventModal';
import { useAuth } from '../../hooks/useAuth';

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
                ? 'border-primary text-primary bg-primary/10'
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
    const [bookedEvents, setBookedEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const { user } = useAuth(); // Use the actual auth context
    const navigate = useNavigate();

    const loadData = async () => {
        setLoading(true);
        try {
            const myEvents = await EventsService.getAll(true);
            setCreatedEvents(myEvents);

            // TODO: Fetch real bookings when BookingService is ready
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
        <div className="animate-fade-in">
            <div className="bg-card w-full rounded-xl border shadow-soft p-8 flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden mb-8">
                <div className="w-24 h-24 rounded-full bg-primary/10 text-primary flex items-center justify-center border-4 border-background shadow-xl z-10 text-4xl font-bold">
                    {user?.firstName?.[0]?.toUpperCase() || 'U'}
                </div>

                <div className="flex-1 text-center md:text-left z-10">
                    <h1 className="text-3xl font-bold font-poppins mb-1">{user?.firstName} {user?.lastName}</h1>
                    <p className="text-muted-foreground">{user?.email}</p>

                    <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-4">
                        <div className="bg-muted px-4 py-2 rounded-lg text-sm border">
                            <span className="font-bold text-foreground">{createdEvents.length}</span> Created Events
                        </div>
                        <div className="bg-muted px-4 py-2 rounded-lg text-sm border">
                            <span className="font-bold text-foreground">{bookedEvents.length}</span> Bookings
                        </div>
                    </div>
                </div>

                <div className="z-10">
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-semibold shadow-soft hover:bg-primary/90 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Create New Event
                    </button>
                </div>
            </div>

            <div>
                <div className="flex border-b border-border mb-6">
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

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(3)].map((_, n) => (
                            <div key={n} className="h-80 rounded-xl bg-muted animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div>
                        {activeTab === 'created' && (
                            createdEvents.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {createdEvents.map(event => (
                                        <EventCard key={event.id} event={event} showBookButton={false} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 bg-muted/30 rounded-xl border border-dashed border-border">
                                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-bold font-poppins">No events created yet</h3>
                                    <p className="text-muted-foreground mb-6">Start by organizing your first event!</p>
                                    <button
                                        onClick={() => setIsCreateModalOpen(true)}
                                        className="inline-flex items-center gap-2 text-primary hover:underline font-semibold"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Create an event now
                                    </button>
                                </div>
                            )
                        )}

                        {activeTab === 'bookings' && (
                            bookedEvents.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {/* Map booked events here */}
                                    <div className="p-4 bg-muted/30 rounded-xl border">Bookings implementation pending backend support</div>
                                </div>
                            ) : (
                                <div className="text-center py-16 bg-muted/30 rounded-xl border border-dashed border-border">
                                    <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-bold font-poppins">No active bookings</h3>
                                    <p className="text-muted-foreground mb-6">Explore events and book your first ticket.</p>
                                    <button
                                        onClick={() => navigate('/events')}
                                        className="inline-flex items-center gap-2 text-primary hover:underline font-semibold"
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