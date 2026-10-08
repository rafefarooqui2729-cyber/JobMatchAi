import { motion, useReducedMotion } from 'framer-motion';

export default function MatchScore({
  score,
  size = 'md',
  label = 'match',
  className = '',
}) {
  const reduceMotion = useReducedMotion();

  const normalized = Number.isFinite(score)
    ? Math.min(100, Math.max(0, score))
    : 0;

  const dimensions = {
    sm: 52,
    md: 68,
    lg: 92,
  }[size];

  const stroke = size === 'sm' ? 5 : 6;
  const radius = (dimensions - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const tone =
    normalized >= 80
      ? {
          text: 'text-emerald-300',
          stroke: 'text-emerald-300',
          glow: 'rgba(52, 211, 153, 0.12)',
          border: 'border-emerald-300/20',
          background: 'bg-emerald-400/[0.055]',
        }
      : normalized >= 60
        ? {
            text: 'text-cyan-300',
            stroke: 'text-cyan-300',
            glow: 'rgba(34, 211, 238, 0.12)',
            border: 'border-cyan-300/20',
            background: 'bg-cyan-400/[0.055]',
          }
        : {
            text: 'text-slate-300',
            stroke: 'text-slate-300',
            glow: 'rgba(148, 163, 184, 0.08)',
            border: 'border-white/10',
            background: 'bg-white/[0.045]',
          };

  return (
    <div
      className={`
        relative
        inline-grid
        shrink-0
        place-items-center
        rounded-full
        border
        ${tone.border}
        ${tone.background}
        backdrop-blur-xl
        ${className}
      `}
      style={{
        width: dimensions,
        height: dimensions,
        boxShadow: `0 0 30px ${tone.glow}`,
      }}
      role="img"
      aria-label={`${Math.round(normalized)} percent ${label}`}
    >
      {/* Outer glass highlight */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          rounded-full
          bg-gradient-to-br
          from-white/[0.10]
          via-transparent
          to-transparent
        "
      />

      <svg
        width={dimensions}
        height={dimensions}
        viewBox={`0 0 ${dimensions} ${dimensions}`}
        className="relative -rotate-90"
        aria-hidden="true"
      >
        {/* Background track */}
        <circle
          cx={dimensions / 2}
          cy={dimensions / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-white/[0.08]"
        />

        {/* Score progress */}
        <motion.circle
          cx={dimensions / 2}
          cy={dimensions / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={
            reduceMotion
              ? false
              : {
                  strokeDashoffset: circumference,
                }
          }
          animate={{
            strokeDashoffset:
              circumference * (1 - normalized / 100),
          }}
          transition={{
            duration: reduceMotion ? 0 : 0.8,
            ease: [0.22, 1, 0.36, 1],
          }}
          className={tone.stroke}
          style={{
            filter: `drop-shadow(0 0 4px ${tone.glow})`,
          }}
        />
      </svg>

      {/* Score */}
      <span
        aria-hidden="true"
        className={`
          absolute
          font-bold
          tabular-nums
          tracking-tight
          ${tone.text}
          ${
            size === 'sm'
              ? 'text-xs'
              : size === 'lg'
                ? 'text-xl'
                : 'text-base'
          }
        `}
      >
        {Math.round(normalized)}
        <span className="text-[0.65em]">%</span>
      </span>
    </div>
  );
}