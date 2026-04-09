import React from 'react';
import AnimatedStatusDot from '../shared/AnimatedStatusDot';
import { Server, Cpu } from 'lucide-react';

const PeerCard = ({ name, status, height, networkHeight }) => {
    const isOnline = status !== 'OFFLINE';
    const progress = isOnline && networkHeight > 0
        ? Math.min((height / networkHeight) * 100, 100)
        : 0;

    return (
        <div className={`p-4 rounded-xl border transition-all duration-300 ${isOnline ? 'bg-surfaceHighlight/50 border-borderGlow/80' : 'bg-surface/30 border-statusRed/20 grayscaleopacity-75'
            }`}>
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 ${isOnline ? 'bg-accentCyan/10 text-accentCyan' : 'bg-statusRed/10 text-statusRed'}`}>
                        <Server className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-gray-200 font-mono font-medium truncate" title={name}>{name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <AnimatedStatusDot status={status} />
                            <span className={`text-xs font-mono tracking-wider uppercase ${status === 'SYNCED' ? 'text-statusGreen' :
                                status === 'CATCHING_UP' ? 'text-statusAmber' : 'text-statusRed'
                                }`}>
                                {status}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-2 mt-4">
                <div className="flex justify-between text-xs font-mono text-gray-400">
                    <span>Block Height</span>
                    <span>{isOnline ? height : '--'} / {networkHeight}</span>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-surfaceHighlight rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-1000 ${status === 'SYNCED' ? 'bg-statusGreen shadow-glow-green' :
                            status === 'CATCHING_UP' ? 'bg-statusAmber' : 'bg-transparent'
                            }`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

export default PeerCard;
