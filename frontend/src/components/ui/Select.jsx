import { forwardRef, useId } from 'react';

const Select = forwardRef(function Select(
  {
    label,
    hint,
    error,
    options = [],
    placeholder,
    id: suppliedId,
    className = '',
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const id = suppliedId || generatedId;

  const describedBy =
    [
      hint && `${id}-hint`,
      error && `${id}-error`,
      props['aria-describedby'],
    ]
      .filter(Boolean)
      .join(' ') || undefined;

  const hasValue =
    props.value !== '' &&
    props.value !== undefined &&
    props.value !== null;

  return (
    <div className={`min-w-0 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="
            mb-2
            block
            text-sm
            font-semibold
            text-slate-200
          "
        >
          {label}

          {props.required && (
            <span
              aria-hidden="true"
              className="ml-1 text-rose-300"
            >
              *
            </span>
          )}
        </label>
      )}

      <div className="relative">
        <select
          ref={ref}
          id={id}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          className={`
            min-h-11
            w-full
            appearance-none
            rounded-xl
            border
            bg-white/[0.045]
            px-3.5
            py-2.5
            pr-10
            text-sm
            outline-none
            backdrop-blur-xl
            transition-all
            duration-200

            ${
              hasValue
                ? 'text-white'
                : 'text-slate-500'
            }

            ${
              error
                ? `
                  border-rose-400/40
                  focus:border-rose-300/60
                  focus:ring-4
                  focus:ring-rose-400/10
                `
                : `
                  border-white/10
                  text-slate-200
                  hover:border-white/15
                  focus:border-cyan-300/50
                  focus:bg-white/[0.065]
                  focus:ring-4
                  focus:ring-cyan-400/10
                `
            }
          `}
          {...props}
        >
          {placeholder && (
            <option
              value=""
              className="bg-slate-900 text-slate-400"
            >
              {placeholder}
            </option>
          )}

          {options.map((option) => {
            const value =
              typeof option === 'string'
                ? option
                : option.value;

            const labelText =
              typeof option === 'string'
                ? option
                : option.label;

            return (
              <option
                key={value}
                value={value}
                className="bg-slate-900 text-slate-100"
              >
                {labelText}
              </option>
            );
          })}
        </select>

        {/* Custom dropdown icon */}
        <span
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            right-3
            top-1/2
            -translate-y-1/2
            text-slate-400
          "
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-4 w-4"
          >
            <path
              d="m7 10 5 5 5-5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>

      {hint && (
        <p
          id={`${id}-hint`}
          className="
            mt-1.5
            text-xs
            leading-5
            text-slate-500
          "
        >
          {hint}
        </p>
      )}

      {error && (
        <p
          id={`${id}-error`}
          className="
            mt-1.5
            text-xs
            font-medium
            text-rose-300
          "
        >
          {error}
        </p>
      )}
    </div>
  );
});

export default Select;