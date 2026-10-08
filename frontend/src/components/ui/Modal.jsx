import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motionVariants } from '../../design-system/motion.js';

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}) {
  const closeRef = useRef(null);
  const dialogRef = useRef(null);
  const previousFocus = useRef(null);

  const titleId = `modal-title-${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')}`;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
  };

  useEffect(() => {
    if (!open) return undefined;

    previousFocus.current = document.activeElement;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    const frame = requestAnimationFrame(() => {
      closeRef.current?.focus();
    });

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        onClose?.();
      }

      if (event.key === 'Tab') {
        const focusable =
          dialogRef.current?.querySelectorAll(
            'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
          );

        if (!focusable?.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (
          event.shiftKey &&
          document.activeElement === first
        ) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          document.activeElement === last
        ) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', onKeyDown);

    return () => {
      cancelAnimationFrame(frame);

      document.body.style.overflow = previousOverflow;

      document.removeEventListener(
        'keydown',
        onKeyDown,
      );

      previousFocus.current?.focus?.();
    };
  }, [open, onClose]);

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className={[
            'fixed',
            'inset-0',
            'z-[100]',
            'grid',
            'place-items-end',
            'bg-slate-950/70',
            'p-0',
            'backdrop-blur-md',
            'sm:place-items-center',
            'sm:p-6',
          ].join(' ')}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              onClose?.();
            }
          }}
        >
          {/* Ambient modal glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/[0.06] blur-[100px]"
          />

          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={
              description
                ? `${titleId}-description`
                : undefined
            }
            ref={dialogRef}
            variants={motionVariants.modal}
            initial="initial"
            animate="animate"
            exit="exit"
            className={[
              'relative',
              'z-10',
              'max-h-[92dvh]',
              'w-full',
              'overflow-y-auto',
              'rounded-t-2xl',
              'border',
              'border-white/10',
              'bg-gradient-to-br',
              'from-slate-900/90',
              'via-slate-950/85',
              'to-slate-900/90',
              'shadow-[0_35px_100px_-30px_rgba(0,0,0,0.95)]',
              'backdrop-blur-2xl',
              'sm:rounded-2xl',
              sizes[size] || sizes.md,
            ].join(' ')}
          >
            {/* Glass top highlight */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
            />

            {/* Cyan ambient edge */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-cyan-400/[0.07] blur-3xl"
            />

            {/* Header */}
            <header className="relative z-10 flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <h2
                  id={titleId}
                  className="text-lg font-semibold tracking-tight text-white"
                >
                  {title}
                </h2>

                {description && (
                  <p
                    id={`${titleId}-description`}
                    className="mt-1 text-sm leading-6 text-slate-400"
                  >
                    {description}
                  </p>
                )}
              </div>

              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className={[
                  'grid',
                  'h-9',
                  'w-9',
                  'shrink-0',
                  'place-items-center',
                  'rounded-xl',
                  'border',
                  'border-white/10',
                  'bg-white/[0.045]',
                  'text-xl',
                  'leading-none',
                  'text-slate-400',
                  'outline-none',
                  'backdrop-blur-md',
                  'transition-all',
                  'duration-200',
                  'hover:border-white/20',
                  'hover:bg-white/[0.09]',
                  'hover:text-white',
                  'focus-visible:ring-4',
                  'focus-visible:ring-cyan-300/15',
                ].join(' ')}
              >
                ×
              </button>
            </header>

            {/* Content */}
            {children != null && (
              <div className="relative z-10 p-5 sm:p-6">
                {children}
              </div>
            )}

            {/* Footer */}
            {footer && (
              <footer
                className={[
                  'relative',
                  'z-10',
                  'flex',
                  'flex-col-reverse',
                  'gap-2',
                  'border-t',
                  'border-white/10',
                  'bg-white/[0.02]',
                  'px-5',
                  'py-4',
                  'sm:flex-row',
                  'sm:justify-end',
                  'sm:px-6',
                ].join(' ')}
              >
                {footer}
              </footer>
            )}
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}