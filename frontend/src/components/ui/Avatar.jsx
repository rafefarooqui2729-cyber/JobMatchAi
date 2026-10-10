
import { useState } from 'react';

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
  name = '',
  src,
  size = 'md',
  className = '',
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const sizeClass = sizes[size] || sizes.md;
  const showImage =
    typeof src === 'string' &&
    src.trim().length > 0 &&
    !imageFailed;

  const containerClass = `
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
    ${sizeClass}
    ${className}
  `;

  return (
    <span
      aria-label={name ? `${name} avatar` : 'Avatar'}
      role="img"
      className={containerClass}
    >
      {showImage && (
        <img
          src={src}
          alt=""
          onError={() => setImageFailed(true)}
          className="
            absolute
            inset-0
            h-full
            w-full
            rounded-[inherit]
            object-cover
          "
        />
      )}

      {!showImage && (
        <span aria-hidden="true" className="relative z-10">
          {initials(name)}
        </span>
      )}

      <span
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          rounded-[inherit]
          ring-1
          ring-inset
          ring-white/20
        "
      />
    </span>
  );
}
