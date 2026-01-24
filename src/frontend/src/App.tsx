import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ModalProvider } from './context/ModalContext';
import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './pages/Auth/LoginPage';
import { RegisterPage } from './pages/Auth/RegisterPage';
import { DashboardPage } from './pages/Dashboard/DashboardPage';

import { EventsPage } from './pages/Events/EventsPage';
import { MyEventsPage } from './pages/Events/MyEventsPage';
import { McpPage } from './pages/Mcp/McpPage';
import { MyBookingsPage } from './pages/Bookings/MyBookingsPage';
import { EventDetailsPage } from './pages/Bookings/EventDetailsPage';
import { CheckoutPage } from './pages/Bookings/CheckoutPage';
import { VenuesPage } from './pages/Venues/VenuesPage';
import { ProfilePage } from './pages/Profile/ProfilePage';

// Simple protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, isLoading } = useAuth();
  if (isLoading) return <div>Loading...</div>;
  if (!token) return <Navigate to="/login" />;
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ModalProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="events" element={<EventsPage />} />
              <Route path="my-events" element={<MyEventsPage />} />
              <Route path="events/:id" element={<EventDetailsPage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="bookings" element={<MyBookingsPage />} />
              <Route path="venues" element={<VenuesPage />} />

              <Route path="mcp" element={<McpPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="settings" element={<div>Settings Component</div>} />
            </Route>
          </Routes>
        </ModalProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
