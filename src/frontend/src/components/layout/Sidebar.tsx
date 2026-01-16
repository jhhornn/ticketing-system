import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, Ticket, Building, MapPin, Cpu, Settings, LogOut, CalendarCheck } from 'lucide-react';
import styles from './Sidebar.module.css';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
    const { logout, user } = useAuth();

    return (
        <aside className={styles.sidebar}>
            <div className={styles.logo}>
                <Ticket size={24} />
                <span>Ticketing System</span>
            </div>

            <nav className={styles.nav}>
                <NavLink to="/dashboard" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                    <LayoutDashboard size={20} />
                    Dashboard
                </NavLink>
                <NavLink to="/events" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                    <Calendar size={20} />
                    Events
                </NavLink>
                <NavLink to="/my-events" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                    <CalendarCheck size={20} />
                    My Events
                </NavLink>
                <NavLink to="/bookings" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                    <Ticket size={20} />
                    My Bookings
                </NavLink>
                <NavLink to="/venues" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                    <MapPin size={20} />
                    Venues
                </NavLink>
                <NavLink to="/tenants" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                    <Building size={20} />
                    Tenants
                </NavLink>
                <NavLink to="/mcp" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                    <Cpu size={20} />
                    MCP Tools
                </NavLink>
                <NavLink to="/settings" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                    <Settings size={20} />
                    Settings
                </NavLink>
            </nav>

            <div className={styles.userProfile}>
                <div className={styles.avatar}>
                    {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div style={{ flex: 1, fontSize: '0.85rem' }}>
                    <div style={{ fontWeight: 600 }}>{user?.email || 'User'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{user?.role || 'Guest'}</div>
                </div>
                <button onClick={logout} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--muted-foreground)' }}>
                    <LogOut size={16} />
                </button>
            </div>
        </aside>
    );
};
