import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { StatsService, type UserStats } from '../../services/stats';
import { EventsService, type Event } from '../../services/events';
import { BookingsService, type Booking } from '../../services/bookings';
import { 
  Calendar, 
  Ticket, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Users,
  ArrowRight,
  Plus,
  BarChart3,
  CalendarCheck,
  AlertCircle
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
            color: 'bg-blue-500',
            link: '/my-events',
        },
        {
            title: 'Total Bookings',
            value: stats?.totalBookings || 0,
            subtitle: 'Confirmed bookings',
            icon: Ticket,
            color: 'bg-green-500',
            link: '/bookings',
        },
        {
            title: 'Total Revenue',
            value: `$${(stats?.totalRevenue || 0).toLocaleString()}`,
            subtitle: 'From ticket sales',
            icon: DollarSign,
            color: 'bg-purple-500',
            link: '/my-events',
        },
        {
            title: 'My Tickets',
            value: myBookings.length,
            subtitle: 'Purchased tickets',
            icon: CalendarCheck,
            color: 'bg-orange-500',
            link: '/bookings',
        },
    ];

    return (
        <div className="container mx-auto py-8 space-y-8 animate-in fade-in duration-500">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-2">
                        Welcome back, {user?.firstName || 'User'}! 👋
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Here's what's happening with your events and bookings
                    </p>
                </div>
                <Link
                    to="/my-events"
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                    <Plus className="w-5 h-5" />
                    Create Event
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card, index) => (
                    <Link
                        key={index}
                        to={card.link}
                        className="group relative overflow-hidden bg-card rounded-xl border shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-105"
                    >
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`${card.color} p-3 rounded-lg text-white`}>
                                    <card.icon className="w-6 h-6" />
                                </div>
                                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                            </div>
                            <h3 className="text-2xl font-bold mb-1">{card.value}</h3>
                            <p className="text-sm text-muted-foreground font-medium">{card.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 to-primary transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                    </Link>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link
                    to="/events"
                    className="group bg-card rounded-xl border shadow-sm hover:shadow-lg transition-all duration-300 p-6 hover:border-primary"
                >
                    <div className="flex items-start gap-4">
                        <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-lg">
                            <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                                Browse Events
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Discover and book tickets for upcoming events
                            </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                </Link>

                <Link
                    to="/my-events"
                    className="group bg-card rounded-xl border shadow-sm hover:shadow-lg transition-all duration-300 p-6 hover:border-primary"
                >
                    <div className="flex items-start gap-4">
                        <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-lg">
                            <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                                Manage Events
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                View and manage your created events
                            </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                </Link>

                <Link
                    to="/bookings"
                    className="group bg-card rounded-xl border shadow-sm hover:shadow-lg transition-all duration-300 p-6 hover:border-primary"
                >
                    <div className="flex items-start gap-4">
                        <div className="bg-purple-100 dark:bg-purple-900/20 p-3 rounded-lg">
                            <Ticket className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                                My Bookings
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                View your purchased tickets and bookings
                            </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                </Link>
            </div>

            {/* Recent Events & Bookings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* My Recent Events */}
                <div className="bg-card rounded-xl border shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold">My Recent Events</h2>
                        <Link
                            to="/my-events"
                            className="text-primary hover:underline text-sm font-medium flex items-center gap-1"
                        >
                            View all
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    {myEvents.length > 0 ? (
                        <div className="space-y-4">
                            {myEvents.map((event) => (
                                <Link
                                    key={event.id}
                                    to={`/events/${event.id}`}
                                    className="group flex items-start gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors border"
                                >
                                    <div className="bg-primary/10 p-3 rounded-lg flex-shrink-0">
                                        <Calendar className="w-6 h-6 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors truncate">
                                            {event.eventName}
                                        </h3>
                                        <p className="text-sm text-muted-foreground mb-2">
                                            {new Date(event.eventDate).toLocaleDateString('en-US', {
                                                weekday: 'short',
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </p>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Users className="w-3 h-3" />
                                                {event.availableSeats}/{event.totalSeats} available
                                            </span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                event.status === 'ON_SALE' 
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                                    : event.status === 'SOLD_OUT'
                                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                                    : event.status === 'CANCELLED'
                                                    ? 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
                                                    : event.status === 'COMPLETED'
                                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
                                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                                            }`}>
                                                {event.status === 'ON_SALE' ? 'On Sale' : 
                                                 event.status === 'SOLD_OUT' ? 'Sold Out' :
                                                 event.status === 'CANCELLED' ? 'Cancelled' :
                                                 event.status === 'COMPLETED' ? 'Completed' :
                                                 event.status === 'UPCOMING' ? 'Upcoming' : event.status}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                            <p className="text-muted-foreground mb-4">No events created yet</p>
                            <Link
                                to="/my-events"
                                className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
                            >
                                <Plus className="w-4 h-4" />
                                Create your first event
                            </Link>
                        </div>
                    )}
                </div>

                {/* My Recent Bookings */}
                <div className="bg-card rounded-xl border shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold">My Recent Bookings</h2>
                        <Link
                            to="/bookings"
                            className="text-primary hover:underline text-sm font-medium flex items-center gap-1"
                        >
                            View all
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    {myBookings.length > 0 ? (
                        <div className="space-y-4">
                            {myBookings.map((booking) => (
                                <div
                                    key={booking.bookingId}
                                    className="group flex items-start gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors border"
                                >
                                    <div className="bg-purple-100 dark:bg-purple-900/20 p-3 rounded-lg flex-shrink-0">
                                        <Ticket className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold mb-1 truncate">
                                            Booking #{booking.bookingReference}
                                        </h3>
                                        <p className="text-sm text-muted-foreground mb-2">
                                            {new Date(booking.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </p>
                                        <div className="flex items-center gap-4 text-xs">
                                            <span className="font-semibold text-primary">
                                                ${booking.totalAmount.toFixed(2)}
                                            </span>
                                            <span className={`px-2 py-1 rounded-full ${
                                                booking.status === 'CONFIRMED' 
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                                    : booking.status === 'PENDING'
                                                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                                                    : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                            }`}>
                                                {booking.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                            <p className="text-muted-foreground mb-4">No bookings yet</p>
                            <Link
                                to="/events"
                                className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
                            >
                                Browse events
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Tips Section */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl border border-blue-200 dark:border-blue-900 p-6">
                <div className="flex items-start gap-4">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg flex-shrink-0">
                        <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg mb-2">Quick Tips</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>Create events and manage seat sections from "My Events" page</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>Track your ticket sales and revenue in real-time</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>Book tickets for events created by other users from "Browse Events"</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};
