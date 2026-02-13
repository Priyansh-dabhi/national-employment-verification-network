import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

interface CardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, hover = false, ...props }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={hover ? { y: -5, boxShadow: '0 10px 40px rgba(0,0,0,0.2)' } : {}}
            className={`glass-panel ${className || ''}`}
            {...props}
            style={{
                padding: '2rem',
                width: '100%',
                ...props.style
            }}
        >
            {children}
        </motion.div>
    );
};
