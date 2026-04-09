import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  className,
  disabled,
  type,
  style,
  ...props
}) => {
  const isDisabled = disabled || isLoading;

  return (
    <motion.button
      type={type ?? 'button'}
      whileHover={isDisabled ? undefined : { y: -1 }}
      whileTap={isDisabled ? undefined : { scale: 0.985 }}
      disabled={isDisabled}
      aria-busy={isLoading}
      className={[
        'ui-btn',
        `ui-btn--${variant}`,
        `ui-btn--${size}`,
        fullWidth ? 'ui-btn--block' : '',
        isLoading ? 'is-loading' : '',
        className || '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        ...style,
      }}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="ui-btn__spinner" aria-hidden="true" />
          <span>Please wait...</span>
        </>
      ) : (
        children
      )}
    </motion.button>
  );
};
