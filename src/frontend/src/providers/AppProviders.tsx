import React from 'react';
import { Toaster } from 'sonner';
import { AuthProvider } from '../context/AuthContext';
import { ModalProvider } from '../context/ModalContext';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Toaster richColors position="top-right" />
      <ModalProvider>{children}</ModalProvider>
    </AuthProvider>
  );
}
