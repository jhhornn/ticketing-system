import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { Ticket } from 'lucide-react';

export const RegisterPage: React.FC = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            interface User {
                id: string;
                email: string;
                role: string;
                firstName: string;
                lastName: string;
                // Add other user fields as needed
            }

            const response = await api.post<{ success: boolean; data: { accessToken: string; user: User } }>('/auth/register', formData);
            const { accessToken, user } = response.data.data;

            // Ensure role is present; fallback to a default if needed
            const userWithRole = {
                ...user,
                role: user.role ?? 'user'
            };

            login(accessToken, userWithRole);
            navigate('/dashboard');
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data) {
                setError((err as { response: { data: { message: string } } }).response.data.message);
            } else {
                setError('Registration failed. Please try again.');
            }
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
                    <h1 className="text-3xl font-bold text-center mb-2 font-poppins">Create Your Account</h1>
                    <p className="text-muted-foreground text-center mb-8">Get started with a new account</p>
                    
                    {error && (
                        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-4 mb-6">
                            {error}
                        </div>
                    )}
                    
                    <form onSubmit={handleRegister} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="firstName" className="text-sm font-medium">First Name</label>
                                <input
                                    id="firstName"
                                    type="text"
                                    name="firstName"
                                    placeholder="John"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 bg-input rounded-lg border focus:ring-primary focus:border-primary transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="lastName" className="text-sm font-medium">Last Name</label>
                                <input
                                    id="lastName"
                                    type="text"
                                    name="lastName"
                                    placeholder="Doe"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 bg-input rounded-lg border focus:ring-primary focus:border-primary transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="email-register" className="text-sm font-medium">Email</label>
                            <input
                                id="email-register"
                                type="email"
                                name="email"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 bg-input rounded-lg border focus:ring-primary focus:border-primary transition-all"
                            />
                        </div>
                        
                        <div className="space-y-2">
                             <label htmlFor="password-register" className="text-sm font-medium">Password</label>
                            <input
                                id="password-register"
                                type="password"
                                name="password"
                                placeholder="•••••••• (min 6 characters)"
                                value={formData.password}
                                onChange={handleChange}
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
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm">
                        <p className="text-muted-foreground">
                            Already have an account?{' '}
                            <Link to="/login" className="font-semibold text-primary hover:underline">
                                Login here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
