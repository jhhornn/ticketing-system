import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, Ticket, Building, MapPin, Cpu, Settings, LogOut, CalendarCheck, Menu, X, User } from 'lucide-react';
import styles from './Sidebar.module.css';
import { useAuth } from '../../context/AuthContext';

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
        { to: '/tenants', icon: Building, label: 'Tenants' },
        { to: '/mcp', icon: Cpu, label: 'MCP Tools' },
        { to: '/profile', icon: User, label: 'Profile' },
        { to: '/settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <>
            {/* Mobile Header with Hamburger */}
            <header className={styles.mobileHeader}>
                <div className={styles.mobileHeaderContent}>
                    <div className={styles.mobileLogo}>
                        <Ticket size={24} className="text-primary" />
                        <span className="font-bold text-lg">Ticketing</span>
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className={styles.hamburgerButton}
                        aria-label="Toggle menu"
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </header>

            {/* Overlay */}
            {isMobileMenuOpen && (
                <div
                    className={styles.overlay}
                    onClick={closeMobileMenu}
                />
            )}

            {/* Sidebar / Mobile Drawer */}
            <aside className={`${styles.sidebar} ${isMobileMenuOpen ? styles.mobileOpen : ''}`}>
                <div className={styles.sidebarContent}>
                    {/* Desktop Logo */}
                    <div className={styles.logo}>
                        <Ticket size={24} />
                        <span>Ticketing System</span>
                    </div>

                    {/* Navigation Links */}
                    <nav className={styles.nav}>
                        {navItems.map(({ to, icon: Icon, label }) => (
                            <NavLink
                                key={to}
                                to={to}
                                onClick={closeMobileMenu}
                                className={({ isActive }) =>
                                    `${styles.navItem} ${isActive ? styles.active : ''}`
                                }
                            >
                                <Icon size={20} />
                                <span>{label}</span>
                            </NavLink>
                        ))}
                    </nav>

                    {/* User Profile Section at Bottom */}
                    <div className={styles.userSection}>
                        <div className={styles.userProfile}>
                            <div className={styles.avatar}>
                                {user?.email?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className={styles.userInfo}>
                                <div className={styles.userName}>
                                    {user?.firstName && user?.lastName
                                        ? `${user.firstName} ${user.lastName}`
                                        : user?.email || 'User'}
                                </div>
                                <div className={styles.userRole}>{user?.role || 'Guest'}</div>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                logout();
                                closeMobileMenu();
                            }}
                            className={styles.logoutButton}
                            title="Logout"
                        >
                            <LogOut size={20} />
                            <span className={styles.logoutText}>Logout</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};
