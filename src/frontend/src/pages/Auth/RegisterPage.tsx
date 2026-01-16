import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';

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
            const response = await api.post<{ success: boolean; data: { accessToken: string; user: any } }>('/auth/register', formData);
            const { accessToken, user } = response.data.data;
            
            login(accessToken, user);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '2rem', backgroundColor: '#f5f5f5' }}>
            <form onSubmit={handleRegister} style={{ padding: '2rem', border: '1px solid #ddd', borderRadius: '8px', minWidth: '350px', maxWidth: '400px', backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <h1 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Create Account</h1>
                
                {error && (
                    <div style={{ color: '#d32f2f', marginBottom: '1rem', padding: '0.75rem', background: '#ffebee', borderRadius: '4px', fontSize: '0.9rem', border: '1px solid #ef9a9a' }}>
                        {error}
                    </div>
                )}
                
                <input
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    style={{ display: 'block', marginBottom: '1rem', padding: '0.75rem', width: '100%', boxSizing: 'border-box', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
                />

                <input
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    style={{ display: 'block', marginBottom: '1rem', padding: '0.75rem', width: '100%', boxSizing: 'border-box', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
                />
                
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    style={{ display: 'block', marginBottom: '1rem', padding: '0.75rem', width: '100%', boxSizing: 'border-box', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
                />
                
                <input
                    type="password"
                    name="password"
                    placeholder="Password (min 6 characters)"
                    value={formData.password}
                    onChange={handleChange}
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
                    {loading ? 'Creating Account...' : 'Create Account'}
                </button>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: '#666' }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: '#1976d2', textDecoration: 'none', fontWeight: '500' }}>
                        Login here
                    </Link>
                </div>
            </form>
        </div>
    );
};
