export default function LoadingSkeleton({
  className = '',
  rounded = 'rounded-lg',
  label = 'Loading',
}) {
  return (
    <div
      role="status"
      aria-label={label}
      className={`
        relative
        overflow-hidden
        border
        border-white/[0.08]
        bg-white/[0.055]
        backdrop-blur-xl
        shadow-[0_10px_35px_rgba(0,0,0,0.12)]
        ${rounded}
        ${className}
      `}
    >
      {/* Glass shimmer */}
      <div
        aria-hidden="true"
        className="
          absolute
          inset-0
          -translate-x-full
          animate-[skeleton-glass-shimmer_1.8s_ease-in-out_infinite]
          bg-gradient-to-r
          from-transparent
          via-white/[0.12]
          to-transparent
        "
      />

      {/* Soft top highlight */}
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
          via-white/20
          to-transparent
        "
      />

      <span className="sr-only">{label}</span>
    </div>
  );
}