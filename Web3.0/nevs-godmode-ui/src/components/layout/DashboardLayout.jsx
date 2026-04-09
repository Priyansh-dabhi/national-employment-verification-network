import React from 'react';
import Header from './Header';

const DashboardLayout = ({ children }) => {
    return (
        <div className="min-h-screen bg-background text-gray-200 selection:bg-accentCyan/30">
            {/* Subtle background glow effect */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-accentCyan/5 rounded-full blur-[150px] pointer-events-none" />

            <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
                <Header />

                <main className="mt-8 space-y-6">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
