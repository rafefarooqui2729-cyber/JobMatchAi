import { motion } from 'framer-motion';
import { motionVariants } from '../../design-system/motion.js';

export default function StatCard({
  label,
  value,
  detail,
  icon,
  trend,
  className = '',
}) {
  return (
    <motion.article
      variants={motionVariants.card}
      initial="initial"
      animate="animate"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={[
        'group',
        'relative',
        'overflow-hidden',
        'rounded-2xl',
        'border',
        'border-white/10',
        'bg-gradient-to-br',
        'from-white/[0.075]',
        'to-white/[0.035]',
        'p-5',
        'backdrop-blur-xl',
        'shadow-[0_20px_60px_-30px_rgba(0,0,0,0.85)]',
        'transition-all',
        'duration-200',
        'hover:border-cyan-300/20',
        'hover:from-white/[0.09]',
        'hover:to-white/[0.045]',
        'hover:shadow-[0_26px_70px_-30px_rgba(0,0,0,0.9),0_0_35px_-25px_rgba(34,211,238,0.35)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Top glass reflection */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />

      {/* Subtle cyan ambient glow */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-cyan-400/10 blur-3xl transition-opacity duration-300 group-hover:bg-cyan-400/15"
      />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-400">
            {label}
          </p>

          <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
            {value}
          </p>
        </div>

        {icon && (
          <span
            aria-hidden="true"
            className={[
              'grid',
              'h-10',
              'w-10',
              'shrink-0',
              'place-items-center',
              'rounded-xl',
              'border',
              'border-cyan-300/15',
              'bg-cyan-300/[0.08]',
              'text-cyan-200',
              'shadow-[0_8px_25px_-15px_rgba(34,211,238,0.65)]',
              'backdrop-blur-md',
              'transition-all',
              'duration-200',
              'group-hover:border-cyan-300/25',
              'group-hover:bg-cyan-300/[0.12]',
            ].join(' ')}
          >
            {icon}
          </span>
        )}
      </div>

      {(detail || trend) && (
        <p className="relative z-10 mt-4 text-xs leading-5 text-slate-400">
          {trend && (
            <span className="mr-1 font-semibold text-emerald-300">
              {trend}
            </span>
          )}

          {detail}
        </p>
      )}
    </motion.article>
  );
}