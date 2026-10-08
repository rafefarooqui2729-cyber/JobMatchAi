import { motion, useReducedMotion } from 'framer-motion';

export default function ProgressBar({
  value,
  max = 100,
  label,
  showValue = false,
  tone = 'navy',
  className = '',
}) {
  const reduceMotion = useReducedMotion();

  const numericValue = Number(value);
  const numericMax = Number(max);

  const percent =
    Number.isFinite(numericValue) &&
    Number.isFinite(numericMax) &&
    numericMax > 0
      ? Math.min(100, Math.max(0, (numericValue / numericMax) * 100))
      : 0;

  const tones = {
    navy: {
      fill: 'from-slate-300 via-slate-200 to-white',
      glow: 'shadow-[0_0_16px_rgba(255,255,255,0.20)]',
      accent: 'bg-white',
    },

    blue: {
      fill: 'from-blue-600 via-cyan-400 to-sky-300',
      glow: 'shadow-[0_0_20px_rgba(34,211,238,0.38)]',
      accent: 'bg-cyan-300',
    },

    success: {
      fill: 'from-emerald-600 via-emerald-400 to-teal-300',
      glow: 'shadow-[0_0_20px_rgba(52,211,153,0.32)]',
      accent: 'bg-emerald-300',
    },

    warning: {
      fill: 'from-amber-600 via-amber-400 to-yellow-300',
      glow: 'shadow-[0_0_20px_rgba(251,191,36,0.30)]',
      accent: 'bg-amber-300',
    },
  };

  const selectedTone = tones[tone] || tones.navy;
  const accessibleLabel = label || 'Progress';
  const roundedPercent = Math.round(percent);

  return (
    <div className={`w-full ${className}`}>
      {(label || showValue) && (
        <div className="mb-2.5 flex items-center justify-between gap-3">
          {label ? (
            <span className="min-w-0 truncate text-xs font-medium text-slate-300">
              {label}
            </span>
          ) : (
            <span />
          )}

          {showValue && (
            <span className="shrink-0 text-xs font-semibold tabular-nums text-white">
              {roundedPercent}%
            </span>
          )}
        </div>
      )}

      <div
        className="
          relative
          h-3
          w-full
          overflow-hidden
          rounded-full
          border
          border-white/[0.10]
          bg-black/25
          shadow-[inset_0_1px_4px_rgba(0,0,0,0.35)]
          backdrop-blur-md
        "
        role="progressbar"
        aria-label={accessibleLabel}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={roundedPercent}
      >
        {/* Outer glass highlight */}
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            inset-x-0
            top-0
            z-20
            h-px
            bg-gradient-to-r
            from-transparent
            via-white/25
            to-transparent
          "
        />

        {/* Progress fill */}
        <motion.div
          className={`
            relative
            h-full
            overflow-hidden
            rounded-full
            bg-gradient-to-r
            ${selectedTone.fill}
            ${selectedTone.glow}
          `}
          initial={reduceMotion ? false : { width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{
            duration: reduceMotion ? 0 : 0.65,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {/* Top glass reflection */}
          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              inset-x-0
              top-0
              h-1/2
              bg-white/20
            "
          />

          {/* Soft inner glow */}
          <div
            aria-hidden="true"
            className={`
              pointer-events-none
              absolute
              right-0
              top-1/2
              h-2
              w-8
              -translate-y-1/2
              rounded-full
              blur-md
              ${selectedTone.accent}
              opacity-60
            `}
          />

          {/* Moving glass shine */}
          {!reduceMotion && percent > 0 && (
            <motion.div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                inset-y-0
                w-16
                bg-gradient-to-r
                from-transparent
                via-white/35
                to-transparent
                blur-sm
              "
              initial={{ left: '-25%' }}
              animate={{ left: '115%' }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                repeatDelay: 1.5,
                ease: 'easeInOut',
              }}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}