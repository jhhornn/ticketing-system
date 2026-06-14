import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { Ticket } from 'lucide-react';

export const LoginPage: React.FC = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post<{ success: boolean; data: { accessToken: string; user: any } }>('/auth/login', { email, password });
            const { accessToken, user } = response.data.data;
            
            login(accessToken, user);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
            <div className="w-full max-w-md">
                <div className="flex justify-center mb-8">
                    <Ticket size={48} className="text-primary" />
                </div>
                <div className="bg-card p-8 rounded-xl shadow-soft">
                    <h1 className="text-3xl font-bold text-center mb-2 font-poppins">Welcome Back</h1>
                    <p className="text-muted-foreground text-center mb-8">Login to continue</p>
                    
                    {error && (
                        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-4 mb-6">
                            {error}
                        </div>
                    )}
                    
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium">Email</label>
                            <input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-input rounded-lg border focus:ring-primary focus:border-primary transition-all"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <label htmlFor="password-login" className="text-sm font-medium">Password</label>
                            <input
                                id="password-login"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full px-4 py-3 bg-input rounded-lg border focus:ring-primary focus:border-primary transition-all"
                            />
                        </div>
                        
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm">
                        <p className="text-muted-foreground">
                            Don't have an account?{' '}
                            <Link to="/register" className="font-semibold text-primary hover:underline">
                                Register here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
