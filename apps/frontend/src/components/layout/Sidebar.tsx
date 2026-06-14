import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, Ticket, MapPin, Cpu, Settings, LogOut, CalendarCheck, Menu, X, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const Sidebar: React.FC = () => {
    const { logout, user } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    const navItems = [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/events', icon: Calendar, label: 'Events' },
        { to: '/my-events', icon: CalendarCheck, label: 'My Events' },
        { to: '/bookings', icon: Ticket, label: 'My Bookings' },
        { to: '/venues', icon: MapPin, label: 'Venues' },
        { to: '/mcp', icon: Cpu, label: 'MCP Tools' },
        { to: '/profile', icon: User, label: 'Profile' },
        { to: '/settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <>
            {/* Mobile Header */}
            <header className="md:hidden flex justify-between items-center p-4 border-b">
                <div className="flex items-center gap-2">
                    <Ticket size={24} className="text-primary" />
                    <span className="font-bold text-lg font-poppins">Ticketing</span>
                </div>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 rounded-md hover:bg-secondary"
                    aria-label="Toggle menu"
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </header>

            {/* Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-30 md:hidden"
                    onClick={closeMobileMenu}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full w-64 bg-card border-r transform ${
                    isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                } md:relative md:translate-x-0 transition-transform duration-300 ease-in-out z-40 flex flex-col`}
            >
                <div className="flex items-center justify-center h-20 border-b">
                    <Ticket size={28} className="text-primary" />
                    <span className="ml-2 text-2xl font-bold font-poppins">Ticketing</span>
                </div>
                <nav className="flex-1 px-4 py-6 space-y-2">
                    {navItems.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            onClick={closeMobileMenu}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-base font-medium ${
                                    isActive
                                        ? 'bg-primary text-primary-foreground'
                                        : 'hover:bg-secondary'
                                }`
                            }
                        >
                            <Icon size={22} />
                            <span>{label}</span>
                        </NavLink>
                    ))}
                </nav>
                <div className="p-4 border-t">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                            {user?.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1">
                            <div className="font-semibold text-sm">
                                {user?.firstName && user?.lastName
                                    ? `${user.firstName} ${user.lastName}`
                                    : user?.email || 'User'}
                            </div>
                            <div className="text-xs text-muted-foreground">{user?.role || 'Guest'}</div>
                        </div>
                        <button
                            onClick={() => {
                                logout();
                                closeMobileMenu();
                            }}
                            className="p-2 rounded-md hover:bg-secondary"
                            title="Logout"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};
