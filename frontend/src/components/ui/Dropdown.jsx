import { useEffect, useRef, useState } from 'react';

export default function Dropdown({
  label,
  children,
  align = 'end',
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    function closeOnOutside(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function closeOnEscape(event) {
      if (event.key === 'Escape' && open) {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener('pointerdown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.removeEventListener('pointerdown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={`relative inline-block ${className}`}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`
          group
          relative
          inline-flex
          min-h-10
          items-center
          gap-2
          overflow-hidden
          rounded-xl
          border
          px-3.5
          text-sm
          font-semibold
          text-slate-100
          outline-none
          backdrop-blur-xl
          transition-all
          duration-200

          ${
            open
              ? 'border-cyan-300/30 bg-white/[0.10] shadow-[0_0_24px_rgba(34,211,238,0.08)]'
              : 'border-white/10 bg-white/[0.055] hover:border-white/15 hover:bg-white/[0.08]'
          }

          focus-visible:border-cyan-300/40
          focus-visible:ring-4
          focus-visible:ring-cyan-400/10
        `}
      >
        {/* Top glass highlight */}
        <span
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            inset-x-3
            top-0
            h-px
            bg-gradient-to-r
            from-transparent
            via-white/25
            to-transparent
          "
        />

        <span className="relative z-10">
          {label}
        </span>

        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          className={`
            relative
            z-10
            h-4
            w-4
            text-slate-400
            transition-transform
            duration-200
            ${open ? 'rotate-180 text-cyan-300' : ''}
          `}
        >
          <path
            d="m5 7.5 5 5 5-5"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className={`
            absolute
            z-40
            mt-2
            min-w-52
            overflow-hidden
            rounded-2xl
            border
            border-white/10
            bg-slate-950/90
            p-1.5
            shadow-[0_20px_60px_rgba(0,0,0,0.38)]
            backdrop-blur-2xl

            ${
              align === 'start'
                ? 'left-0'
                : 'right-0'
            }
          `}
          onClick={(event) => {
            if (event.target.closest('[role="menuitem"]')) {
              setOpen(false);
            }
          }}
        >
          {/* Dropdown top highlight */}
          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              inset-x-4
              top-0
              h-px
              bg-gradient-to-r
              from-transparent
              via-cyan-300/30
              to-transparent
            "
          />

          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({
  children,
  onClick,
  destructive = false,
  ...props
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`
        group
        relative
        flex
        min-h-10
        w-full
        items-center
        overflow-hidden
        rounded-xl
        px-3
        text-left
        text-sm
        outline-none
        transition-all
        duration-150

        ${
          destructive
            ? `
              text-rose-300
              hover:bg-rose-400/[0.08]
              hover:text-rose-200
              focus-visible:bg-rose-400/[0.10]
            `
            : `
              text-slate-200
              hover:bg-white/[0.075]
              hover:text-white
              focus-visible:bg-cyan-400/[0.08]
              focus-visible:text-white
            `
        }

        focus-visible:ring-2
        ${
          destructive
            ? 'focus-visible:ring-rose-400/20'
            : 'focus-visible:ring-cyan-400/20'
        }
      `}
      {...props}
    >
      {/* Hover highlight */}
      <span
        aria-hidden="true"
        className={`
          pointer-events-none
          absolute
          inset-y-2
          left-0
          w-px
          rounded-full
          opacity-0
          transition-opacity
          duration-150
          group-hover:opacity-100
          group-focus-visible:opacity-100
          ${
            destructive
              ? 'bg-rose-300'
              : 'bg-cyan-300'
          }
        `}
      />

      <span className="relative z-10">
        {children}
      </span>
    </button>
  );
}