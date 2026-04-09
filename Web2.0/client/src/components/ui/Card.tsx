import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

interface CardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, hover = false, style, ...props }) => {
  return (
    <motion.div
      className={`glass-panel ${className ?? ''}`.trim()}
      whileHover={hover ? { y: -2 } : undefined}
      style={{
        padding: '1.35rem',
        width: '100%',
        ...style,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};