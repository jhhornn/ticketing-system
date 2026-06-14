import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { ThemeSwitcher } from '../ThemeSwitcher';

export const MainLayout: React.FC = () => {
    return (
        <div className="flex h-screen bg-background text-foreground">
            <Sidebar />
            <main className="flex-1 flex flex-col">
                <header className="flex justify-end items-center p-4 border-b">
                </header>
                <div className="flex-1 p-4 overflow-y-auto">
                    <Outlet />
                </div>
            </main>
            <div className="fixed bottom-4 right-4 z-50">
                <ThemeSwitcher />
            </div>
        </div>
    );
};
