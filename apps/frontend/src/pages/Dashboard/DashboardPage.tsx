import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { StatsService, type UserStats } from '../../services/stats';
import { EventsService, type Event } from '../../services/events';
import { BookingsService, type Booking } from '../../services/bookings';
import { 
  Calendar, 
  Ticket, 
  DollarSign,
  ArrowRight,
  Plus,
  BarChart3,
  CalendarCheck
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<UserStats | null>(null);
    const [myEvents, setMyEvents] = useState<Event[]>([]);
    const [myBookings, setMyBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const [statsData, eventsData, bookingsData] = await Promise.all([
                StatsService.getUserStats(),
                EventsService.getAll(true).catch(() => []), // My events
                BookingsService.getMyBookings().catch(() => []),
            ]);
            
            setStats(statsData);
            setMyEvents(eventsData.slice(0, 3)); // Show only 3 recent events
            setMyBookings(bookingsData.slice(0, 3)); // Show only 3 recent bookings
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[1, 2, 3, 4].map((n) => (
                        <div key={n} className="h-32 rounded-xl bg-muted animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    const statCards = [
        {
            title: 'My Events',
            value: stats?.totalEvents || 0,
            subtitle: `${stats?.activeEvents || 0} active`,
            icon: Calendar,
            color: 'text-blue-500',
            link: '/my-events',
        },
        {
            title: 'Event Bookings',
            value: stats?.totalBookings || 0,
            subtitle: 'For my events',
            icon: Ticket,
            color: 'text-green-500',
            link: '/my-events',
        },
        {
            title: 'Total Revenue',
            value: `$${(stats?.totalRevenue || 0).toLocaleString()}`,
            subtitle: 'From ticket sales',
            icon: DollarSign,
            color: 'text-purple-500',
            link: '/my-events',
        },
        {
            title: 'My Tickets',
            value: myBookings.length,
            subtitle: 'Purchased tickets',
            icon: CalendarCheck,
            color: 'text-orange-500',
            link: '/bookings',
        },
    ];

    return (
        <div className="animate-fade-in">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                <div>
                    <h1 className="text-4xl font-bold font-poppins mb-1">
                        Welcome, {user?.firstName || 'User'}!
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Here's your dashboard overview.
                    </p>
                </div>
                <Link
                    to="/my-events"
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold shadow-soft hover:bg-primary/90 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Create Event
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {statCards.map((card, index) => (
                    <Link
                        key={index}
                        to={card.link}
                        className="group bg-card rounded-xl border p-6 shadow-soft transition-all duration-300 hover:shadow-medium hover:-translate-y-1"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <card.icon className={`w-8 h-8 ${card.color}`} />
                            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground font-medium">{card.title}</p>
                            <h3 className="text-3xl font-bold my-1">{card.value}</h3>
                            <p className="text-xs text-muted-foreground">{card.subtitle}</p>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <Link to="/events" className="group bg-card rounded-xl border p-6 shadow-soft transition-all duration-300 hover:shadow-medium hover:border-primary">
                    <BarChart3 className="w-8 h-8 text-primary mb-4" />
                    <h3 className="font-semibold text-lg mb-1">Manage Events</h3>
                    <p className="text-sm text-muted-foreground mb-4">View and manage your created events and their sections.</p>
                    <span className="font-semibold text-primary text-sm flex items-center gap-1">
                        Go to My Events <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                </Link>
                <Link to="/bookings" className="group bg-card rounded-xl border p-6 shadow-soft transition-all duration-300 hover:shadow-medium hover:border-primary">
                    <Ticket className="w-8 h-8 text-primary mb-4" />
                    <h3 className="font-semibold text-lg mb-1">My Bookings</h3>
                    <p className="text-sm text-muted-foreground mb-4">Review all your purchased tickets and booking details.</p>
                    <span className="font-semibold text-primary text-sm flex items-center gap-1">
                        View My Bookings <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                </Link>
                <Link to="/events" className="group bg-card rounded-xl border p-6 shadow-soft transition-all duration-300 hover:shadow-medium hover:border-primary">
                    <Calendar className="w-8 h-8 text-primary mb-4" />
                    <h3 className="font-semibold text-lg mb-1">Browse Events</h3>
                    <p className="text-sm text-muted-foreground mb-4">Discover and book tickets for upcoming events.</p>
                    <span className="font-semibold text-primary text-sm flex items-center gap-1">
                        Find Events <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                </Link>
            </div>

            {/* Recent Events & Bookings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* My Recent Events */}
                <div className="bg-card rounded-xl border shadow-soft p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold font-poppins">Recent Events</h2>
                        <Link to="/my-events" className="text-primary hover:underline text-sm font-medium flex items-center gap-1">
                            View all <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    {myEvents.length > 0 ? (
                        <div className="space-y-4">
                            {myEvents.map((event) => (
                                <Link key={event.id} to={`/events/${event.id}`} className="group flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                                    <div className="bg-secondary p-3 rounded-lg">
                                        <Calendar className="w-6 h-6 text-secondary-foreground" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold truncate">{event.eventName}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(event.eventDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                                        </p>
                                    </div>
                                    <div className="text-sm font-semibold">
                                        {event.availableSeats} / {event.totalSeats}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg">
                            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No events found</h3>
                            <p className="text-muted-foreground mb-4 text-sm">Create your first event to see it here.</p>
                            <Link to="/my-events" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold text-sm">
                                <Plus className="w-4 h-4" /> Create Event
                            </Link>
                        </div>
                    )}
                </div>

                {/* My Recent Bookings */}
                <div className="bg-card rounded-xl border shadow-soft p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold font-poppins">Recent Bookings</h2>
                        <Link to="/bookings" className="text-primary hover:underline text-sm font-medium flex items-center gap-1">
                            View all <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    {myBookings.length > 0 ? (
                        <div className="space-y-4">
                            {myBookings.map((booking) => (
                                <div key={booking.bookingId} className="flex items-center gap-4 p-4 rounded-lg border">
                                    <div className="bg-secondary p-3 rounded-lg">
                                        <Ticket className="w-6 h-6 text-secondary-foreground" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold truncate">Booking #{booking.bookingReference}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(booking.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                                        </p>
                                    </div>
                                    <div className="text-sm font-semibold text-right">
                                        <p>${booking.totalAmount.toFixed(2)}</p>
                                        <p className={`text-xs font-medium mt-1 ${
                                            booking.status === 'CONFIRMED' ? 'text-green-500' : 'text-yellow-500'
                                        }`}>{booking.status}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg">
                            <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
                            <p className="text-muted-foreground mb-4 text-sm">Your recent bookings will appear here.</p>
                            <Link to="/events" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold text-sm">
                                Browse Events <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
