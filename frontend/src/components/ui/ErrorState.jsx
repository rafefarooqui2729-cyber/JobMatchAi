import Button from './Button.jsx';

export default function ErrorState({
  title = 'Something went wrong',
  description = 'We could not load this information. Please try again.',
  onRetry,
  className = '',
}) {
  return (
    <section
      role="alert"
      className={`
        relative
        overflow-hidden
        rounded-2xl
        border
        border-rose-400/20
        bg-rose-500/[0.055]
        p-6
        backdrop-blur-xl
        shadow-[0_18px_50px_rgba(0,0,0,0.14)]
        ${className}
      `}
    >
      {/* Soft error glow */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -right-16
          -top-16
          h-36
          w-36
          rounded-full
          bg-rose-400/[0.08]
          blur-3xl
        "
      />

      {/* Top glass highlight */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-x-6
          top-0
          h-px
          bg-gradient-to-r
          from-transparent
          via-rose-200/20
          to-transparent
        "
      />

      <div className="relative z-10">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="
              grid
              h-9
              w-9
              shrink-0
              place-items-center
              rounded-xl
              border
              border-rose-300/20
              bg-rose-400/[0.08]
              text-rose-300
            "
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
            >
              <path
                d="M12 8v4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M12 16h.01"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              <path
                d="M10.3 4.6 3.5 16.4A2 2 0 0 0 5.23 19.4h13.54a2 2 0 0 0 1.73-3L13.7 4.6a2 2 0 0 0-3.4 0Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </span>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-rose-100">
              {title}
            </p>

            <p className="mt-1.5 text-sm leading-6 text-rose-200/75">
              {description}
            </p>

            {onRetry && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onRetry}
                className="
                  mt-4
                  border-rose-300/20
                  bg-rose-400/[0.07]
                  text-rose-100
                  hover:border-rose-300/30
                  hover:bg-rose-400/[0.12]
                "
              >
                Try again
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}