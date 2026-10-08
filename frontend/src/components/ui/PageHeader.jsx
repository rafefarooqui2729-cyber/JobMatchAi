import { motion } from 'framer-motion';
import { motionVariants } from '../../design-system/motion.js';

export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  breadcrumbs,
  className = '',
}) {
  return (
    <motion.header
      variants={motionVariants.card}
      initial="initial"
      animate="animate"
      className={`
        relative
        overflow-hidden
        rounded-3xl
        border border-white/10
        bg-white/[0.045]
        p-5
        backdrop-blur-xl
        shadow-[0_18px_60px_rgba(0,0,0,0.16)]
        sm:p-7
        ${className}
      `}
    >
      {/* Decorative glass glow */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -right-24
          -top-24
          h-56
          w-56
          rounded-full
          bg-cyan-400/10
          blur-3xl
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -bottom-32
          left-1/3
          h-48
          w-48
          rounded-full
          bg-blue-500/[0.07]
          blur-3xl
        "
      />

      {/* Top glass highlight */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-x-0
          top-0
          h-px
          bg-gradient-to-r
          from-transparent
          via-cyan-300/40
          to-transparent
        "
      />

      <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {breadcrumbs && (
            <nav
              aria-label="Breadcrumb"
              className="
                mb-3
                text-xs
                font-medium
                text-slate-400
              "
            >
              {breadcrumbs}
            </nav>
          )}

          {eyebrow && (
            <div className="mb-2 flex items-center gap-2">
              <span
                aria-hidden="true"
                className="
                  h-1.5
                  w-1.5
                  rounded-full
                  bg-cyan-300
                  shadow-[0_0_10px_rgba(103,232,249,0.8)]
                "
              />

              <p
                className="
                  text-[11px]
                  font-bold
                  uppercase
                  tracking-[0.2em]
                  text-cyan-300
                "
              >
                {eyebrow}
              </p>
            </div>
          )}

          <h1
            className="
              text-2xl
              font-semibold
              tracking-tight
              text-white
              sm:text-3xl
            "
          >
            {title}
          </h1>

          {description && (
            <p
              className="
                mt-2
                max-w-2xl
                text-sm
                leading-6
                text-slate-400
              "
            >
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div
            className="
              relative
              flex
              shrink-0
              flex-wrap
              items-center
              gap-2
            "
          >
            {actions}
          </div>
        )}
      </div>
    </motion.header>
  );
}