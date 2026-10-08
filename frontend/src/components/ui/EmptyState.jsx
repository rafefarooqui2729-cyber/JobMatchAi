import { motion } from 'framer-motion';

export default function EmptyState({
  title,
  description,
  action,
  icon,
  className = '',
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        relative
        flex
        min-h-56
        flex-col
        items-center
        justify-center
        overflow-hidden
        rounded-2xl
        border
        border-dashed
        border-white/15
        bg-white/[0.045]
        px-6
        py-10
        text-center
        backdrop-blur-xl
        shadow-[0_18px_50px_rgba(0,0,0,0.12)]
        ${className}
      `}
    >
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          left-1/2
          top-1/2
          h-40
          w-40
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-cyan-400/[0.055]
          blur-3xl
        "
      />

      {/* Top glass highlight */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-x-10
          top-0
          h-px
          bg-gradient-to-r
          from-transparent
          via-white/20
          to-transparent
        "
      />

      {icon && (
        <span
          aria-hidden="true"
          className="
            relative
            z-10
            mb-4
            grid
            h-12
            w-12
            place-items-center
            rounded-2xl
            border
            border-white/10
            bg-white/[0.07]
            text-xl
            text-cyan-200
            shadow-[0_10px_30px_rgba(0,0,0,0.15)]
            backdrop-blur-xl
          "
        >
          {icon}
        </span>
      )}

      <h3
        className="
          relative
          z-10
          text-base
          font-semibold
          text-white
        "
      >
        {title}
      </h3>

      {description && (
        <p
          className="
            relative
            z-10
            mt-2
            max-w-md
            text-sm
            leading-6
            text-slate-400
          "
        >
          {description}
        </p>
      )}

      {action && (
        <div className="relative z-10 mt-5">
          {action}
        </div>
      )}
    </motion.section>
  );
}