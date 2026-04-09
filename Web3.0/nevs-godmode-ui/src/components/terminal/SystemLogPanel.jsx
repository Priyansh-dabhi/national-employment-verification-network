import React, { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';
import { useDashboard } from '../../store/DashboardContext';

const SystemLogPanel = () => {
    const { logs } = useDashboard();
    const containerRef = useRef(null);

    // Auto-scroll to bottom whenever logs change
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [logs]);

    const getLogColor = (type) => {
        switch (type) {
            case 'info': return 'text-accentCyan/80';
            case 'success': return 'text-statusGreen';
            case 'warn': return 'text-statusAmber';
            case 'error': return 'text-statusRed';
            default: return 'text-gray-400';
        }
    };

    return (
        <div className="glass-panel rounded-xl flex flex-col h-full border-borderGlow/30 overflow-hidden shadow-glow-cyan/10">
            <div className="px-4 py-3 border-b border-borderGlow/50 bg-surfaceHighlight/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-accentCyan" />
                    <h2 className="text-xs font-mono font-bold tracking-widest text-white uppercase">Live System Terminal</h2>
                </div>
                <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-statusRed/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-statusAmber/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-statusGreen/50" />
                </div>
            </div>

            <div
                ref={containerRef}
                className="flex-1 p-4 overflow-y-auto bg-black/40 font-mono text-[11px] leading-relaxed flex flex-col gap-1.5"
            >
                {logs.map((log) => (
                    <div key={log.id} className="flex hover:bg-white/5 px-1 rounded transition-colors group">
                        <span className="text-gray-600 mr-3 min-w-[65px]">
                            {log.timestamp.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <span className="text-gray-500 mr-2 opacity-50 select-none">&gt;</span>
                        <span className={`${getLogColor(log.type)} group-hover:brightness-125 transition-all break-all`}>
                            {log.message}
                        </span>
                    </div>
                ))}
                {/* Blinking cursor */}
                <div className="flex mt-1 h-4">
                    <span className="text-gray-600 mr-3 min-w-[65px]"></span>
                    <span className="text-accentCyan animate-pulse">█</span>
                </div>
            </div>
        </div>
    );
};

export default SystemLogPanel;
