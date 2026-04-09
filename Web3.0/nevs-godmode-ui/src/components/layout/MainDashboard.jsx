import React from 'react';

const MainDashboard = ({ children }) => {
    return (
        <div className="min-h-screen bg-background text-gray-200 font-sans selection:bg-accentCyan/30 relative overflow-hidden flex flex-col">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-grid opacity-50 z-0 pointer-events-none" />

            {/* Radial Gradient overlay for depth */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-accentCyan/5 blur-[150px] rounded-full pointer-events-none z-0" />

            {/* Header */}
            <header className="relative z-10 border-b border-borderGlow/50 bg-surface/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-sm bg-accentCyan/10 border border-accentCyan flex justify-center items-center font-mono text-accentCyan font-bold shadow-glow-cyan text-sm">
                        N
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-widest text-white uppercase drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]">
                            NEVS Command Center
                        </h1>
                        <p className="text-xs font-mono text-accentCyan/70">DISTRIBUTED LEDGER GOD VIEW</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden sm:flex flex-col text-right">
                        <span className="text-xs uppercase text-gray-400 font-mono tracking-wider">Network</span>
                        <span className="text-sm font-mono text-white">Fabric CCaaS v2.5</span>
                    </div>
                    <div className="hidden sm:flex flex-col text-right">
                        <span className="text-xs uppercase text-gray-400 font-mono tracking-wider">Live Time</span>
                        <span className="text-sm font-mono text-accentCyan drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]">
                            {new Date().toLocaleTimeString('en-US', { hour12: false })}
                        </span>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="relative z-10 flex-1 p-6 overflow-y-auto">
                {children}
            </main>
        </div>
    );
};

export default MainDashboard;
