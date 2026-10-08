import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { interactiveMotion } from '../../design-system/motion.js';

const variants = {
  primary: [
    'border-cyan-300/20',
    'bg-gradient-to-r',
    'from-cyan-400/90',
    'to-blue-500/90',
    'text-white',
    'shadow-[0_10px_30px_-12px_rgba(34,211,238,0.65)]',
    'hover:from-cyan-300',
    'hover:to-blue-400',
    'hover:border-cyan-200/40',
    'hover:shadow-[0_14px_40px_-12px_rgba(34,211,238,0.75)]',
  ].join(' '),

  secondary: [
    'border-white/15',
    'bg-white/[0.07]',
    'text-white',
    'backdrop-blur-xl',
    'shadow-[0_8px_30px_-18px_rgba(0,0,0,0.7)]',
    'hover:border-cyan-300/30',
    'hover:bg-white/[0.12]',
    'hover:text-cyan-50',
  ].join(' '),

  subtle: [
    'border-cyan-300/10',
    'bg-cyan-300/[0.08]',
    'text-cyan-100',
    'backdrop-blur-lg',
    'hover:border-cyan-300/20',
    'hover:bg-cyan-300/[0.14]',
  ].join(' '),

  danger: [
    'border-rose-300/20',
    'bg-rose-500/80',
    'text-white',
    'shadow-[0_10px_30px_-15px_rgba(244,63,94,0.65)]',
    'hover:bg-rose-500',
    'hover:border-rose-300/40',
    'hover:shadow-[0_14px_35px_-12px_rgba(244,63,94,0.7)]',
  ].join(' '),

  ghost: [
    'border-transparent',
    'bg-transparent',
    'text-slate-300',
    'hover:border-white/10',
    'hover:bg-white/[0.07]',
    'hover:text-white',
    'backdrop-blur-md',
  ].join(' '),
};

const sizes = {
  sm: 'min-h-9 px-3 text-xs',
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-12 px-5 text-sm',
};

const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    className = '',
    type = 'button',
    loading = false,
    disabled,
    children,
    ...props
  },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      whileTap={
        !disabled && !loading
          ? interactiveMotion.whileTap
          : undefined
      }
      transition={interactiveMotion.transition}
      className={[
        'relative',
        'inline-flex',
        'items-center',
        'justify-center',
        'gap-2',
        'overflow-hidden',
        'rounded-xl',
        'border',
        'font-semibold',
        'outline-none',
        'backdrop-blur-xl',
        'transition-all',
        'duration-200',
        'focus-visible:ring-4',
        'focus-visible:ring-cyan-300/20',
        'focus-visible:border-cyan-300/40',
        'disabled:pointer-events-none',
        'disabled:opacity-50',
        'disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {/* Glass highlight */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/25"
      />

      {loading && (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      )}

      <span className="relative z-10">
        {children}
      </span>
    </motion.button>
  );
});

export default Button;