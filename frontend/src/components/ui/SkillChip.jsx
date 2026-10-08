import Badge from './Badge.jsx';

export default function SkillChip({
  children,
  missing = false,
  removable = false,
  onRemove,
  className = '',
}) {
  return (
    <Badge
      tone={missing ? 'warning' : 'navy'}
      className={`
        inline-flex
        items-center
        gap-1
        transition-all
        duration-200
        ${
          missing
            ? 'border-amber-300/20 bg-amber-400/[0.08] text-amber-200'
            : 'border-cyan-300/15 bg-cyan-400/[0.055] text-slate-200'
        }
        ${className}
      `}
    >
      <span>{children}</span>

      {removable && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${children}`}
          className={`
            ml-0.5
            inline-grid
            h-4
            w-4
            shrink-0
            place-items-center
            rounded-full
            text-current
            opacity-70
            outline-none
            transition-all
            duration-150
            hover:bg-white/10
            hover:opacity-100
            focus-visible:ring-2
            ${
              missing
                ? 'focus-visible:ring-amber-300/30'
                : 'focus-visible:ring-cyan-300/30'
            }
          `}
        >
          <span
            aria-hidden="true"
            className="text-xs leading-none"
          >
            ×
          </span>
        </button>
      )}
    </Badge>
  );
}