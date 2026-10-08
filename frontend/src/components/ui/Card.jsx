import { motion } from 'framer-motion';
import { motionVariants } from '../../design-system/motion.js';

export default function Card({
  animated = false,
  interactive = false,
  className = '',
  children,
  ...props
}) {
  const classes = [
    'min-w-0',
    'rounded-2xl',
    'border',
    'border-white/10',
    'bg-white/[0.055]',
    'backdrop-blur-xl',
    'shadow-[0_18px_60px_-28px_rgba(0,0,0,0.75)]',
    'relative',
    'overflow-hidden',

    // Subtle glass highlight
    'before:pointer-events-none',
    'before:absolute',
    'before:inset-0',
    'before:rounded-[inherit]',
    'before:border',
    'before:border-white/[0.035]',
    'before:content-[""]',

    interactive
      ? [
          'transition-all',
          'duration-200',
          'ease-out',
          'hover:-translate-y-1',
          'hover:border-cyan-300/20',
          'hover:bg-white/[0.075]',
          'hover:shadow-[0_24px_70px_-28px_rgba(34,211,238,0.22)]',
        ].join(' ')
      : '',

    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (animated || interactive) {
    return (
      <motion.div
        variants={animated ? motionVariants.card : undefined}
        initial={animated ? 'initial' : undefined}
        animate={animated ? 'animate' : undefined}
        whileHover={interactive ? { y: -4 } : undefined}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={classes}
        {...props}
      >
        <div className="relative z-10">
          {children}
        </div>
      </motion.div>
    );
  }

  return (
    <article className={classes} {...props}>
      <div className="relative z-10">
        {children}
      </div>
    </article>
  );
}