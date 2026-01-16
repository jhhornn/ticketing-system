import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';

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
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f5f5f5' }}>
            <form onSubmit={handleLogin} style={{ padding: '2rem', border: '1px solid #ddd', borderRadius: '8px', minWidth: '350px', backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <h1 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Login</h1>
                
                {error && (
                    <div style={{ color: '#d32f2f', marginBottom: '1rem', padding: '0.75rem', background: '#ffebee', borderRadius: '4px', border: '1px solid #ef9a9a' }}>
                        {error}
                    </div>
                )}
                
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ display: 'block', marginBottom: '1rem', padding: '0.75rem', width: '100%', boxSizing: 'border-box', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
                />
                
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    style={{ display: 'block', marginBottom: '1.5rem', padding: '0.75rem', width: '100%', boxSizing: 'border-box', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
                />
                
                <button 
                    type="submit" 
                    disabled={loading}
                    style={{ 
                        display: 'block',
                        padding: '0.75rem 1rem', 
                        background: loading ? '#ccc' : '#1976d2', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px',
                        width: '100%',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '1rem',
                        fontWeight: '500',
                        transition: 'background 0.2s'
                    }}
                >
                    {loading ? 'Logging in...' : 'Login'}
                </button>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: '#666' }}>
                    Don't have an account?{' '}
                    <Link to="/register" style={{ color: '#1976d2', textDecoration: 'none', fontWeight: '500' }}>
                        Register here
                    </Link>
                </div>
            </form>
        </div>
    );
};
