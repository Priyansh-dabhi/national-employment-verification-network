import React from 'react';
import { motion } from 'framer-motion';

const GlassCard = ({ children, title, className = '', hoverEffect = false, noPadding = false }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`glass-panel rounded-2xl overflow-hidden flex flex-col ${hoverEffect ? 'glass-panel-hover' : ''} ${className}`}
        >
            {title && (
                <div className="px-6 py-4 border-b border-borderGlow/70 bg-surfaceHighlight/30">
                    <h2 className="text-lg font-mono font-medium tracking-wide text-gray-100 uppercase">
                        {title}
                    </h2>
                </div>
            )}
            <div className={`flex-1 ${noPadding ? '' : 'p-6'}`}>
                {children}
            </div>
        </motion.div>
    );
};

export default GlassCard;
