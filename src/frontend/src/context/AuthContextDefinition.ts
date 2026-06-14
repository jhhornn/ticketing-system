import { createContext } from 'react';

export interface User {
    id: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
}

export interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    isLoading: boolean;
    isSuperAdmin: () => boolean;
    isAdmin: () => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);