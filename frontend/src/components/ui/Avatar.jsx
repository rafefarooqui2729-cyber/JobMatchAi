
import { useEffect, useState } from 'react';

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

  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  const showImage =
    typeof src === 'string' &&
    src.trim().length > 0 &&
    !imageFailed;

  return (
    <span
      aria-label={name ? `${name} avatar` : 'Avatar'}
      role="img"
      className={`
        relative inline-grid shrink-0 place-items-center
        overflow-hidden rounded-2xl border border-white/15
        bg-slate-900 font-semibold text-cyan-100
        shadow-[0_8px_25px_rgba(0,0,0,0.2)]
        ${sizeClass}
        ${className}
      `}
    >
      {showImage ? (
        <img
          src={src}
          alt=""
          onError={() => setImageFailed(true)}
          className="
            absolute inset-0 h-full w-full
            rounded-[inherit] object-contain p-1.5
          "
        />
      ) : (
        <span aria-hidden="true" className="relative z-10">
          {initials(name)}
        </span>
      )}

      <span
        aria-hidden="true"
        className="
          pointer-events-none absolute inset-0
          rounded-[inherit] ring-1 ring-inset ring-white/15
        "
      />
    </span>
  );
}
