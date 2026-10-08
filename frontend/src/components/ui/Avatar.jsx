const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-xl',
};

function initials(name = '') {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || '?'
  );
}

export default function Avatar({
  name,
  src,
  size = 'md',
  className = '',
}) {
  const sizeClass = sizes[size] || sizes.md;

  if (src) {
    return (
      <div
        className={`
          relative
          shrink-0
          rounded-full
          border
          border-white/20
          bg-white/10
          p-0.5
          shadow-[0_8px_25px_rgba(0,0,0,0.2)]
          ${sizeClass}
          ${className}
        `}
      >
        <img
          src={src}
          alt={name ? `${name} avatar` : 'Avatar'}
          className="
            h-full
            w-full
            rounded-full
            object-cover
          "
        />

        <span
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            inset-0
            rounded-full
            ring-1
            ring-inset
            ring-white/20
          "
        />
      </div>
    );
  }

  return (
    <span
      aria-label={name || 'Avatar'}
      role="img"
      className={`
        relative
        inline-grid
        shrink-0
        place-items-center
        overflow-hidden
        rounded-full
        border
        border-white/20
        bg-gradient-to-br
        from-white/[0.16]
        via-cyan-400/[0.10]
        to-blue-500/[0.08]
        font-semibold
        text-cyan-100
        shadow-[0_8px_25px_rgba(0,0,0,0.2)]
        backdrop-blur-xl
        ${sizeClass}
        ${className}
      `}
    >
      {/* Soft glass highlight */}
      <span
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          rounded-full
          bg-gradient-to-br
          from-white/15
          via-transparent
          to-transparent
        "
      />

      {/* Initials */}
      <span className="relative z-10">
        {initials(name)}
      </span>

      {/* Inner border */}
      <span
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          rounded-full
          ring-1
          ring-inset
          ring-white/10
        "
      />
    </span>
  );
}