import { forwardRef, useId } from 'react';

const Input = forwardRef(function Input(
  {
    label,
    hint,
    error,
    id: suppliedId,
    className = '',
    inputClassName = '',
    leadingAdornment,
    trailingAdornment,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const id = suppliedId || generatedId;

  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  const describedBy =
    [hintId, errorId, props['aria-describedby']]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <div className={`min-w-0 ${className}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={id}
          className="mb-2 block text-sm font-semibold text-slate-200"
        >
          {label}

          {props.required && (
            <span
              aria-hidden="true"
              className="ml-1 text-rose-400"
            >
              *
            </span>
          )}
        </label>
      )}

      {/* Glass input */}
      <div
        className={[
          'group',
          'relative',
          'flex',
          'min-h-11',
          'items-center',
          'gap-2',
          'overflow-hidden',
          'rounded-xl',
          'border',
          'bg-white/[0.055]',
          'px-3',
          'backdrop-blur-xl',
          'shadow-[0_10px_35px_-25px_rgba(0,0,0,0.9)]',
          'transition-all',
          'duration-200',

          error
            ? [
                'border-rose-400/50',
                'focus-within:border-rose-300/70',
                'focus-within:ring-4',
                'focus-within:ring-rose-400/10',
              ].join(' ')
            : [
                'border-white/10',
                'hover:border-white/20',
                'focus-within:border-cyan-300/40',
                'focus-within:bg-white/[0.075]',
                'focus-within:ring-4',
                'focus-within:ring-cyan-300/10',
              ].join(' '),
        ].join(' ')}
      >
        {/* Top glass highlight */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
        />

        {/* Leading icon/content */}
        {leadingAdornment && (
          <span
            className={[
              'relative',
              'z-10',
              'shrink-0',
              'text-slate-400',
              'transition-colors',
              'duration-200',
              'group-focus-within:text-cyan-300',
            ].join(' ')}
          >
            {leadingAdornment}
          </span>
        )}

        {/* Input */}
        <input
          ref={ref}
          id={id}
          className={[
            'relative',
            'z-10',
            'min-w-0',
            'flex-1',
            'bg-transparent',
            'py-2.5',
            'text-sm',
            'text-white',
            'outline-none',
            'placeholder:text-slate-500',
            'disabled:cursor-not-allowed',
            'disabled:opacity-50',
            inputClassName,
          ].join(' ')}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          {...props}
        />

        {/* Trailing icon/content */}
        {trailingAdornment && (
          <span
            className={[
              'relative',
              'z-10',
              'shrink-0',
              'text-slate-400',
              'transition-colors',
              'duration-200',
              'group-focus-within:text-cyan-300',
            ].join(' ')}
          >
            {trailingAdornment}
          </span>
        )}
      </div>

      {/* Hint */}
      {hint && (
        <p
          id={hintId}
          className="mt-1.5 text-xs leading-5 text-slate-400"
        >
          {hint}
        </p>
      )}

      {/* Error */}
      {error && (
        <p
          id={errorId}
          className="mt-1.5 text-xs font-medium leading-5 text-rose-400"
        >
          {error}
        </p>
      )}
    </div>
  );
});

export default Input;