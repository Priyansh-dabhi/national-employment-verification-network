import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends HTMLMotionProps<"button"> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading,
    className,
    ...props
}) => {
    // Note: Using inline styles for quick iteration, ideally use classNames or utility classes defined in index.css
    // Mapping custom classes to style objects or keeping them as className strings if we were using Tailwind.
    // Since we are using Vanilla CSS + Utility classes approach (from index.css), let's rely on standard styles
    // But for this project, I will write the styles directly in a style object or minimal CSS classes for simplicity of the artifact
    // OR, I can use the style prop for dynamic values and classes for static.

    // Actually, to make it "Vanilla CSS" compliant as requested, I should use the classes I defined or inline styles.
    // I will use a hybrid approach: style generic structure in CSS or inline for specific components.
    // Let's use a specific style block or CSS modules ideally, but for speed in this agent flow, I'll use inline styles for the dynamic parts 
    // and rely on the global CSS variables.

    const getVariantStyle = () => {
        switch (variant) {
            case 'primary': return { background: 'var(--color-highlight)', color: '#0f172a', border: 'none' };
            case 'secondary': return { background: 'var(--color-accent)', color: '#0f172a', border: 'none' };
            case 'outline': return { background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--color-text-main)' };
            case 'ghost': return { background: 'transparent', border: 'none', color: 'var(--color-text-muted)' };
        }
    };

    const getSizeStyle = () => {
        switch (size) {
            case 'sm': return { padding: '0.4rem 0.8rem', fontSize: '0.875rem' };
            case 'md': return { padding: '0.6rem 1.2rem', fontSize: '1rem' };
            case 'lg': return { padding: '0.8rem 1.6rem', fontSize: '1.125rem' };
        }
    };

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
                ...getVariantStyle(),
                ...getSizeStyle(),
                borderRadius: 'var(--radius-md)',
                cursor: isLoading ? 'wait' : 'pointer',
                fontWeight: 600,
                opacity: props.disabled ? 0.6 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                ...props.style
            }}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading ? "Loading..." : children}
        </motion.button>
    );
};
