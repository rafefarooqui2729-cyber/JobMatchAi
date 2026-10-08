const tones = {
  neutral: [
    'border-white/10',
    'bg-white/[0.06]',
    'text-slate-300',
  ].join(' '),

  navy: [
    'border-blue-300/15',
    'bg-blue-400/[0.08]',
    'text-blue-200',
  ].join(' '),

  success: [
    'border-emerald-300/20',
    'bg-emerald-400/[0.08]',
    'text-emerald-300',
  ].join(' '),

  warning: [
    'border-amber-300/20',
    'bg-amber-400/[0.08]',
    'text-amber-300',
  ].join(' '),

  danger: [
    'border-rose-300/20',
    'bg-rose-400/[0.08]',
    'text-rose-300',
  ].join(' '),

  info: [
    'border-cyan-300/20',
    'bg-cyan-400/[0.08]',
    'text-cyan-200',
  ].join(' '),
};

export default function Badge({
  tone = 'neutral',
  size = 'sm',
  dot = false,
  className = '',
  children,
  ...props
}) {
  return (
    <span
      className={[
        'inline-flex',
        'max-w-full',
        'items-center',
        'gap-1.5',
        'rounded-full',
        'border',
        'font-semibold',
        'backdrop-blur-md',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',

        size === 'md'
          ? 'px-3 py-1.5 text-xs'
          : 'px-2.5 py-1 text-[11px]',

        tones[tone] || tones.neutral,

        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {dot && (
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-current shadow-[0_0_8px_currentColor]"
        />
      )}

      <span className="truncate">
        {children}
      </span>
    </span>
  );
}