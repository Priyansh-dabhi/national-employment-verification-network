import React from 'react';

const AnimatedStatusDot = ({ status }) => {
    let colorClass = 'bg-gray-500';
    let pulseClass = '';

    switch (status) {
        case 'SYNCED':
            colorClass = 'bg-statusGreen shadow-glow-green';
            break;
        case 'CATCHING_UP':
            colorClass = 'bg-statusAmber';
            pulseClass = 'animate-pulse';
            break;
        case 'OFFLINE':
            colorClass = 'bg-statusRed shadow-glow-red';
            break;
        default:
            break;
    }

    return (
        <div className="relative flex h-3 w-3 items-center justify-center">
            {status === 'CATCHING_UP' && (
                <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${colorClass} ${pulseClass}`}></span>
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${colorClass}`}></span>
        </div>
    );
};

export default AnimatedStatusDot;
