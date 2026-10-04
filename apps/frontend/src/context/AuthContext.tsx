import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { identifyUser, resetUser } from '../lib/analytics';
import { AuthContext, type AuthContextType, type User } from './AuthContextDefinition';

export type { User, AuthContextType };

const ACCESS_TOKEN_STORAGE_KEY = 'access_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY));
    const [isLoading, setIsLoading] = useState(true);

    const clearAuthState = () => {
        resetUser();
        localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
        setToken(null);
        setUser(null);
    };

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
                    clearAuthState();
                }
            }
            setIsLoading(false);
        };

        fetchProfile();
    }, [token]);

    // Link analytics to the logged-in user (covers login and page reloads)
    useEffect(() => {
        if (user) {
            identifyUser({ id: user.id, role: user.role });
        }
    }, [user]);

    const login = (newToken: string, newUser: User) => {
        localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, newToken);
        setToken(newToken);
        setUser(newUser);
    };

    const logout = () => {
        clearAuthState();
    };

    const isSuperAdmin = () => user?.role === 'SUPER_ADMIN';
    const isAdmin = () => user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isLoading, isSuperAdmin, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
}
