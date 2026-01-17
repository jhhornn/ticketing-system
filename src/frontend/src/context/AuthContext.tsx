import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

interface User {
    id: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    isLoading: boolean;
    isSuperAdmin: () => boolean;
    isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'));
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Fetch user profile if token exists
        const fetchProfile = async () => {
            if (token) {
                try {
                    const response = await api.get<{ success: boolean; data: User }>('/auth/profile');
                    setUser(response.data.data);
                } catch (error) {
                    console.error('Failed to fetch profile:', error);
                    // Token is invalid, clear it
                    localStorage.removeItem('access_token');
                    setToken(null);
                }
            }
            setIsLoading(false);
        };
        
        fetchProfile();
    }, [token]);

    const login = (newToken: string, newUser: User) => {
        localStorage.setItem('access_token', newToken);
        setToken(newToken);
        setUser(newUser);
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        setToken(null);
        setUser(null);
    };

    const isSuperAdmin = () => user?.role === 'SUPER_ADMIN';
    const isAdmin = () => user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isLoading, isSuperAdmin, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
